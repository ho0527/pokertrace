# import
import bcrypt
import hashlib
import itertools
import json
import random
import re
import eval7,random
# import google.oauth2.id_token
from django.http import HttpResponse,HttpResponseRedirect,JsonResponse
from django.views.decorators.http import require_http_methods
from rest_framework import status
from rest_framework.decorators import api_view,renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
# from google.oauth2 import id_token
# from google.auth.transport import requests

# 自創
from function.validation import *
from function.sql import *
from function.thing import *
from function.function import *
from .initialize import *
from .authhelper import gettokenuser as commonauthuser
from .hand import sessionaccess,boolval,intval,boardcardread,totalpotread

# main START
def ensuretablesettingcolumns():
	query(SETTING["dbname"],"""ALTER TABLE public."table" ADD COLUMN IF NOT EXISTS no integer""",[],SETTING["dbsetting"])
	query(SETTING["dbname"],"""
		DO $$
		BEGIN
			IF EXISTS(
				SELECT 1 FROM information_schema.columns
				WHERE table_schema='public' AND table_name='table' AND column_name='name'
			) THEN
				EXECUTE 'UPDATE public."table" SET no=CASE WHEN name ~ ''^[0-9]+$'' THEN name::integer ELSE id::integer END WHERE no IS NULL';
			ELSE
				UPDATE public."table" SET no=id::integer WHERE no IS NULL;
			END IF;
		END $$;
	""",[],SETTING["dbsetting"])
	query(SETTING["dbname"],"""ALTER TABLE public."table" ADD COLUMN IF NOT EXISTS firstdealerplace bigint DEFAULT 1""",[],SETTING["dbsetting"])
	query(SETTING["dbname"],"""ALTER TABLE public."table" ADD COLUMN IF NOT EXISTS selfseating bigint DEFAULT 1""",[],SETTING["dbsetting"])
	query(SETTING["dbname"],"""ALTER TABLE public."table" ADD COLUMN IF NOT EXISTS closedtime timestamp with time zone""",[],SETTING["dbsetting"])

def tableauthuser(request):
	"""Bearer token → 使用者列。**委派給共用的 authhelper.gettokenuser**。

	原本這裡是一份手寫的副本，檢查了 token、也檢查了使用者的 deletetime，
	但**沒有檢查封禁狀態** —— 共用版本有，而且註明了理由：
	「封禁時已撤銷 token，這裡再撤一次，避免封禁後才發出的 token 或漏撤的舊 token 仍可用」。

	結果是被封禁（type='ban'）或仍在限時封鎖期（type='block'）的使用者，
	只要手上的 token 還沒被撤，就能照常呼叫本模組的每一個端點。
	2026-07-30 稽核發現，改成委派。

	共用版本的 token 解析也比較嚴謹：`getbearertoken()` 會檢查 scheme 是不是
	bearer（不分大小寫）、處理多餘空白；原本的 `header.split("Bearer ")[1]`
	連 "Basic xyzBearer abc" 這種都切得出東西。
	"""
	return commonauthuser(request)

def tableowneraccess(sessionrow,userrow):
	if sessionrow["userid"]==userrow["id"] or 4<=int(userrow["permission"]):
		return True
	return False

# 牌桌管理權限: 擁有者/管理員之外, 該場次聘用的「裁判(floor)」也可關閉與併桌
# (裁判是 tableboard 的主要使用者; 計分員/助理不開放)。
def tablemanageaccess(sessionrow,userrow):
	if tableowneraccess(sessionrow,userrow):
		return True
	staffrow=query(SETTING["dbname"],"""SELECT 1 FROM "sessionstaff" WHERE "sessionid"=%s AND "staffuserid"=%s AND "role"='floor' AND "status"='active' AND "deletetime" IS NULL LIMIT 1""",[sessionrow["id"],userrow["id"]],SETTING["dbsetting"])
	return True if staffrow else False

def tableactiveplayers(sessionid,tableid):
	return query(SETTING["dbname"],"""
		SELECT sp."id" AS sessionplayerid,sp."userid",sp."seatno",sp."startchip",
			u."name",u."playerid"
		FROM "sessionplayer" sp
		JOIN "user" u ON u."id"=sp."userid"
		WHERE sp."sessionid"=%s AND sp."tableid"=%s AND sp."status"='confirmed' AND sp."seatno" IS NOT NULL AND sp."deletetime" IS NULL
		  AND NOT EXISTS(
			  SELECT 1 FROM "sessiontimerplayer" tp
			  WHERE tp."sessionid"=sp."sessionid" AND tp."sessionplayerid"=sp."id" AND tp."status"='eliminated' AND tp."deletetime" IS NULL
		  )
		ORDER BY sp."seatno" ASC
	""",[sessionid,tableid],SETTING["dbsetting"]) or []

def tableavailableplayers(sessionid):
	return query(SETTING["dbname"],"""
		SELECT sp."id" AS sessionplayerid,sp."userid",sp."seatno",sp."tableid",sp."startchip",
			u."name",u."playerid",t."no" AS tablename,t."token" AS tabletoken
		FROM "sessionplayer" sp
		JOIN "user" u ON u."id"=sp."userid"
		LEFT JOIN "table" t ON t."id"=sp."tableid" AND t."deletetime" IS NULL
		WHERE sp."sessionid"=%s AND sp."status"='confirmed' AND sp."deletetime" IS NULL
		  AND NOT EXISTS(
			  SELECT 1 FROM "sessiontimerplayer" tp
			  WHERE tp."sessionid"=sp."sessionid" AND tp."sessionplayerid"=sp."id" AND tp."status"='eliminated' AND tp."deletetime" IS NULL
		  )
		ORDER BY u."name" ASC,sp."id" ASC
	""",[sessionid],SETTING["dbsetting"]) or []

def tablecurrentplayers(sessionrow,tableid):
	maxseat=int(sessionrow.get("maxseat") or 9)
	currentplayers=[]
	for i in range(maxseat):
		currentplayers.append({
			"seatno": i+1,
			"player": None
		})
	if sessionrow.get("linkuser"):
		seatingrow=tableactiveplayers(sessionrow["id"],tableid)
		for seating in seatingrow:
			if 0<seating["seatno"] and seating["seatno"]<=len(currentplayers):
				currentplayers[seating["seatno"]-1]["player"]={
					"sessionplayerid": seating["sessionplayerid"],
					"userid": seating["userid"],
					"name": seating["name"],
					"playerid": seating["playerid"],
					"chip": seating.get("startchip") or sessionrow.get("chip") or 0,
					"unknownchip": intval(seating.get("startchip"),0)<0
				}
		return currentplayers
	seatingrow=query(SETTING["dbname"],"""SELECT*FROM "seating" WHERE "tableid"=%s AND "deletetime" IS NULL ORDER BY "seatno" ASC,"time" ASC,"id" ASC""",[tableid],SETTING["dbsetting"]) or []
	for seating in seatingrow:
		seatno=int(seating["seatno"] or 0)
		if seatno<=0 or len(currentplayers)<seatno:
			continue
		if seating["type"]=="leave":
			currentplayers[seatno-1]["player"]=None
		else:
			currentplayers[seatno-1]["player"]={
				"name": seating["name"] or "",
				"chip": seating.get("chip") or sessionrow.get("chip") or 0,
				"unknownchip": intval(seating.get("chip"),0)<0,
				"userid": seating.get("userid"),
				"sessionplayerid": seating.get("sessionplayerid")
			}
	return currentplayers

def lasttablechips(tableid):
	chips={}
	latestrow=query(SETTING["dbname"],"""SELECT*FROM "hand" WHERE "tableid"=%s AND "deletetime" IS NULL ORDER BY "createtime" DESC,"id" DESC LIMIT 1""",[tableid],SETTING["dbsetting"])
	if not latestrow:
		return chips
	seatingrow=query(SETTING["dbname"],"""SELECT*FROM "handseating" WHERE "handid"=%s AND "deletetime" IS NULL""",[latestrow[0]["id"]],SETTING["dbsetting"]) or []
	for seating in seatingrow:
		if seating.get("sessionplayerid"):
			chips["sp:"+str(seating["sessionplayerid"])]=seating.get("endchip") or seating.get("chip") or 0
		elif seating.get("userid"):
			chips["u:"+str(seating["userid"])]=seating.get("endchip") or seating.get("chip") or 0
		elif seating.get("name"):
			chips["n:"+str(seating["name"])]=seating.get("endchip") or seating.get("chip") or 0
	return chips

