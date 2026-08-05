# -*- coding: utf-8 -*-
"""
TASK-036：把既有手牌的 hand.boardcard / totalpot / handseating.winnered
回填進 communitycard / handpot / handpotallocation（runno=1）。

## 用什麼產生 SQL

直接呼叫 api/hand.py 的 normalizedwritesql()，與 TASK-035 的雙寫走同一段程式碼。
不另外寫一份平行邏輯，避免回填出來的資料和之後新寫入的資料長得不一樣。

## 冪等性

以 (handid, runno=1) 為鍵：跑之前先查出「已經有 runno=1 列」的 handid，
那些手牌整筆跳過。所以連跑兩次，第二次寫入 0 列。

## 分配金額怎麼算

persisthand 裡是 endchip=chip+wpot-ppot，而 handseating.chipchange 存的就是 ppot，
所以 wpot = endchip - chip + chipchange。用這個還原，不是自己另定一套算法。

## 預設是乾跑

不加 --apply 只會統計與試算，不寫任何一列。要真的寫入才加 --apply。
每一手牌自己一個交易，中途失敗不會讓該手牌只寫一半。

用法：

    cd backend
    call .\\localenv.cmd && python tool\\backfillnormalizedhand.py            # 乾跑
    call .\\localenv.cmd && python tool\\backfillnormalizedhand.py --apply    # 實際寫入
"""

import os
import sys
import json

HERE=os.path.dirname(os.path.abspath(__file__))
BACKEND=os.path.dirname(HERE)
sys.path.insert(0,BACKEND)

import django
# 只是要拿 normalizedwritesql 這個純函式，不啟服務；缺 key 時補一個只存在於
# 這個行程記憶體的臨時值。
os.environ.setdefault("DJANGO_SECRET_KEY","tool-only-not-a-real-secret")
os.environ.setdefault("DJANGO_SETTINGS_MODULE","pokertrace.settings")
django.setup()

from function.sql import query,querytransaction
from api.initialize import SETTING
from api.hand import normalizedwritesql

DBNAME=SETTING["dbname"]
DBSETTING=SETTING["dbsetting"]
APPLYED="--apply" in sys.argv


def rows(sql,args=None):
    return query(DBNAME,sql,args or [],DBSETTING) or []


def main():
    print("資料庫：%s"%DBNAME)
    print("模式  ：%s"%("實際寫入（--apply）" if APPLYED else "乾跑（不寫入任何一列）"))
    print()

    handlist=rows("""SELECT "id","boardcard","totalpot" FROM "hand" WHERE "deletetime" IS NULL ORDER BY "id" """)
    donelist=rows("""SELECT DISTINCT "handid" FROM "communitycard" WHERE "runno"=1""")
    donepot=rows("""SELECT DISTINCT "handid" FROM "handpot" WHERE "runno"=1""")
    doneset=set([r["handid"] for r in donelist]+[r["handid"] for r in donepot])

    seatlist=rows("""SELECT "handid","seatno","winnered","chipchange","endchip","chip" FROM "handseating" WHERE "deletetime" IS NULL ORDER BY "handid","seatno" """)
    seatmap={}
    for row in seatlist:
        seatmap.setdefault(row["handid"],[]).append(row)

    print("hand 未刪除總數      %s"%len(handlist))
    print("已有 runno=1 而跳過  %s"%len(doneset))
    print()

    noboard=[]
    nopot=[]
    mismatch=[]
    writtenhand=0
    writtenrow=0
    failed=[]

    for hand in handlist:
        handid=hand["id"]
        if handid in doneset:
            continue
        boardcard=json.loads(hand["boardcard"]) if hand["boardcard"] else {}
        totalpot=int(hand["totalpot"] or 0)

        allocationlist=[]
        for seat in seatmap.get(handid,[]):
            if seat["winnered"]:
                amount=int((seat["endchip"] or 0)-(seat["chip"] or 0)+(seat["chipchange"] or 0))
                if amount>0:
                    allocationlist.append({"seatno": seat["seatno"],"amount": amount})

        # 沒有任何一張公共牌 = 這手牌翻牌前就結束了，本來就沒有公共牌可寫。
        # 這是正常資料，不是異常，但要明確記錄有幾筆，不做靜默跳過。
        boardempty=True
        for key in ["flop","turn","river"]:
            value=boardcard.get(key)
            if isinstance(value,list) and len(value)>0:
                boardempty=False
            if not isinstance(value,list) and value:
                boardempty=False
        if boardempty:
            noboard.append(handid)
        if totalpot<=0 and not allocationlist:
            nopot.append(handid)
        allocationsum=sum([item["amount"] for item in allocationlist])
        if allocationlist and allocationsum!=totalpot:
            mismatch.append((handid,totalpot,allocationsum))

        sqllist=normalizedwritesql(handid,boardcard,totalpot,allocationlist)
        # 前三條是 DELETE（給編輯路徑用的），回填時該手牌本來就沒有列，
        # 保留也無害，且能保證與雙寫走完全相同的程式碼。
        if APPLYED:
            result=querytransaction(DBNAME,sqllist,DBSETTING)
            if result is None:
                failed.append(handid)
                continue
        writtenhand=writtenhand+1
        writtenrow=writtenrow+len(sqllist)-3

    print("=== 統計 ===")
    print("  這次處理的手牌        %s"%writtenhand)
    print("  預計/實際寫入列數     %s"%writtenrow)
    print("  寫入失敗的手牌        %s%s"%(len(failed),("："+",".join([str(x) for x in failed])) if failed else ""))
    print()
    print("=== 明確處理掉的特殊情況（不是靜默跳過）===")
    print("  完全沒有公共牌（翻牌前結束）  %s 筆 → communitycard 0 列，handpot 照常寫"%len(noboard))
    print("  沒有獎池也沒有贏家            %s 筆 → 三張表都不寫，只有 DELETE"%len(nopot))
    print("  分配總額與 totalpot 不符      %s 筆"%len(mismatch))
    for item in mismatch[:20]:
        print("      hand %s  totalpot=%s  分配合計=%s"%(item[0],item[1],item[2]))
    if len(mismatch)>20:
        print("      （其餘 %s 筆略）"%(len(mismatch)-20))
    print()

    print("=== 回填後的正規化表列數 ===")
    for table in ["communitycard","handpot","handpotallocation"]:
        print("  %-20s %s"%(table,rows("""SELECT COUNT(*) AS n FROM "%s" """%table)[0]["n"]))
    print()
    if not APPLYED:
        print("以上為乾跑結果，沒有寫入任何一列。要實際執行請加 --apply。")
    return 1 if failed else 0


if __name__=="__main__":
    sys.exit(main())
