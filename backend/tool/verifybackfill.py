# -*- coding: utf-8 -*-
"""
TASK-036 驗收（唯讀）：逐項檢查回填結果。

只跑 SELECT，不寫入任何一列。對照卡片的四條驗收：

1. 每一筆 hand 都能在 communitycard 找到 runno=1 列
   —— 例外是翻牌前就結束的手牌，本來就沒有公共牌，這裡分開統計而不是含混帶過。
2. 抽 20 筆逐欄比對正規化表與原 JSON
3. 腳本連跑兩次，第二次寫入 0 列（由 backfill 腳本自己的輸出佐證，這裡查重複列）
4. 異常格式列有明確處理方式
"""

import os
import sys
import json

HERE=os.path.dirname(os.path.abspath(__file__))
BACKEND=os.path.dirname(HERE)
sys.path.insert(0,BACKEND)

from function.sql import query
from api.initialize import SETTING

DBNAME=SETTING["dbname"]
DBSETTING=SETTING["dbsetting"]


def rows(sql,args=None):
    return query(DBNAME,sql,args or [],DBSETTING) or []


def main():
    print("=== 1. 覆蓋率 ===")
    total=rows("""SELECT COUNT(*) AS n FROM "hand" WHERE "deletetime" IS NULL""")[0]["n"]
    # 「有沒有公共牌」用 Python 判斷，不用 SQL 拆 JSON：flop 是陣列、turn/river 是字串，
    # 混在一起的 json 運算子寫法很脆弱，而且要和回填腳本的判斷完全一致才有比對意義。
    handlist=rows("""SELECT "id","boardcard","totalpot" FROM "hand" WHERE "deletetime" IS NULL""")
    hasboard=[]
    noboard=[]
    for hand in handlist:
        board=json.loads(hand["boardcard"]) if hand["boardcard"] else {}
        filled=False
        for key in ["flop","turn","river"]:
            value=board.get(key)
            if isinstance(value,list) and len(value)>0:
                filled=True
            if not isinstance(value,list) and value:
                filled=True
        if filled:
            hasboard.append(hand["id"])
        else:
            noboard.append(hand["id"])
    covered=set([r["handid"] for r in rows("""SELECT DISTINCT "handid" FROM "communitycard" WHERE "runno"=1""")])
    missing=[x for x in hasboard if x not in covered]
    extra=[x for x in noboard if x in covered]
    print("  hand 未刪除              %s"%total)
    print("  有公共牌的手牌          %s，其中已回填 %s，缺 %s %s"%(len(hasboard),len(hasboard)-len(missing),len(missing),missing[:10]))
    print("  翻牌前結束（無公共牌）  %s，其中被誤寫入 %s %s"%(len(noboard),len(extra),extra[:10]))
    print()

    print("=== 2. 抽驗 20 筆逐欄比對 ===")
    sample=rows("""
        SELECT "id","boardcard","totalpot" FROM "hand"
        WHERE "deletetime" IS NULL AND "id" IN (SELECT "handid" FROM "communitycard")
        ORDER BY MOD("id"*7919,997) LIMIT 20
    """)
    bad=0
    for hand in sample:
        handid=hand["id"]
        board=json.loads(hand["boardcard"]) if hand["boardcard"] else {}
        expect={}
        for key in ["flop","turn","river"]:
            value=board.get(key)
            cards=[]
            if isinstance(value,list):
                cards=[str(x) for x in value if x]
            elif value:
                cards=[str(value)]
            if cards:
                expect[key]=cards
        actual={}
        for row in rows("""SELECT "street","cards","runno" FROM "communitycard" WHERE "handid"=%s""",[handid]):
            actual[row["street"]]=[str(x) for x in row["cards"]]
        boardok=expect==actual

        potrow=rows("""SELECT "amount","runno","potno","ismain" FROM "handpot" WHERE "handid"=%s""",[handid])
        potok=len(potrow)==1 and int(potrow[0]["amount"])==int(hand["totalpot"] or 0)

        expectalloc={}
        for seat in rows("""SELECT "seatno","winnered","chip","chipchange","endchip" FROM "handseating" WHERE "handid"=%s AND "deletetime" IS NULL""",[handid]):
            if seat["winnered"]:
                amount=int((seat["endchip"] or 0)-(seat["chip"] or 0)+(seat["chipchange"] or 0))
                if amount>0:
                    expectalloc[seat["seatno"]]=amount
        actualalloc={}
        for row in rows("""SELECT a."seatno",a."amount" FROM "handpotallocation" a JOIN "handpot" p ON p."id"=a."handpotid" WHERE p."handid"=%s""",[handid]):
            actualalloc[row["seatno"]]=int(row["amount"])
        allocok=expectalloc==actualalloc

        flag="OK " if (boardok and potok and allocok) else "NG "
        if flag=="NG ":
            bad=bad+1
        print("  %s hand %-5s 公共牌%s 獎池%s 分配%s  %s"%(
            flag,handid,
            "一致" if boardok else "不符",
            "一致" if potok else "不符",
            "一致" if allocok else "不符",
            json.dumps(actual,ensure_ascii=False)))
        if not boardok:
            print("        期望 %s"%json.dumps(expect,ensure_ascii=False))
        if not allocok:
            print("        分配 期望 %s / 實際 %s"%(expectalloc,actualalloc))
    print("  抽驗 %s 筆，不符 %s 筆"%(len(sample),bad))
    print()

    print("=== 3. 有沒有重複列（冪等性的痕跡）===")
    dup1=rows("""SELECT "handid","runno","street",COUNT(*) AS n FROM "communitycard" GROUP BY 1,2,3 HAVING COUNT(*)>1""")
    dup2=rows("""SELECT "handid","runno","potno",COUNT(*) AS n FROM "handpot" GROUP BY 1,2,3 HAVING COUNT(*)>1""")
    dup3=rows("""SELECT "handpotid","seatno",COUNT(*) AS n FROM "handpotallocation" GROUP BY 1,2 HAVING COUNT(*)>1""")
    print("  communitycard 重複 (handid,runno,street)   %s"%len(dup1))
    print("  handpot 重複 (handid,runno,potno)          %s"%len(dup2))
    print("  handpotallocation 重複 (handpotid,seatno)  %s"%len(dup3))
    print()

    print("=== 4. 總量對帳 ===")
    print("  communitycard      %s"%rows("""SELECT COUNT(*) AS n FROM "communitycard" """)[0]["n"])
    print("  handpot            %s"%rows("""SELECT COUNT(*) AS n FROM "handpot" """)[0]["n"])
    print("  handpotallocation  %s"%rows("""SELECT COUNT(*) AS n FROM "handpotallocation" """)[0]["n"])
    orphan=rows("""SELECT COUNT(*) AS n FROM "handpotallocation" a LEFT JOIN "handpot" p ON p."id"=a."handpotid" WHERE p."id" IS NULL""")[0]["n"]
    print("  孤兒分配列（找不到獎池）  %s"%orphan)
    sumdiff=rows("""
        SELECT p."handid",p."amount" AS pot,COALESCE(SUM(a."amount"),0) AS alloc
        FROM "handpot" p LEFT JOIN "handpotallocation" a ON a."handpotid"=p."id"
        GROUP BY p."handid",p."amount"
        HAVING p."amount"<>COALESCE(SUM(a."amount"),0)
    """)
    print("  獎池金額 <> 分配合計      %s 筆"%len(sumdiff))
    for row in sumdiff[:10]:
        print("      hand %s  pot=%s  alloc=%s"%(row["handid"],row["pot"],row["alloc"]))
    if len(sumdiff)>10:
        print("      （其餘 %s 筆略）"%(len(sumdiff)-10))
    return 0


if __name__=="__main__":
    sys.exit(main())