@api_view(["GET"])
def gettablelist(request,sessionid):
	ensuretablesettingcolumns()
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	row=query(SETTING["dbname"],"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
	if row:
		row=row[0]
		access=sessionaccess(row,tokenuserrow)
		playerrow=query(SETTING["dbname"],"""SELECT*FROM "sessionplayer" WHERE "sessionid"=%s AND "userid"=%s AND "deletetime" IS NULL""",[sessionid,tokenuserrow["id"]],SETTING["dbsetting"])
		if access["isown"] or access["isadmin"] or access["isstaff"] or access["isplayer"] or playerrow:
			row=query(SETTING["dbname"],"""SELECT*FROM "table" WHERE "sessionid"=%s AND "deletetime" IS NULL ORDER BY "no" ASC,"id" ASC""",[sessionid],SETTING["dbsetting"])

			return Response({
				"success": True,
				"data": row
			},status.HTTP_200_OK)
		else:
			return errorresponse("ERROR_no_permission")
	else:
		return errorresponse("ERROR_session_not_found")

@api_view(["GET"])
def getsessiontableboard(request,sessionid):
	# 多牌桌總覽看板（檢查表 3.4）：一次回傳該場所有牌桌的人數／空位／玩家
	ensuretablesettingcolumns()
	userrow,errresp=tableauthuser(request)
	if errresp:
		return errresp
	sessionrowlist=query(SETTING["dbname"],"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
	if not sessionrowlist:
		return errorresponse("ERROR_session_not_found")
	sessionrow=sessionrowlist[0]
	access=sessionaccess(sessionrow,userrow)
	playerrow=query(SETTING["dbname"],"""SELECT*FROM "sessionplayer" WHERE "sessionid"=%s AND "userid"=%s AND "deletetime" IS NULL""",[sessionid,userrow["id"]],SETTING["dbsetting"])
	if not(access["isown"] or access["isadmin"] or access["isstaff"] or access["isplayer"] or playerrow):
		return errorresponse("ERROR_no_permission")

	maxseat=int(sessionrow.get("maxseat") or 9)
	tablerows=query(SETTING["dbname"],"""SELECT*FROM "table" WHERE "sessionid"=%s AND "deletetime" IS NULL ORDER BY "no" ASC,"id" ASC""",[sessionid],SETTING["dbsetting"]) or []
	tables=[]
	totalplayers=0
	for t in tablerows:
		seats=tablecurrentplayers(sessionrow,t["id"])
		players=[]
		for s in seats:
			if s.get("player"):
				players.append({
					"seatno": s["seatno"],
					"sessionplayerid": s["player"].get("sessionplayerid"),
					"name": s["player"].get("name") or "",
					"playerid": s["player"].get("playerid") or "",
					"chip": s["player"].get("chip") or 0
				})
		occupied=len(players)
		totalplayers=totalplayers+occupied
		tables.append({
			"id": t["id"],
			"no": t.get("no"),
			"name": t.get("name") or "",
			"token": t.get("token") or "",
			"maxseat": maxseat,
			"occupied": occupied,
			"empty": maxseat-occupied,
			"closed": True if t.get("closedtime") else False,
			"players": players
		})

	return Response({
		"success": True,
		"data": {
			"sessionid": sessionid,
			"maxseat": maxseat,
			"tablecount": len(tables),
			"totalplayers": totalplayers,
			"tables": tables
		}
	},status.HTTP_200_OK)

def omaha_besteval(holeeval,boardeval):
	# 奧馬哈評牌：手牌恰 2 張 × 公牌恰 3 張的所有組合取最佳（inputs 為 eval7.Card list）。
	# board 少於 3 張時退化為自由組合，避免例外。
	if len(boardeval)<3:
		return eval7.evaluate(holeeval+boardeval)
	best=None
	for holepair in itertools.combinations(holeeval,2):
		for boardtriple in itertools.combinations(boardeval,3):
			score=eval7.evaluate(list(holepair)+list(boardtriple))
			if best is None or score>best:
				best=score
	return best


def eval_hand(cardseval,boardeval,omahaed):
	# 統一評牌入口：omahaed=True 走奧馬哈 2/4 規則，否則自由組合最佳 5 張。
	if omahaed:
		return omaha_besteval(cardseval,boardeval)
	return eval7.evaluate(cardseval+boardeval)


def calc_equity(hero,opp,board,iters=5000,omahaed=False):
	deck=eval7.Deck()
	for c in hero+opp+board:
		if c in deck.cards:
			deck.cards.remove(c)
	win=0
	tie=0
	for _ in range(iters):
		random.shuffle(deck.cards)
		b=board+deck.cards[:5-len(board)]
		h1=eval_hand(hero,b,omahaed)
		h2=eval_hand(opp,b,omahaed)
		if h1>h2:win=win+1
		elif h1==h2:tie=tie+1
	return (win+tie*0.5)/iters

def parsecardjson(value):
	# 依牌型回傳實際存在的底牌（Hold'em 2、Omaha 4、Omaha5 5…），讀 card1..card5。
	# 至少要有 card1、card2 才視為有效底牌（維持原本「不足兩張回空」的行為）。
	try:
		if not value or value=="null":
			return []
		carddata=value
		if isinstance(value,str):
			carddata=json.loads(value)
		cards=[]
		for i in range(1,6):
			card=carddata.get("card"+str(i))
			if card:
				cards.append(card)
		if len(cards)>=2:
			return cards
	except Exception as error:
		return []
	return []

def parseboardjson(value):
	cards=[]
	try:
		if not value or value=="null":
			return cards
		boarddata=value
		if isinstance(value,str):
			boarddata=json.loads(value)
		if boarddata.get("flop"):
			for card in boarddata["flop"]:
				if card:
					cards.append(card)
		if boarddata.get("turn"):
			cards.append(boarddata["turn"])
		if boarddata.get("river"):
			cards.append(boarddata["river"])
	except Exception as error:
		return []
	return cards

def getactionseats(bittingrow,actionname):
	seats=[]
	for action in bittingrow:
		if action["action"]==actionname and action["seatno"] not in seats:
			seats.append(action["seatno"])
	return seats

def calcallinstats(hand,seatingrow,bittingrow):
	stats={}
	allinseats=getactionseats(bittingrow,"allin")
	if len(allinseats)==0:
		return stats
	board=parseboardjson(hand.get("boardcard"))
	try:
		board_eval=[]
		for card in board:
			board_eval.append(eval7.Card(card))
	except Exception as error:
		return stats
	for seating in seatingrow:
		seatno=seating["seatno"]
		if seatno not in allinseats:
			continue
		hero=parsecardjson(seating.get("handcard"))
		if len(hero)==0 and seatno==hand.get("selfseating"):
			hero=parsecardjson(hand.get("handcard"))
		if len(hero) not in (2,4,5):
			continue
		omahaed=len(hero)>=4
		try:
			hero_eval=[eval7.Card(card) for card in hero]
			opps=[]
			for opp in seatingrow:
				if opp["seatno"]!=seatno and opp["seatno"] in allinseats:
					oppcard=parsecardjson(opp.get("handcard"))
					if len(oppcard)==0 and opp["seatno"]==hand.get("selfseating"):
						oppcard=parsecardjson(hand.get("handcard"))
					if len(oppcard)==len(hero):
						opps.append([eval7.Card(card) for card in oppcard])
			if len(opps)==0:
				continue
			equitytotal=0
			for oppcards in opps:
				equitytotal=equitytotal+calc_equity(hero_eval,oppcards,board_eval,2000,omahaed)
			equity=equitytotal/len(opps)
			outs=[]
			if len(board_eval)>=3 and len(board_eval)<5:
				deck=eval7.Deck()
				used=hero_eval+board_eval
				for oppcards in opps:
					used=used+oppcards
				for card in used:
					if card in deck.cards:
						deck.cards.remove(card)
				for card in deck.cards:
					testboard=board_eval+[card]
					heroscore=eval_hand(hero_eval,testboard,omahaed)
					bestopp=None
					for oppcards in opps:
						score=eval_hand(oppcards,testboard,omahaed)
						if bestopp is None or score>bestopp:
							bestopp=score
					if bestopp is not None and heroscore>bestopp:
						outs.append(str(card))
			stats[seatno]={
				"equity": round(equity*100,2),
				"outs": outs
			}
		except Exception as error:
			printcolorhaveline("fail","[ERROR] seat equity calc "+str(error),"")
			stats[seatno]={
				"error": "calc_failed"
			}
	return stats

@api_view(["GET"])
def gettable(request,tableid):
	ensuretablesettingcolumns()
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	row=query(SETTING["dbname"],"""SELECT*FROM "table" WHERE "id"=%s AND "deletetime" IS NULL""",[tableid],SETTING["dbsetting"])
	if row:
		row=row[0]
		sessionrowlist=query(SETTING["dbname"],"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[row["sessionid"]],SETTING["dbsetting"])
		if not sessionrowlist:
			return errorresponse("ERROR_session_not_found")
		sessionrow=sessionrowlist[0]
		access=sessionaccess(sessionrow,tokenuserrow)
		playerrow=query(SETTING["dbname"],"""SELECT*FROM "sessionplayer" WHERE "sessionid"=%s AND "userid"=%s AND "deletetime" IS NULL""",[sessionrow["id"],tokenuserrow["id"]],SETTING["dbsetting"])
		if access["isown"] or access["isadmin"] or access["isstaff"] or access["isplayer"] or playerrow:
			seatingdata=[]
			handdata=[]
			ev_actual=[]
			ev_allin=[]

			for i in range(int(sessionrow.get("maxseat") or 9)):
				seatingdata.append({"seat":i+1,"history":[]})

			if sessionrow.get("linkuser"):
				seatingrow=query(SETTING["dbname"],"""
					SELECT sp."id" AS sessionplayerid,sp."userid",sp."seatno",sp."startchip",
						u."name",u."playerid"
					FROM "sessionplayer" sp
					JOIN "user" u ON u."id"=sp."userid"
					WHERE sp."sessionid"=%s AND sp."tableid"=%s AND sp."status"='confirmed' AND sp."seatno" IS NOT NULL AND sp."deletetime" IS NULL
					ORDER BY sp."seatno" ASC
				""",[sessionrow["id"],tableid],SETTING["dbsetting"])
				for seating in seatingrow:
					if 0<seating["seatno"] and seating["seatno"]<=len(seatingdata):
						seatingdata[seating["seatno"]-1]["history"].append({
							"id":seating["sessionplayerid"],
							"type":"buyin",
							"player":seating["name"],
							"time":sessionrow.get("starttime"),
							"buyin":sessionrow.get("buyin") or 0,
							"chip":seating.get("startchip") or sessionrow.get("chip") or 0,
							"userid":seating["userid"],
							"sessionplayerid":seating["sessionplayerid"]
						})

			if sessionrow["tablelinked"] and not sessionrow.get("linkuser"):
				seatingrow=query(SETTING["dbname"],"""
					SELECT*FROM "seating"
					WHERE "tableid" IN (
						SELECT "id"
						FROM "table"
						WHERE "sessionid"=(
							SELECT "sessionid" FROM "table" WHERE "id"=%s AND "deletetime" IS NULL
						)
						AND "deletetime" IS NULL
					)
					AND "deletetime" IS NULL
					ORDER BY "seatno" ASC, "time" ASC
				""",[tableid],SETTING["dbsetting"])

				for seating in seatingrow:
					seatingdata[seating["seatno"]-1]["history"].append({
						"id":seating["id"],
						"type":seating["type"],
						"player":seating["name"],
						"time":seating["time"],
						"buyin":seating["buyin"],
						"chip":seating["chip"]
					})

				handrow=query(SETTING["dbname"],"""
					SELECT*FROM "hand"
					WHERE "tableid" IN (
						SELECT "id"
						FROM "table"
						WHERE "sessionid"=(
							SELECT "sessionid" FROM "table" WHERE "id"=%s AND "deletetime" IS NULL
						)
						AND "deletetime" IS NULL
					)
					AND "deletetime" IS NULL
					ORDER BY "createtime" DESC
				""",[tableid],SETTING["dbsetting"])

				for hand in handrow:
					# TASK-037：公共牌與總底池改讀正規化表，直接覆蓋回這一列上，
					# 底下既有的 parseboardjson / parse_boardcard 就不必各自改一遍。
					# 查不到正規化列時 boardcardread / totalpotread 會回退舊欄位。
					communityrow=query(SETTING["dbname"],"""SELECT*FROM "communitycard" WHERE "handid"=%s ORDER BY "runno" ASC,"id" ASC""",[hand["id"]],SETTING["dbsetting"])
					potrow=query(SETTING["dbname"],"""SELECT*FROM "handpot" WHERE "handid"=%s ORDER BY "runno" ASC,"potno" ASC""",[hand["id"]],SETTING["dbsetting"])
					hand["boardcard"]=boardcardread(hand,communityrow)
					hand["totalpot"]=totalpotread(hand,potrow)
					seatingrow=query(SETTING["dbname"],"""SELECT*FROM "handseating" WHERE "handid"=%s AND "deletetime" IS NULL ORDER BY "seatno" ASC""",[hand["id"]],SETTING["dbsetting"])
					bittingrow=query(SETTING["dbname"],"""SELECT*FROM "handbittingdata" WHERE "handid"=%s AND "deletetime" IS NULL""",[hand["id"]],SETTING["dbsetting"])
					allinstats=calcallinstats(hand,seatingrow,bittingrow)
					selfseating=None
					for s in seatingrow:
						if s["seatno"]==hand["selfseating"]:
							selfseating=s
							break

					actual_ev=selfseating["endchip"]-selfseating["chip"] if selfseating else 0

					allin_ev=None
					luck=None
					allin_ev_debug={}
					import json as _json
					def parse_handcard(cardstr):
						try:
							if not cardstr or cardstr=="null": return []
							d=_json.loads(cardstr) if isinstance(cardstr,str) else cardstr
							return [d.get("card1"), d.get("card2")] if d.get("card1") and d.get("card2") else []
						except Exception as e:
							return []
					def parse_boardcard(boardstr):
						try:
							if not boardstr or boardstr=="null": return []
							d=_json.loads(boardstr) if isinstance(boardstr,str) else boardstr
							cards=[]
							if d.get("flop"): cards += d["flop"]
							if d.get("turn"): cards.append(d["turn"])
							if d.get("river"): cards.append(d["river"])
							return cards
						except Exception as e:
							return []

					# 取得 hero 手牌
					hero_cards=parse_handcard(hand.get("handcard"))
					board=parse_boardcard(hand.get("boardcard"))
					total_pot=hand.get("totalpot", 0)
					invest=0
					# 找出自己在本手 handseating(seatingrow) 的投入(chipchange)
					for s in seatingrow:
						if s.get("seatno") == hand.get("selfseating"):
							invest=s.get("chipchange") or 0
							break
					allin_ev_debug={
						"hero_cards": hero_cards,
						"board": board,
						"total_pot": total_pot,
						"invest": invest,
						"debug_board": None,
						"note": None
					}
					if hero_cards:
						try:
							hero_cards_eval=[eval7.Card(c) for c in hero_cards]
							board_eval=[eval7.Card(c) for c in board] if board else []
							# 對手show card（讀本手 handseating(seatingrow)）
							opps=[]
							for s in seatingrow:
								if s.get("seatno") != hand.get("selfseating") and s.get("handcard") and s.get("handcard") != "null":
									opp_cards=parse_handcard(s.get("handcard"))
									if len(opp_cards) == 2:
										opps.append([eval7.Card(c) for c in opp_cards])
							if len(opps) > 0:
								equity_sum=0
								for opp_cards_eval in opps:
									equity_sum += calc_equity(hero_cards_eval, opp_cards_eval, board_eval)
								equity=equity_sum / len(opps)
								allin_ev_debug["debug_board"]=[str(c) for c in board_eval]
							else:
								deck=eval7.Deck()
								used_cards=hero_cards_eval + board_eval
								for c in used_cards:
									if c in deck.cards:
										deck.cards.remove(c)
								import random
								win=tie = 0
								iters=5000
								debug_board_example=None
								for i in range(iters):
									random.shuffle(deck.cards)
									opp_cards=deck.cards[:2]
									# 補齊 board
									b=board_eval.copy()
									need=5 - len(b)
									if need > 0:
										b += deck.cards[2:2+need]
									if i == 0:
										debug_board_example=[str(c) for c in b]
									h1=eval7.evaluate(hero_cards_eval+b)
									h2=eval7.evaluate(opp_cards+b)
									if h1 > h2: win += 1
									elif h1 == h2: tie += 1
								equity=(win + tie*0.5) / iters
								allin_ev_debug["debug_board"]=debug_board_example
								if len(board_eval) not in [3,4,5]:
									allin_ev_debug["note"]=f"board length unusual: {len(board_eval)}"
							allin_ev=equity*total_pot - invest
							luck=actual_ev - allin_ev
							if invest == 0:
								allin_ev_debug["note"]=(allin_ev_debug.get("note","") + " invest=0").strip()
						except Exception as e:
							allin_ev=None
							luck=None
							printcolorhaveline("fail","[ERROR] allin_ev calc "+str(e),"")
							allin_ev_debug["error"]="calc_failed"

					ev_actual.append(actual_ev)
					ev_allin.append(allin_ev)

					handdata.append({
						**hand,
						"bittingdata":bittingrow,
						"seatingdata":seatingrow,
						"chipchange":actual_ev,
						"allin_ev": allin_ev,
						"luck": luck,
						"allin_ev_debug": allin_ev_debug,
						"allinstats": allinstats
					})
			else:
				if not sessionrow.get("linkuser"):
					seatingrow=query(SETTING["dbname"],"""SELECT*FROM "seating" WHERE "tableid"=%s AND "deletetime" IS NULL ORDER BY "seatno" ASC, "time" ASC""",[tableid],SETTING["dbsetting"])
					for seating in seatingrow:
						seatingdata[seating["seatno"]-1]["history"].append({
							"id":seating["id"],
							"type":seating["type"],
							"player":seating["name"],
							"time":seating["time"],
							"buyin":seating["buyin"],
							"chip":seating["chip"]
						})

				handrow=query(SETTING["dbname"],"""SELECT*FROM "hand" WHERE "tableid"=%s AND "deletetime" IS NULL ORDER BY "createtime" DESC""",[tableid],SETTING["dbsetting"])
				for hand in handrow:
					# TASK-037：公共牌與總底池改讀正規化表，直接覆蓋回這一列上，
					# 底下既有的 parseboardjson / parse_boardcard 就不必各自改一遍。
					# 查不到正規化列時 boardcardread / totalpotread 會回退舊欄位。
					communityrow=query(SETTING["dbname"],"""SELECT*FROM "communitycard" WHERE "handid"=%s ORDER BY "runno" ASC,"id" ASC""",[hand["id"]],SETTING["dbsetting"])
					potrow=query(SETTING["dbname"],"""SELECT*FROM "handpot" WHERE "handid"=%s ORDER BY "runno" ASC,"potno" ASC""",[hand["id"]],SETTING["dbsetting"])
					hand["boardcard"]=boardcardread(hand,communityrow)
					hand["totalpot"]=totalpotread(hand,potrow)
					seatingrow=query(SETTING["dbname"],"""SELECT*FROM "handseating" WHERE "handid"=%s AND "deletetime" IS NULL ORDER BY "seatno" ASC""",[hand["id"]],SETTING["dbsetting"])
					bittingrow=query(SETTING["dbname"],"""SELECT*FROM "handbittingdata" WHERE "handid"=%s AND "deletetime" IS NULL""",[hand["id"]],SETTING["dbsetting"])
					allinstats=calcallinstats(hand,seatingrow,bittingrow)
					selfseating=None
					for s in seatingrow:
						if s["seatno"]==hand["selfseating"]:
							selfseating=s
							break

					actual_ev=selfseating["endchip"]-selfseating["chip"] if selfseating else 0
					allin_ev=None

					if selfseating and selfseating.get("card"):
						try:
							hero_cards=[eval7.Card(c) for c in selfseating["card"].split()]
							oppseat=next((x for x in seatingrow if x["seatno"]!=hand["selfseating"] and x.get("card")),None)
							opp_cards=[eval7.Card(c) for c in oppseat["card"].split()] if oppseat else []
							board=[eval7.Card(c) for c in hand["board"].split()] if hand.get("board") else []
							equity=calc_equity(hero_cards,opp_cards,board)
							total_pot=hand.get("pot",0)
							invest=selfseating.get("invest",0)
							allin_ev=equity*total_pot-invest
						except Exception as e:
							allin_ev=None

					ev_actual.append(actual_ev)
					ev_allin.append(allin_ev)

					handdata.append({
						**hand,
						"bittingdata":bittingrow,
						"seatingdata":seatingrow,
						"chipchange":actual_ev,
						"allinstats":allinstats
					})

			clubrow=query(SETTING["dbname"],"""SELECT*FROM "club" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionrow["clubid"]],SETTING["dbsetting"])
			timerlevelrow=query(SETTING["dbname"],"""SELECT*FROM "sessiontimerlevel" WHERE "sessionid"=%s AND "deletetime" IS NULL ORDER BY "sortorder" ASC""",[sessionrow["id"]],SETTING["dbsetting"])
			chiprow=query(SETTING["dbname"],"""SELECT*FROM "sessionchip" WHERE "sessionid"=%s AND "deletetime" IS NULL ORDER BY "sortorder" ASC,"value" ASC,"id" ASC""",[sessionrow["id"]],SETTING["dbsetting"])
			if not chiprow:
				chiprow=[
					{"shape": "circle","value": 100,"color": "#ffffff","sortorder": 1},
					{"shape": "circle","value": 500,"color": "#ef4444","sortorder": 2},
					{"shape": "circle","value": 1000,"color": "#f59e0b","sortorder": 3},
					{"shape": "circle","value": 5000,"color": "#22c55e","sortorder": 4},
					{"shape": "circle","value": 10000,"color": "#3b82f6","sortorder": 5}
				]
			registeredrow=query(SETTING["dbname"],"""
				SELECT sp."id" as sessionplayerid,sp."userid",sp."status",sp."buyin",sp."fee",sp."ticketvalue",sp."tableid",sp."seatno",sp."startchip",
					u."name",u."playerid"
				FROM "sessionplayer" sp
				JOIN "user" u ON u."id"=sp."userid"
				WHERE sp."sessionid"=%s AND sp."tableid"=%s AND sp."status"='confirmed' AND sp."seatno" IS NOT NULL AND sp."deletetime" IS NULL
				ORDER BY sp."confirmtime" ASC,sp."registertime" ASC
			""",[sessionrow["id"],tableid],SETTING["dbsetting"])
			row=dict(row)
			if not row.get("maxseat"):
				row["maxseat"]=sessionrow.get("maxseat") or 9
			if not row.get("firstdealerplace"):
				row["firstdealerplace"]=1
			if not row.get("selfseating"):
				row["selfseating"]=1
			tablerows=query(SETTING["dbname"],"""SELECT "id","no","token","closedtime" FROM "table" WHERE "sessionid"=%s AND "deletetime" IS NULL ORDER BY "no" ASC,"id" ASC""",[sessionrow["id"]],SETTING["dbsetting"])
			currentplayers=tablecurrentplayers(sessionrow,tableid)
			chipmap=lasttablechips(tableid)
			for current in currentplayers:
				player=current.get("player")
				if not player:
					continue
				key=None
				if player.get("sessionplayerid"):
					key="sp:"+str(player["sessionplayerid"])
				elif player.get("userid"):
					key="u:"+str(player["userid"])
				elif player.get("name"):
					key="n:"+str(player["name"])
				if key and key in chipmap:
					player["chip"]=chipmap[key]
					player["unknownchip"]=intval(chipmap[key],0)<0

			return Response({
				"success":True,
				"data":{
					**sessionrow,
					**row,
					"sessiontoken":sessionrow["token"],
					"seating":seatingdata,
					"currentplayers":currentplayers,
					"availableplayers":tableavailableplayers(sessionrow["id"]) if sessionrow.get("linkuser") else [],
					"tables":tablerows or [],
					"hand":handdata,
					"ev":{"actual":ev_actual,"allin":ev_allin},
					"blindstructures":timerlevelrow or [],
					"chips":chiprow or [],
					"registeredplayers":registeredrow or [],
					"club":clubrow[0] if clubrow else None,
					"clubname":clubrow[0]["name"] if clubrow else "協會被刪除"
				}
			},status.HTTP_200_OK)
		else:
			return errorresponse("ERROR_no_permission")
	else:
		return errorresponse("ERROR_table_not_found")

@api_view(["POST"])
def newtable(request,sessionid):
	ensuretablesettingcolumns()
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	sessionrow=query(SETTING["dbname"],"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
	if sessionrow:
		sessionrow=sessionrow[0]
		if tokenuserrow["id"]==sessionrow["userid"] or 4<=int(tokenuserrow["permission"]):
			data=json.loads(request.body or "{}")
			tableno=data.get("no")
			rangestart=data.get("rangestart")
			rangeend=data.get("rangeend")
			ranged=False

			if rangestart not in [None,""] or rangeend not in [None,""]:
				ranged=True
				try:
					if rangestart in [None,""]:
						rangestart=int(rangeend)
					else:
						rangestart=int(rangestart)
					if rangeend in [None,""]:
						rangeend=rangestart
					else:
						rangeend=int(rangeend)
				except Exception as error:
					return errorresponse("ERROR_request_data_type_error")
				if rangestart<1 or rangeend<rangestart or 100<rangeend-rangestart+1:
					return errorresponse("ERROR_request_data_type_error")
			else:
				try:
					tableno=int(tableno)
				except Exception as error:
					return errorresponse("ERROR_request_data_not_found")
				if tableno<1:
					return errorresponse("ERROR_request_data_type_error")

			# token 流水號取歷史最大值續編（含已刪除桌），避免刪桌後重號
			tokenprefix="TB"+str(sessionrow["token"])
			row=query(SETTING["dbname"],"""SELECT "token" FROM "table" WHERE "sessionid"=%s""",[sessionid],SETTING["dbsetting"]) or []
			tablecount=0
			for tablerow in row:
				tokentext=str(tablerow.get("token") or "")
				if tokentext.startswith(tokenprefix) and tokentext[len(tokenprefix):].isdigit():
					if tablecount<int(tokentext[len(tokenprefix):]):
						tablecount=int(tokentext[len(tokenprefix):])
			createcount=1
			if ranged:
				createcount=rangeend-rangestart+1

			sqllist=[]
			for i in range(createcount):
				if ranged:
					tableno=rangestart+i
				tablecount=tablecount+1
				sqllist.append(["""INSERT INTO "table"("token","sessionid","no")VALUES(%s,%s,%s)""",[tokenprefix+str(tablecount).zfill(2),sessionid,tableno]])
			result=querytransaction(SETTING["dbname"],sqllist,SETTING["dbsetting"])
			if result is None:
				return errorresponse("ERROR_database_error")

			return Response({
				"success": True,
				"data": {
					"count": createcount
				}
			},status.HTTP_200_OK)
		else:
			return errorresponse("ERROR_no_permission")
	else:
		return errorresponse("ERROR_session_not_found")

@api_view(["PUT"])
def edittable(request,tableid):
	ensuretablesettingcolumns()
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	row=query(SETTING["dbname"],"""SELECT*FROM "table" WHERE "id"=%s AND "deletetime" IS NULL""",[tableid],SETTING["dbsetting"])
	if row:
		row=row[0]
		sessionrow=query(SETTING["dbname"],"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[row["sessionid"]],SETTING["dbsetting"])
		if sessionrow:
			sessionrow=sessionrow[0]
			if tokenuserrow["id"]==sessionrow["userid"] or 4<=int(tokenuserrow["permission"]):
				data=json.loads(request.body)

				try:
					tableno=int(data.get("no"))
				except Exception as error:
					return errorresponse("ERROR_request_data_type_error")
				if tableno<1:
					return errorresponse("ERROR_request_data_type_error")

				query(SETTING["dbname"],"""UPDATE "table" SET "no"=%s WHERE "id"=%s""",[tableno,tableid],SETTING["dbsetting"])

				return Response({
					"success": True,
					"data": ""
				},status.HTTP_200_OK)
			else:
				return errorresponse("ERROR_no_permission")
		else:
			return errorresponse("ERROR_session_not_found")
	else:
		return errorresponse("ERROR_table_not_found")

@api_view(["PUT"])
def edittablesetting(request,tableid):
	ensuretablesettingcolumns()
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	row=query(SETTING["dbname"],"""SELECT*FROM "table" WHERE "id"=%s AND "deletetime" IS NULL""",[tableid],SETTING["dbsetting"])
	if row:
		row=row[0]
		sessionrow=query(SETTING["dbname"],"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[row["sessionid"]],SETTING["dbsetting"])
		if sessionrow:
			sessionrow=sessionrow[0]
			if tokenuserrow["id"]==sessionrow["userid"] or 4<=int(tokenuserrow["permission"]):

				requestdata=validate(json.loads(request.body),{
					# 場次設定的每桌座位數允許 2-10，這裡必須涵蓋同一範圍，
					# 否則場次設成 7 之類的值時牌桌設定會永遠存不起來。
					"maxseat": "required|string|in:2,3,4,5,6,7,8,9,10",
					"firstdealerplace": "required|string|in:1,2,3,4,5,6,7,8,9,10",
					"selfseating": "required|string|in:1,2,3,4,5,6,7,8,9,10"
				},{
					"required": "ERROR_request_data_not_found",
					"string": "ERROR_request_data_type_error",
					"in": "ERROR_request_data_type_error"
				})

				if requestdata["error"] is None:
					maxseat=requestdata["data"].get("maxseat")
					firstdealerplace=requestdata["data"].get("firstdealerplace")
					selfseating=requestdata["data"].get("selfseating")
					query(SETTING["dbname"],"""UPDATE "session" SET "maxseat"=%s,"updatetime"=%s WHERE "id"=%s""",[maxseat,nowtime(),sessionrow["id"]],SETTING["dbsetting"])
					query(SETTING["dbname"],"""UPDATE "table" SET "firstdealerplace"=%s,"selfseating"=%s,"updatetime"=%s WHERE "id"=%s""",[firstdealerplace,selfseating,nowtime(),tableid],SETTING["dbsetting"])

					return Response({
						"success": True,
						"data": ""
					},status.HTTP_200_OK)
				else:
					return errorresponse(requestdata["error"])
			else:
				return errorresponse("ERROR_no_permission")
		else:
			return errorresponse("ERROR_session_not_found")
	else:
		return errorresponse("ERROR_table_not_found")

def broadcasttablesession(sessionrow):
	try:
		if not sessionrow or not sessionrow.get("linkuser"):
			return
		from .timer import buildtimerstate,broadcasttimerupdate
		state=buildtimerstate(sessionrow["id"])
		if state is not None:
			broadcasttimerupdate(sessionrow["id"],state)
	except Exception as error:
		printcolorhaveline("fail","[ERROR] broadcasttablesession "+str(error),"")

@api_view(["PUT"])
def savetableplayers(request,tableid):
	userrow,errresp=tableauthuser(request)
	if errresp:
		return errresp
	tablerow=query(SETTING["dbname"],"""SELECT*FROM "table" WHERE "id"=%s AND "deletetime" IS NULL""",[tableid],SETTING["dbsetting"])
	if not tablerow:
		return errorresponse("ERROR_table_not_found")
	tablerow=tablerow[0]
	sessionrow=query(SETTING["dbname"],"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[tablerow["sessionid"]],SETTING["dbsetting"])
	if not sessionrow:
		return errorresponse("ERROR_session_not_found")
	sessionrow=sessionrow[0]
	if not tableowneraccess(sessionrow,userrow):
		return errorresponse("ERROR_no_permission")
	data=json.loads(request.body or "{}")
	players=data.get("players") or []
	maxseat=int(sessionrow.get("maxseat") or 9)
	usedseats=[]
	usedplayers=[]
	for i in range(len(players)):
		seatno=int(players[i].get("seatno") or 0)
		if seatno<=0 or maxseat<seatno or seatno in usedseats:
			return errorresponse("ERROR_request_data_type_error")
		usedseats.append(seatno)
		if sessionrow.get("linkuser"):
			sessionplayerid=int(players[i].get("sessionplayerid") or 0)
			if sessionplayerid<=0 or sessionplayerid in usedplayers:
				return errorresponse("ERROR_request_data_type_error")
			usedplayers.append(sessionplayerid)
	if sessionrow.get("linkuser"):
		for i in range(len(players)):
			sessionplayerid=int(players[i].get("sessionplayerid") or 0)
			playerrow=query(SETTING["dbname"],"""
				SELECT*FROM "sessionplayer" sp
				WHERE sp."id"=%s AND sp."sessionid"=%s AND sp."status"='confirmed' AND sp."deletetime" IS NULL
				  AND NOT EXISTS(
					  SELECT 1 FROM "sessiontimerplayer" tp
					  WHERE tp."sessionid"=sp."sessionid" AND tp."sessionplayerid"=sp."id" AND tp."status"='eliminated' AND tp."deletetime" IS NULL
				  )
			""",[sessionplayerid,sessionrow["id"]],SETTING["dbsetting"])
			if not playerrow:
				return errorresponse("ERROR_registration_not_found")
		sqllist=[]
		sqllist.append(["""UPDATE "sessionplayer" SET "tableid"=NULL,"seatno"=NULL,"updatetime"=NOW() WHERE "sessionid"=%s AND "tableid"=%s AND "status"='confirmed' AND "deletetime" IS NULL""",[sessionrow["id"],tableid]])
		for i in range(len(players)):
			sessionplayerid=int(players[i].get("sessionplayerid") or 0)
			seatno=int(players[i].get("seatno") or 0)
			chip=players[i].get("chip") or sessionrow.get("chip") or 0
			if boolval(players[i].get("unknownchip")):
				chip=-1
			sqllist.append(["""UPDATE "sessionplayer" SET "tableid"=%s,"seatno"=%s,"startchip"=%s,"updatetime"=NOW() WHERE "id"=%s AND "sessionid"=%s""",[tableid,seatno,chip,sessionplayerid,sessionrow["id"]]])
		result=querytransaction(SETTING["dbname"],sqllist,SETTING["dbsetting"])
		if result is None:
			return errorresponse("ERROR_database_error")
		broadcasttablesession(sessionrow)
		return Response({"success": True,"data": ""},status.HTTP_200_OK)
	sqllist=[]
	sqllist.append(["""UPDATE "seating" SET "deletetime"=NOW() WHERE "tableid"=%s AND "deletetime" IS NULL""",[tableid]])
	for i in range(len(players)):
		name=str(players[i].get("name") or "").strip()
		if name=="":
			continue
		seatno=int(players[i].get("seatno") or 0)
		chip=players[i].get("chip") or sessionrow.get("chip") or 0
		if boolval(players[i].get("unknownchip")):
			chip=-1
		sqllist.append(["""INSERT INTO "seating"("tableid","seatno","buyin","time","name","type","chip","createtime")VALUES(%s,%s,%s,NOW(),%s,%s,%s,NOW())""",[tableid,seatno,0,name,"buyin",chip]])
	result=querytransaction(SETTING["dbname"],sqllist,SETTING["dbsetting"])
	if result is None:
		return errorresponse("ERROR_database_error")
	return Response({"success": True,"data": ""},status.HTTP_200_OK)

@api_view(["POST"])
def eliminatetableplayer(request,tableid):
	userrow,errresp=tableauthuser(request)
	if errresp:
		return errresp
	tablerow=query(SETTING["dbname"],"""SELECT*FROM "table" WHERE "id"=%s AND "deletetime" IS NULL""",[tableid],SETTING["dbsetting"])
	if not tablerow:
		return errorresponse("ERROR_table_not_found")
	tablerow=tablerow[0]
	sessionrow=query(SETTING["dbname"],"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[tablerow["sessionid"]],SETTING["dbsetting"])
	if not sessionrow:
		return errorresponse("ERROR_session_not_found")
	sessionrow=sessionrow[0]
	if not tableowneraccess(sessionrow,userrow):
		return errorresponse("ERROR_no_permission")
	data=json.loads(request.body or "{}")
	if sessionrow.get("linkuser"):
		sessionplayerid=int(data.get("sessionplayerid") or 0)
		playerrow=query(SETTING["dbname"],"""SELECT*FROM "sessionplayer" WHERE "id"=%s AND "sessionid"=%s AND "tableid"=%s AND "status"='confirmed' AND "deletetime" IS NULL""",[sessionplayerid,sessionrow["id"],tableid],SETTING["dbsetting"])
		if not playerrow:
			return errorresponse("ERROR_registration_not_found")
		playerrow=playerrow[0]
		query(SETTING["dbname"],"""
			INSERT INTO "sessiontimerplayer"("sessionid","sessionplayerid","userid","status","eliminatedtime","createtime","updatetime")
			VALUES(%s,%s,%s,%s,NOW(),NOW(),NOW())
			ON CONFLICT ("sessionid","sessionplayerid")
			DO UPDATE SET "status"='eliminated',"eliminatedtime"=NOW(),"deletetime"=NULL,"updatetime"=NOW()
		""",[sessionrow["id"],sessionplayerid,playerrow["userid"],"eliminated"],SETTING["dbsetting"])
		query(SETTING["dbname"],"""UPDATE "sessionplayer" SET "tableid"=NULL,"seatno"=NULL,"updatetime"=NOW() WHERE "id"=%s""",[sessionplayerid],SETTING["dbsetting"])
		broadcasttablesession(sessionrow)
		return Response({"success": True,"data": ""},status.HTTP_200_OK)
	seatno=int(data.get("seatno") or 0)
	if seatno<=0:
		return errorresponse("ERROR_request_data_type_error")
	query(SETTING["dbname"],"""INSERT INTO "seating"("tableid","seatno","buyin","time","name","type","chip","createtime")VALUES(%s,%s,%s,NOW(),%s,%s,%s,NOW())""",[tableid,seatno,0,"","leave",0],SETTING["dbsetting"])
	return Response({"success": True,"data": ""},status.HTTP_200_OK)

@api_view(["POST"])
def movetableplayer(request,tableid):
	userrow,errresp=tableauthuser(request)
	if errresp:
		return errresp
	data=json.loads(request.body or "{}")
	targettableid=data.get("targettableid")
	if not targettableid or str(targettableid)==str(tableid):
		return errorresponse("ERROR_request_data_type_error")
	tablerow=query(SETTING["dbname"],"""SELECT*FROM "table" WHERE "id"=%s AND "deletetime" IS NULL""",[tableid],SETTING["dbsetting"])
	targetrow=query(SETTING["dbname"],"""SELECT*FROM "table" WHERE "id"=%s AND "deletetime" IS NULL""",[targettableid],SETTING["dbsetting"])
	if not tablerow or not targetrow:
		return errorresponse("ERROR_table_not_found")
	tablerow=tablerow[0]
	targetrow=targetrow[0]
	if tablerow["sessionid"]!=targetrow["sessionid"]:
		return errorresponse("ERROR_table_not_found")
	sessionrow=query(SETTING["dbname"],"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[tablerow["sessionid"]],SETTING["dbsetting"])
	if not sessionrow:
		return errorresponse("ERROR_session_not_found")
	sessionrow=sessionrow[0]
	if not tableowneraccess(sessionrow,userrow):
		return errorresponse("ERROR_no_permission")
	maxseat=int(sessionrow.get("maxseat") or 9)
	targetcurrent=tablecurrentplayers(sessionrow,targettableid)
	seatno=None
	for i in range(1,maxseat+1):
		if i<=len(targetcurrent) and not targetcurrent[i-1].get("player"):
			seatno=i
			break
	if seatno is None:
		return errorresponse("ERROR_request_data_type_error")
	if sessionrow.get("linkuser"):
		sessionplayerid=int(data.get("sessionplayerid") or 0)
		playerrow=query(SETTING["dbname"],"""
			SELECT*FROM "sessionplayer" sp
			WHERE sp."id"=%s AND sp."sessionid"=%s AND sp."tableid"=%s AND sp."status"='confirmed' AND sp."deletetime" IS NULL
			  AND NOT EXISTS(
				  SELECT 1 FROM "sessiontimerplayer" tp
				  WHERE tp."sessionid"=sp."sessionid" AND tp."sessionplayerid"=sp."id" AND tp."status"='eliminated' AND tp."deletetime" IS NULL
			  )
		""",[sessionplayerid,sessionrow["id"],tableid],SETTING["dbsetting"])
		if not playerrow:
			return errorresponse("ERROR_registration_not_found")
		query(SETTING["dbname"],"""UPDATE "sessionplayer" SET "tableid"=%s,"seatno"=%s,"updatetime"=NOW() WHERE "id"=%s""",[targettableid,seatno,sessionplayerid],SETTING["dbsetting"])
		broadcasttablesession(sessionrow)
		return Response({"success": True,"data": ""},status.HTTP_200_OK)
	sourcecurrent=tablecurrentplayers(sessionrow,tableid)
	sourceseat=int(data.get("seatno") or 0)
	if sourceseat<=0 or len(sourcecurrent)<sourceseat or not sourcecurrent[sourceseat-1].get("player"):
		return errorresponse("ERROR_request_data_type_error")
	player=sourcecurrent[sourceseat-1]["player"]
	sqllist=[
		["""INSERT INTO "seating"("tableid","seatno","buyin","time","name","type","chip","createtime")VALUES(%s,%s,%s,NOW(),%s,%s,%s,NOW())""",[targettableid,seatno,0,player.get("name") or "","buyin",player.get("chip") or sessionrow.get("chip") or 0]],
		["""INSERT INTO "seating"("tableid","seatno","buyin","time","name","type","chip","createtime")VALUES(%s,%s,%s,NOW(),%s,%s,%s,NOW())""",[tableid,sourceseat,0,"","leave",0]]
	]
	result=querytransaction(SETTING["dbname"],sqllist,SETTING["dbsetting"])
	if result is None:
		return errorresponse("ERROR_database_error")
	return Response({"success": True,"data": ""},status.HTTP_200_OK)

@api_view(["POST"])
def mergetableplayers(request,tableid):
	ensuretablesettingcolumns()
	userrow,errresp=tableauthuser(request)
	if errresp:
		return errresp
	data=json.loads(request.body or "{}")
	targettableid=data.get("targettableid")
	if not targettableid or str(targettableid)==str(tableid):
		return errorresponse("ERROR_request_data_type_error")
	# targettableid="auto" 為特殊值: 不指定單一目標桌, 改把來源選手隨機分配到同場次所有開放中的桌
	automode=str(targettableid)=="auto"
	tablerow=query(SETTING["dbname"],"""SELECT*FROM "table" WHERE "id"=%s AND "deletetime" IS NULL""",[tableid],SETTING["dbsetting"])
	if not tablerow:
		return errorresponse("ERROR_table_not_found")
	tablerow=tablerow[0]
	targetrow=None
	if not automode:
		targetrow=query(SETTING["dbname"],"""SELECT*FROM "table" WHERE "id"=%s AND "deletetime" IS NULL""",[targettableid],SETTING["dbsetting"])
		if not targetrow:
			return errorresponse("ERROR_table_not_found")
		targetrow=targetrow[0]
		if tablerow["sessionid"]!=targetrow["sessionid"]:
			return errorresponse("ERROR_table_not_found")
		# 已關閉的桌不可作為併桌目標 (關閉=不再有新選手進桌)
		if targetrow.get("closedtime"):
			return errorresponse("ERROR_table_closed")
	sessionrow=query(SETTING["dbname"],"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[tablerow["sessionid"]],SETTING["dbsetting"])
	if not sessionrow:
		return errorresponse("ERROR_session_not_found")
	sessionrow=sessionrow[0]
	if not tablemanageaccess(sessionrow,userrow):
		return errorresponse("ERROR_no_permission")
	maxseat=int(sessionrow.get("maxseat") or 9)
	if automode:
		# auto 模式: 目標=同場次所有「開放中」的其他桌 (未刪除且 closedtime IS NULL)
		opentablelist=query(SETTING["dbname"],"""SELECT*FROM "table" WHERE "sessionid"=%s AND "id"!=%s AND "deletetime" IS NULL AND "closedtime" IS NULL ORDER BY "no" ASC,"id" ASC""",[tablerow["sessionid"],tableid],SETTING["dbsetting"]) or []
		if not opentablelist:
			return errorresponse("ERROR_request_data_type_error")
		# auto 模式 targettableno/targettablename 給 null, 前端據此顯示「併入多桌」; 各列去向看 moves 的 totableno/toseatno
		movedata={
			"moves": [],
			"sourcetableno": tablerow.get("no"),
			"sourcetablename": tablerow.get("name") or "",
			"targettableno": None,
			"targettablename": None
		}
		# 每張開放桌各自算空位清單 (linkuser 看 sessionplayer 在桌名單, 非 linkuser 看 seating 流水推出的當前座位)
		emptymap={}
		for opentable in opentablelist:
			used=[]
			if sessionrow.get("linkuser"):
				targetplayers=tableactiveplayers(sessionrow["id"],opentable["id"])
				for player in targetplayers:
					used.append(player["seatno"])
			else:
				targetcurrent=tablecurrentplayers(sessionrow,opentable["id"])
				for seat in targetcurrent:
					if seat.get("player"):
						used.append(seat["seatno"])
			empty=[]
			for seatno in range(1,maxseat+1):
				if seatno not in used:
					empty.append(seatno)
			emptymap[opentable["id"]]=empty
		if sessionrow.get("linkuser"):
			sourceplayers=tableactiveplayers(sessionrow["id"],tableid)
		else:
			sourcecurrent=tablecurrentplayers(sessionrow,tableid)
			sourceplayers=[]
			for seat in sourcecurrent:
				if seat.get("player"):
					sourceplayers.append(seat)
		totalempty=0
		for opentable in opentablelist:
			totalempty=totalempty+len(emptymap[opentable["id"]])
		# 所有開放桌空位總和不足以容納來源人數 → 比照單桌空位不足回同一個錯
		if totalempty<len(sourceplayers):
			return errorresponse("ERROR_request_data_type_error")
		# 逐人分配: 每次選「目前剩餘空位最多」的桌 (平衡), 座位在該桌空位中隨機取; 明細在交易寫入前組好
		sqllist=[]
		for i in range(len(sourceplayers)):
			picked=None
			for opentable in opentablelist:
				if len(emptymap[opentable["id"]])<1:
					continue
				if picked is None or len(emptymap[picked["id"]])<len(emptymap[opentable["id"]]):
					picked=opentable
			seatno=random.choice(emptymap[picked["id"]])
			emptymap[picked["id"]].remove(seatno)
			if sessionrow.get("linkuser"):
				sqllist.append(["""UPDATE "sessionplayer" SET "tableid"=%s,"seatno"=%s,"updatetime"=NOW() WHERE "id"=%s""",[picked["id"],seatno,sourceplayers[i]["sessionplayerid"]]])
				movedata["moves"].append({
					"playername": sourceplayers[i].get("name") or "",
					"playerid": sourceplayers[i].get("playerid") or "",
					"fromseatno": sourceplayers[i]["seatno"],
					"totableno": picked.get("no"),
					"totablename": picked.get("name") or "",
					"toseatno": seatno
				})
			else:
				player=sourceplayers[i]["player"]
				sqllist.append(["""INSERT INTO "seating"("tableid","seatno","buyin","time","name","type","chip","createtime")VALUES(%s,%s,%s,NOW(),%s,%s,%s,NOW())""",[picked["id"],seatno,0,player.get("name") or "","buyin",player.get("chip") or sessionrow.get("chip") or 0]])
				movedata["moves"].append({
					"playername": player.get("name") or "",
					"playerid": "",
					"fromseatno": sourceplayers[i]["seatno"],
					"totableno": picked.get("no"),
					"totablename": picked.get("name") or "",
					"toseatno": seatno
				})
		if not sessionrow.get("linkuser"):
			sqllist.append(["""UPDATE "seating" SET "deletetime"=NOW() WHERE "tableid"=%s AND "deletetime" IS NULL""",[tableid]])
		if sqllist:
			result=querytransaction(SETTING["dbname"],sqllist,SETTING["dbsetting"])
			if result is None:
				return errorresponse("ERROR_database_error")
		if sessionrow.get("linkuser"):
			broadcasttablesession(sessionrow)
		return Response({"success": True,"data": movedata},status.HTTP_200_OK)
	used=[]
	# 併桌去向明細: 在交易寫入前就用已知的來源選手與空位對應組好, 不能事後再查(可能已被其他操作改動)
	movedata={
		"moves": [],
		"sourcetableno": tablerow.get("no"),
		"sourcetablename": tablerow.get("name") or "",
		"targettableno": targetrow.get("no"),
		"targettablename": targetrow.get("name") or ""
	}
	if sessionrow.get("linkuser"):
		targetplayers=tableactiveplayers(sessionrow["id"],targettableid)
		for i in range(len(targetplayers)):
			used.append(targetplayers[i]["seatno"])
		empty=[]
		for seatno in range(1,maxseat+1):
			if seatno not in used:
				empty.append(seatno)
		sourceplayers=tableactiveplayers(sessionrow["id"],tableid)
		if len(empty)<len(sourceplayers):
			return errorresponse("ERROR_request_data_type_error")
		sqllist=[]
		for i in range(len(sourceplayers)):
			sqllist.append(["""UPDATE "sessionplayer" SET "tableid"=%s,"seatno"=%s,"updatetime"=NOW() WHERE "id"=%s""",[targettableid,empty[i],sourceplayers[i]["sessionplayerid"]]])
			movedata["moves"].append({
				"playername": sourceplayers[i].get("name") or "",
				"playerid": sourceplayers[i].get("playerid") or "",
				"fromseatno": sourceplayers[i]["seatno"],
				"totableno": targetrow.get("no"),
				"totablename": targetrow.get("name") or "",
				"toseatno": empty[i]
			})
		if sqllist:
			result=querytransaction(SETTING["dbname"],sqllist,SETTING["dbsetting"])
			if result is None:
				return errorresponse("ERROR_database_error")
		broadcasttablesession(sessionrow)
		return Response({"success": True,"data": movedata},status.HTTP_200_OK)
	targetcurrent=tablecurrentplayers(sessionrow,targettableid)
	for i in range(len(targetcurrent)):
		if targetcurrent[i].get("player"):
			used.append(targetcurrent[i]["seatno"])
	empty=[]
	for seatno in range(1,maxseat+1):
		if seatno not in used:
			empty.append(seatno)
	sourcecurrent=tablecurrentplayers(sessionrow,tableid)
	sourceplayers=[]
	for i in range(len(sourcecurrent)):
		if sourcecurrent[i].get("player"):
			sourceplayers.append(sourcecurrent[i])
	if len(empty)<len(sourceplayers):
		return errorresponse("ERROR_request_data_type_error")
	sqllist=[]
	for i in range(len(sourceplayers)):
		player=sourceplayers[i]["player"]
		sqllist.append(["""INSERT INTO "seating"("tableid","seatno","buyin","time","name","type","chip","createtime")VALUES(%s,%s,%s,NOW(),%s,%s,%s,NOW())""",[targettableid,empty[i],0,player.get("name") or "","buyin",player.get("chip") or sessionrow.get("chip") or 0]])
		movedata["moves"].append({
			"playername": player.get("name") or "",
			"playerid": "",
			"fromseatno": sourceplayers[i]["seatno"],
			"totableno": targetrow.get("no"),
			"totablename": targetrow.get("name") or "",
			"toseatno": empty[i]
		})
	sqllist.append(["""UPDATE "seating" SET "deletetime"=NOW() WHERE "tableid"=%s AND "deletetime" IS NULL""",[tableid]])
	result=querytransaction(SETTING["dbname"],sqllist,SETTING["dbsetting"])
	if result is None:
		return errorresponse("ERROR_database_error")
	return Response({"success": True,"data": movedata},status.HTTP_200_OK)

@api_view(["POST"])
def closetable(request,tableid):
	# 關閉/重新開啟牌桌: closedtime 有值=已關閉(不再讓新選手進桌), NULL=開放中
	ensuretablesettingcolumns()
	userrow,errresp=tableauthuser(request)
	if errresp:
		return errresp
	tablerow=query(SETTING["dbname"],"""SELECT*FROM "table" WHERE "id"=%s AND "deletetime" IS NULL""",[tableid],SETTING["dbsetting"])
	if not tablerow:
		return errorresponse("ERROR_table_not_found")
	tablerow=tablerow[0]
	sessionrow=query(SETTING["dbname"],"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[tablerow["sessionid"]],SETTING["dbsetting"])
	if not sessionrow:
		return errorresponse("ERROR_session_not_found")
	sessionrow=sessionrow[0]
	if not tablemanageaccess(sessionrow,userrow):
		return errorresponse("ERROR_no_permission")
	data=json.loads(request.body or "{}")
	closed=boolval(data.get("closed"))
	if closed:
		query(SETTING["dbname"],"""UPDATE "table" SET "closedtime"=NOW(),"updatetime"=NOW() WHERE "id"=%s""",[tableid],SETTING["dbsetting"])
	else:
		query(SETTING["dbname"],"""UPDATE "table" SET "closedtime"=NULL,"updatetime"=NOW() WHERE "id"=%s""",[tableid],SETTING["dbsetting"])
	return Response({"success": True,"data": {"closed": closed}},status.HTTP_200_OK)

@api_view(["DELETE"])
def deletetable(request,tableid):
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	row=query(SETTING["dbname"],"""SELECT*FROM "table" WHERE "id"=%s AND "deletetime" IS NULL""",[tableid],SETTING["dbsetting"])
	if row:
		row=row[0]
		sessionrow=query(SETTING["dbname"],"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[row["sessionid"]],SETTING["dbsetting"])
		if sessionrow:
			sessionrow=sessionrow[0]
			if tokenuserrow["id"]==sessionrow["userid"] or 4<=int(tokenuserrow["permission"]):
				# 不論 tablelinked 與否都只軟刪指定的那張桌，避免整場牌桌被硬刪、手牌成孤兒
				query(SETTING["dbname"],"""UPDATE "table" SET "deletetime"=NOW() WHERE "id"=%s""",[tableid],SETTING["dbsetting"])

				return Response({
					"success": True,
					"data": ""
				},status.HTTP_200_OK)
			else:
				return errorresponse("ERROR_no_permission")
		else:
			return errorresponse("ERROR_session_not_found")
	else:
		return errorresponse("ERROR_table_not_found")
