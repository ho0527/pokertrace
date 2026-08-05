# -*- coding: utf-8 -*-
"""
TASK-037 驗收（唯讀）：逐手比對「新讀取路徑」與「舊欄位」給出的結果是否完全相同。

新路徑 = boardcardread() / totalpotread()（從 communitycard / handpot 讀）
舊路徑 = hand.boardcard / hand.totalpot

全部 476 手都比，不抽樣。任何一筆不同都會印出來。
"""

import os
import sys
import json

HERE=os.path.dirname(os.path.abspath(__file__))
BACKEND=os.path.dirname(HERE)
sys.path.insert(0,BACKEND)

import django
os.environ.setdefault("DJANGO_SECRET_KEY","tool-only-not-a-real-secret")
os.environ.setdefault("DJANGO_SETTINGS_MODULE","pokertrace.settings")
django.setup()

from function.sql import query
from api.initialize import SETTING
from api.hand import boardcardread,totalpotread,jsonval

DBNAME=SETTING["dbname"]
DBSETTING=SETTING["dbsetting"]


def rows(sql,args=None):
    return query(DBNAME,sql,args or [],DBSETTING) or []


def normalize(board):
    """舊欄位的 turn/river 可能是 None，新路徑一律是空字串；比對前拉齊。"""
    value=board if isinstance(board,dict) else {}
    return {
        "flop": [str(x) for x in (value.get("flop") or [])],
        "turn": str(value.get("turn") or ""),
        "river": str(value.get("river") or "")
    }


def main():
    handlist=rows("""SELECT * FROM "hand" WHERE "deletetime" IS NULL ORDER BY "id" """)
    communitymap={}
    for row in rows("""SELECT * FROM "communitycard" ORDER BY "handid","runno","id" """):
        communitymap.setdefault(row["handid"],[]).append(row)
    potmap={}
    for row in rows("""SELECT * FROM "handpot" ORDER BY "handid","runno","potno" """):
        potmap.setdefault(row["handid"],[]).append(row)

    boarddiff=[]
    potdiff=[]
    fallbackboard=0
    fallbackpot=0
    for hand in handlist:
        handid=hand["id"]
        newboard=normalize(boardcardread(hand,communitymap.get(handid,[])))
        oldboard=normalize(jsonval(hand.get("boardcard"),{}))
        if newboard!=oldboard:
            boarddiff.append((handid,oldboard,newboard))
        if not communitymap.get(handid):
            fallbackboard=fallbackboard+1

        newpot=totalpotread(hand,potmap.get(handid,[]))
        oldpot=int(hand.get("totalpot") or 0)
        if newpot!=oldpot:
            potdiff.append((handid,oldpot,newpot))
        if not potmap.get(handid):
            fallbackpot=fallbackpot+1

    print("比對手牌數                %s（全部，未抽樣）"%len(handlist))
    print("公共牌不一致              %s"%len(boarddiff))
    for item in boarddiff[:20]:
        print("    hand %s"%item[0])
        print("        舊 %s"%json.dumps(item[1],ensure_ascii=False))
        print("        新 %s"%json.dumps(item[2],ensure_ascii=False))
    if len(boarddiff)>20:
        print("    （其餘 %s 筆略）"%(len(boarddiff)-20))
    print("總底池不一致              %s"%len(potdiff))
    for item in potdiff[:20]:
        print("    hand %s  舊 %s  新 %s"%(item[0],item[1],item[2]))
    if len(potdiff)>20:
        print("    （其餘 %s 筆略）"%(len(potdiff)-20))
    print()
    print("走回退（正規化表 0 列，讀舊欄位）")
    print("    公共牌  %s 手 —— 翻牌前結束的手牌本來就沒有公共牌，這是預期內的"%fallbackboard)
    print("    總底池  %s 手"%fallbackpot)
    return 1 if (boarddiff or potdiff) else 0


if __name__=="__main__":
    sys.exit(main())
