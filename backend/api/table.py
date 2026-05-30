# import
import bcrypt
import hashlib
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

# main START
try:
	@api_view(["GET"])
	def gettablelist(request,sessionid):
		header=request.headers.get("Authorization")
		token=None

		try:
			if header:
				token=header.split("Bearer ")[1]
		except Exception as error:
			return errorresponse("ERROR_token_not_found")

		if token:
			tokenrow=query(SETTING["dbname"],"""SELECT*FROM "token" WHERE "token"=%s""",[token],SETTING["dbsetting"])
			if tokenrow:
				tokenuserrow=query(SETTING["dbname"],"""SELECT*FROM "user" WHERE "id"=%s""",[tokenrow[0]["userid"]],SETTING["dbsetting"])
				if tokenuserrow:
					tokenuserrow=tokenuserrow[0]
					row=query(SETTING["dbname"],"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
					if row:
						row=row[0]
						if tokenuserrow["id"]==row["userid"] or 4<=int(tokenuserrow["permission"]):
							row=query(SETTING["dbname"],"""SELECT*FROM "table" WHERE "sessionid"=%s AND "deletetime" IS NULL ORDER BY "name" ASC""",[sessionid],SETTING["dbsetting"])

							return Response({
								"success": True,
								"data": row
							},status.HTTP_200_OK)
						else:
							return errorresponse("ERROR_no_permission")
					else:
						return errorresponse("ERROR_session_not_found")
				else:
					return errorresponse("ERROR_token_error")
			else:
				return errorresponse("ERROR_token_error")
		else:
			return errorresponse("ERROR_token_not_found")

	def calc_equity(hero,opp,board,iters=5000):
		deck=eval7.Deck()
		for c in hero+opp+board:
			if c in deck.cards:
				deck.cards.remove(c)
		win=0
		tie=0
		for _ in range(iters):
			random.shuffle(deck.cards)
			b=board+deck.cards[:5-len(board)]
			h1=eval7.evaluate(hero+b)
			h2=eval7.evaluate(opp+b)
			if h1>h2:win=win+1
			elif h1==h2:tie=tie+1
		return (win+tie*0.5)/iters

	def parsecardjson(value):
		try:
			if not value or value=="null":
				return []
			carddata=value
			if isinstance(value,str):
				carddata=json.loads(value)
			if carddata.get("card1") and carddata.get("card2"):
				return [carddata.get("card1"),carddata.get("card2")]
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
			if len(hero)!=2:
				continue
			try:
				hero_eval=[eval7.Card(hero[0]),eval7.Card(hero[1])]
				opps=[]
				for opp in seatingrow:
					if opp["seatno"]!=seatno and opp["seatno"] in allinseats:
						oppcard=parsecardjson(opp.get("handcard"))
						if len(oppcard)==0 and opp["seatno"]==hand.get("selfseating"):
							oppcard=parsecardjson(hand.get("handcard"))
						if len(oppcard)==2:
							opps.append([eval7.Card(oppcard[0]),eval7.Card(oppcard[1])])
				if len(opps)==0:
					continue
				equitytotal=0
				for oppcards in opps:
					equitytotal=equitytotal+calc_equity(hero_eval,oppcards,board_eval,2000)
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
						heroscore=eval7.evaluate(hero_eval+testboard)
						bestopp=None
						for oppcards in opps:
							score=eval7.evaluate(oppcards+testboard)
							if bestopp is None or score>bestopp:
								bestopp=score
						if bestopp is not None and heroscore>bestopp:
							outs.append(str(card))
				stats[seatno]={
					"equity": round(equity*100,2),
					"outs": outs
				}
			except Exception as error:
				stats[seatno]={
					"error": str(error)
				}
		return stats

	@api_view(["GET"])
	def gettable(request,tableid):
		header=request.headers.get("Authorization")
		token=None

		try:
			if header:
				token=header.split("Bearer ")[1]
		except Exception as error:
			return Response({"success":False,"data":"ERROR_token_not_found"},status.HTTP_401_UNAUTHORIZED)

		if token:
			tokenrow=query(SETTING["dbname"],"""SELECT*FROM "token" WHERE "token"=%s""",[token],SETTING["dbsetting"])
			if tokenrow:
				tokenuserrow=query(SETTING["dbname"],"""SELECT*FROM "user" WHERE "id"=%s""",[tokenrow[0]["userid"]],SETTING["dbsetting"])
				if tokenuserrow:
					row=query(SETTING["dbname"],"""SELECT*FROM "table" WHERE "id"=%s AND "deletetime" IS NULL""",[tableid],SETTING["dbsetting"])
					if row:
						row=row[0]
						sessionrow=query(SETTING["dbname"],"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[row["sessionid"]],SETTING["dbsetting"])[0]
						if tokenuserrow[0]["id"]==sessionrow["userid"] or 4<=int(tokenuserrow[0]["permission"]):
							seatingdata=[]
							handdata=[]
							ev_actual=[]
							ev_allin=[]

							for i in range(10):
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
									seatingrow=query(SETTING["dbname"],"""SELECT*FROM "handseating" WHERE "handid"=%s AND "deletetime" IS NULL ORDER BY "seatno" ASC""",[hand["id"]],SETTING["dbsetting"])
									bittingrow=query(SETTING["dbname"],"""SELECT*FROM "handbittingdata" WHERE "handid"=%s AND "deletetime" IS NULL""",[hand["id"]],SETTING["dbsetting"])
									allinstats=calcallinstats(hand,seatingrow,bittingrow)
									selfseating=None
									for s in seatingrow:
										if s["seatno"]==hand["selfseating"]:
											selfseating=s
											break

									actual_ev=selfseating["endchip"]-selfseating["chip"] if selfseating else 0

									allin_ev = None
									luck = None
									allin_ev_debug = {}
									import json as _json
									def parse_handcard(cardstr):
										try:
											if not cardstr or cardstr=="null": return []
											d = _json.loads(cardstr) if isinstance(cardstr,str) else cardstr
											return [d.get("card1"), d.get("card2")] if d.get("card1") and d.get("card2") else []
										except Exception as e:
											return []
									def parse_boardcard(boardstr):
										try:
											if not boardstr or boardstr=="null": return []
											d = _json.loads(boardstr) if isinstance(boardstr,str) else boardstr
											cards = []
											if d.get("flop"): cards += d["flop"]
											if d.get("turn"): cards.append(d["turn"])
											if d.get("river"): cards.append(d["river"])
											return cards
										except Exception as e:
											return []

									# 取得 hero 手牌
									hero_cards = parse_handcard(hand.get("handcard"))
									board = parse_boardcard(hand.get("boardcard"))
									total_pot = hand.get("totalpot", 0)
									invest = 0
									# 找出自己在 seatingdata 的 invest
									for s in hand.get("seatingdata", []):
										if s.get("seatno") == hand.get("selfseating"):
											invest = s.get("chipchange", 0)
											break
									allin_ev_debug = {
										"hero_cards": hero_cards,
										"board": board,
										"total_pot": total_pot,
										"invest": invest,
										"debug_board": None,
										"note": None
									}
									if hero_cards:
										try:
											hero_cards_eval = [eval7.Card(c) for c in hero_cards]
											board_eval = [eval7.Card(c) for c in board] if board else []
											# 對手show card
											opps = []
											for s in hand.get("seatingdata", []):
												if s.get("seatno") != hand.get("selfseating") and s.get("handcard") and s.get("handcard") != "null":
													opp_cards = parse_handcard(s.get("handcard"))
													if len(opp_cards) == 2:
														opps.append([eval7.Card(c) for c in opp_cards])
											if len(opps) > 0:
												equity_sum = 0
												for opp_cards_eval in opps:
													equity_sum += calc_equity(hero_cards_eval, opp_cards_eval, board_eval)
												equity = equity_sum / len(opps)
												allin_ev_debug["debug_board"] = [str(c) for c in board_eval]
											else:
												deck = eval7.Deck()
												used_cards = hero_cards_eval + board_eval
												for c in used_cards:
													if c in deck.cards:
														deck.cards.remove(c)
												import random
												win = tie = 0
												iters = 5000
												debug_board_example = None
												for i in range(iters):
													random.shuffle(deck.cards)
													opp_cards = deck.cards[:2]
													# 補齊 board
													b = board_eval.copy()
													need = 5 - len(b)
													if need > 0:
														b += deck.cards[2:2+need]
													if i == 0:
														debug_board_example = [str(c) for c in b]
													h1 = eval7.evaluate(hero_cards_eval+b)
													h2 = eval7.evaluate(opp_cards+b)
													if h1 > h2: win += 1
													elif h1 == h2: tie += 1
												equity = (win + tie*0.5) / iters
												allin_ev_debug["debug_board"] = debug_board_example
												if len(board_eval) not in [3,4,5]:
													allin_ev_debug["note"] = f"board length unusual: {len(board_eval)}"
											allin_ev = equity*total_pot - invest
											luck = actual_ev - allin_ev
											if invest == 0:
												allin_ev_debug["note"] = (allin_ev_debug.get("note","") + " invest=0").strip()
										except Exception as e:
											allin_ev = None
											luck = None
											import traceback
											allin_ev_debug["error"] = str(e)
											allin_ev_debug["traceback"] = traceback.format_exc()

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

							return Response({
								"success":True,
								"data":{
									**sessionrow,
									**row,
									"sessiontoken":sessionrow["token"],
									"seating":seatingdata,
									"hand":handdata,
									"ev":{"actual":ev_actual,"allin":ev_allin},
									"blindstructures":timerlevelrow or [],
									"registeredplayers":registeredrow or [],
									"club":clubrow[0] if clubrow else None,
									"clubname":clubrow[0]["name"] if clubrow else "協會被刪除"
								}
							},status.HTTP_200_OK)
						else:
							return errorresponse("ERROR_no_permission")
					else:
						return errorresponse("ERROR_table_not_found")
				else:
					return errorresponse("ERROR_user_not_found")
			else:
				return errorresponse("ERROR_token_error")
		else:
			return errorresponse("ERROR_token_not_found")

	@api_view(["POST"])
	def newtable(request,sessionid):
		header=request.headers.get("Authorization")
		token=None

		try:
			if header:
				token=header.split("Bearer ")[1]
		except Exception as error:
			return errorresponse("ERROR_token_not_found")

		if token:
			tokenrow=query(SETTING["dbname"],"""SELECT*FROM "token" WHERE "token"=%s""",[token],SETTING["dbsetting"])
			if tokenrow:
				tokenuserrow=query(SETTING["dbname"],"""SELECT*FROM "user" WHERE "id"=%s""",[tokenrow[0]["userid"]],SETTING["dbsetting"])
				if tokenuserrow:
					tokenuserrow=tokenuserrow[0]
					sessionrow=query(SETTING["dbname"],"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[sessionid],SETTING["dbsetting"])
					if sessionrow:
						sessionrow=sessionrow[0]
						if tokenuserrow["id"]==sessionrow["userid"] or 4<=int(tokenuserrow["permission"]):
							data=json.loads(request.body)

							requestdata=validate(data,{
								"name": "required|string",
							},{
								"required": "ERROR_request_data_not_found",
								"string": "ERROR_request_data_type_error",
								"linked": "ERROR_request_data_type_error"
							})

							if requestdata["error"] is None:
								name=requestdata["data"].get("name")

								row=query(SETTING["dbname"],"""SELECT*FROM "table" WHERE "sessionid"=%s""",[sessionid],SETTING["dbsetting"])

								query(SETTING["dbname"],"""INSERT INTO "table"("token","sessionid","name")VALUES(%s,%s,%s)""",[f"TB{sessionrow["token"]}{(str(len(row)+1)).zfill(2)}",sessionid,name],SETTING["dbsetting"])

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
					return errorresponse("ERROR_token_error")
			else:
				return errorresponse("ERROR_token_error")
		else:
			return errorresponse("ERROR_token_not_found")

	@api_view(["PUT"])
	def edittable(request,tableid):
		header=request.headers.get("Authorization")
		token=None

		try:
			if header:
				token=header.split("Bearer ")[1]
		except Exception as error:
			return errorresponse("ERROR_token_not_found")

		if token:
			tokenrow=query(SETTING["dbname"],"""SELECT*FROM "token" WHERE "token"=%s""",[token],SETTING["dbsetting"])
			if tokenrow:
				tokenuserrow=query(SETTING["dbname"],"""SELECT*FROM "user" WHERE "id"=%s""",[tokenrow[0]["userid"]],SETTING["dbsetting"])
				if tokenuserrow:
					tokenuserrow=tokenuserrow[0]
					row=query(SETTING["dbname"],"""SELECT*FROM "table" WHERE "id"=%s AND "deletetime" IS NULL""",[tableid],SETTING["dbsetting"])
					if row:
						row=row[0]
						sessionrow=query(SETTING["dbname"],"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[row["sessionid"]],SETTING["dbsetting"])
						if sessionrow:
							sessionrow=sessionrow[0]
							if tokenuserrow["id"]==sessionrow["userid"] or 4<=int(tokenuserrow["permission"]):
								data=json.loads(request.body)

								requestdata=validate(data,{
									"name": "required|string",
								},{
									"required": "ERROR_request_data_not_found",
									"string": "ERROR_request_data_type_error",
									"linked": "ERROR_request_data_type_error"
								})

								if requestdata["error"] is None:
									name=requestdata["data"].get("name")

									query(SETTING["dbname"],"""UPDATE "table" SET "name"=%s WHERE "id"=%s""",[name,tableid],SETTING["dbsetting"])

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
				else:
					return errorresponse("ERROR_token_error")
			else:
				return errorresponse("ERROR_token_error")
		else:
			return errorresponse("ERROR_token_not_found")

	@api_view(["PUT"])
	def edittablesetting(request,tableid):
		header=request.headers.get("Authorization")
		token=None

		try:
			if header:
				token=header.split("Bearer ")[1]
		except Exception as error:
			return Response({
				"success": False,
				"data": "ERROR_token_not_found"
			},status.HTTP_401_UNAUTHORIZED)

		if token:
			tokenrow=query(SETTING["dbname"],"""SELECT*FROM "token" WHERE "token"=%s""",[token],SETTING["dbsetting"])
			if tokenrow:
				tokenuserrow=query(SETTING["dbname"],"""SELECT*FROM "user" WHERE "id"=%s""",[tokenrow[0]["userid"]],SETTING["dbsetting"])
				if tokenuserrow:
					tokenuserrow=tokenuserrow[0]
					row=query(SETTING["dbname"],"""SELECT*FROM "table" WHERE "id"=%s AND "deletetime" IS NULL""",[tableid],SETTING["dbsetting"])
					if row:
						row=row[0]
						sessionrow=query(SETTING["dbname"],"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[row["sessionid"]],SETTING["dbsetting"])
						if sessionrow:
							sessionrow=sessionrow[0]
							if tokenuserrow["id"]==sessionrow["userid"] or 4<=int(tokenuserrow["permission"]):

								requestdata=validate(json.loads(request.body),{
									"maxseat": "required|string|in:6,8,9,10",
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
				else:
					return errorresponse("ERROR_token_error")
			else:
				return errorresponse("ERROR_token_error")
		else:
			return errorresponse("ERROR_token_not_found")

	@api_view(["DELETE"])
	def deletetable(request,tableid):
		header=request.headers.get("Authorization")
		token=None

		try:
			if header:
				token=header.split("Bearer ")[1]
		except Exception as error:
			return errorresponse("ERROR_token_not_found")

		if token:
			tokenrow=query(SETTING["dbname"],"""SELECT*FROM "token" WHERE "token"=%s""",[token],SETTING["dbsetting"])
			if tokenrow:
				tokenuserrow=query(SETTING["dbname"],"""SELECT*FROM "user" WHERE "id"=%s""",[tokenrow[0]["userid"]],SETTING["dbsetting"])
				if tokenuserrow:
					tokenuserrow=tokenuserrow[0]
					row=query(SETTING["dbname"],"""SELECT*FROM "table" WHERE "id"=%s AND "deletetime" IS NULL""",[tableid],SETTING["dbsetting"])
					if row:
						row=row[0]
						sessionrow=query(SETTING["dbname"],"""SELECT*FROM "session" WHERE "id"=%s AND "deletetime" IS NULL""",[row["sessionid"]],SETTING["dbsetting"])
						if sessionrow:
							sessionrow=sessionrow[0]
							if tokenuserrow["id"]==sessionrow["userid"] or 4<=int(tokenuserrow["permission"]):
								if sessionrow["tablelinked"]:
									query(SETTING["dbname"],"""DELETE FROM "table" WHERE "sessionid"=%s""",[sessionrow["id"]],SETTING["dbsetting"])

									return Response({
										"success": True,
										"data": ""
									},status.HTTP_200_OK)
								else:
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
				else:
					return errorresponse("ERROR_token_error")
			else:
				return errorresponse("ERROR_token_error")
		else:
			return errorresponse("ERROR_token_not_found")
except Exception as error:
	printcolorhaveline("fail","[ERROR] "+str(error),"")
	Response({
		"success": False,
		"data": "ERROR_unknow_error_pls_tell_the_admin:\n"+str(error)
	},status.HTTP_500_INTERNAL_SERVER_ERROR)
