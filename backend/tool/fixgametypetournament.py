# -*- coding: utf-8 -*-
"""
TASK-049 資料清理：`hand.gametype` 存成 `tournament` 的那批改成正確的牌型代碼。

## 背景

`hand.gametype` 應該存**牌型代碼**（HE / OM / O5 / O8 / BO / SD / …），
但寫入時有一段 `data.get("gametype") or sessionrow.get("gametype")` 的回退，
把**場次類型**（`tournament`）寫進去了。程式面已經修好
（`normalizehandgametype()` 現在會把認不得的值一律正規化成 HE），
所以不會再產生新的，剩下的是歷史資料。

## 這支怎麼用

    call .\\localenv.cmd && python tool\\fixgametypetournament.py          # 預設 dry-run，只看不改
    call .\\localenv.cmd && python tool\\fixgametypetournament.py --apply  # 真的改（先備份！）

**dry-run 是預設**，`--apply` 才會寫入，而且會在單一交易內執行、任一步失敗整批 rollback。

## 改成什麼、憑什麼

先前的分析結論是「那 50 手剛好都是 2 張底牌，所以判成德州剛好猜對」。
這支不相信那句話、自己重新驗證，結果**發現那句話是錯的**：

- 底牌不在 `handplayercard`（那張表是空的，0 列），也不在 `hand.handcard`（全是 `{}`），
  真正的存放處是 **`handseating.handcard`**（見 `tool/wherearetheholecards.py`）
- 實際分佈是 **30 手有 2 張底牌、20 手完全沒有底牌紀錄**，不是 50 手都有 2 張

判定規則：

- 2 張底牌 → `HE`（有牌可證）
- 0 張底牌 → 也建議 `HE`，理由是**執行期本來就已經當德州處理**：
  `equityomahaed("tournament")` 回 False、`equityholecount("tournament")` 回 2，
  所以把儲存值改成 HE 只是讓資料與既有行為一致，不改變任何顯示結果
- 其他張數 → **不自動改**，列出來人工判斷（4 張是奧馬哈、5 張是 O5 或 BO…）

## 破壞性操作的前置要求

`--apply` 之前務必先備份：

    call .\\localenv.cmd && python tool\\dumpdatabase.py pokertrace_test_before_TASK049.dump
"""
import json
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")
HERE=os.path.dirname(os.path.abspath(__file__))
BACKEND=os.path.dirname(HERE)
sys.path.insert(0,BACKEND)

# `api.hand` 會 import rest_framework，而 rest_framework 在 import 時就讀 Django settings，
# 所以要先 django.setup() 才能匯入 HANDGAMECODELIST。
# 刻意從原始碼匯入而不是在這裡抄一份清單 —— 抄一份就會跟 hand.py 漂移。
os.environ.setdefault("DJANGO_SETTINGS_MODULE","pokertrace.settings")
import django
django.setup()

from function.sql import query,querytransaction
from api.initialize import SETTING
from api.hand import HANDGAMECODELIST

DBNAME=SETTING["dbname"]
DBSETTING=SETTING["dbsetting"]

APPLYED="--apply" in sys.argv


def rows(sql,args=None):
    return query(DBNAME,sql,args or [],DBSETTING) or []


def requiredatabase():
    """連不上就大聲失敗，不要印一堆 0 假裝沒事。"""
    probe=query(DBNAME,"""SELECT COUNT(*) AS n FROM information_schema.tables WHERE "table_schema"='public'""",[],DBSETTING)
    if not probe or int(probe[0]["n"])==0:
        print("連不上資料庫，或 public schema 裡一張表都沒有。")
        print("最常見的原因是沒有載入密鑰。請這樣跑：")
        print("    cd backend")
        print("    call .\\localenv.cmd && python tool\\fixgametypetournament.py")
        sys.exit(2)


requiredatabase()

print("合法牌型代碼：%s"%", ".join(HANDGAMECODELIST))
print("")

# 1. 目前有哪些不合法的值
badvalue=[]
for item in rows("""SELECT "gametype",COUNT(*) AS n FROM "hand" WHERE "deletetime" IS NULL GROUP BY "gametype" ORDER BY n DESC"""):
    value=item["gametype"]
    if value not in HANDGAMECODELIST:
        badvalue.append((value,item["n"]))
    print("  %-14s %5d 筆   %s"%(value,item["n"],"OK" if value in HANDGAMECODELIST else "**不合法**"))

if not badvalue:
    print("")
    print("沒有不合法的 gametype，不需要處理。")
    sys.exit(0)

print("")
print("=== 逐筆重新驗證底牌張數（不相信既有結論，自己數）===")

# 2. 對每一筆不合法的手牌，數它的底牌張數。
# 來源是 handseating.handcard（JSON），不是 handplayercard ——
# 後者是**空表**（0 列），hand.handcard 也全是 {}，兩個都是死儲存。
# 這一點是查證出來的，不是照既有文件抄的，見 tool/wherearetheholecards.py。
targetlist=rows("""SELECT "id","gametype" FROM "hand"
                   WHERE "deletetime" IS NULL AND "gametype" NOT IN %s ORDER BY "id\"""",
                [tuple(HANDGAMECODELIST)])

bucket={}
detail=[]
for item in targetlist:
    handid=item["id"]
    seatrow=rows("""SELECT "handcard" FROM "handseating" WHERE "handid"=%s AND "deletetime" IS NULL""",[handid])
    maxcard=0
    for seat in seatrow:
        raw=seat.get("handcard")
        count=0
        if raw:
            try:
                data=json.loads(raw) if isinstance(raw,str) else raw
            except Exception:
                data=None
            if isinstance(data,list):
                count=len([x for x in data if x])
            elif isinstance(data,dict):
                count=len([k for k in data if data[k]])
        if count>maxcard:
            maxcard=count
    bucket[maxcard]=bucket.get(maxcard,0)+1
    detail.append((handid,item["gametype"],maxcard))

print("不合法 gametype 的手牌共 %d 筆，按「單一玩家最多幾張底牌」分組："%len(detail))
for key in sorted(bucket):
    if key==2:
        suggest="HE（有 2 張底牌可證）"
    elif key==0:
        suggest="HE（沒有底牌紀錄，但執行期本來就當德州處理）"
    else:
        suggest="**需人工判斷**"
    print("  %d 張底牌：%4d 筆   建議 %s"%(key,bucket[key],suggest))

# 0 張與 2 張都改成 HE：
#   2 張 —— 有牌可證
#   0 張 —— 沒有證據，但 equityomahaed("tournament") 回 False、equityholecount 回 2，
#           執行期已經當德州處理，改儲存值只是讓資料與既有行為一致，不改變任何顯示結果
safelist=[x for x in detail if x[2]==2 or x[2]==0]
unsafelist=[x for x in detail if x[2]!=2 and x[2]!=0]

print("")
print("=== 可安全改成 HE 的：%d 筆 ==="%len(safelist))
print("  前 10 筆 hand id：%s"%[x[0] for x in safelist[:10]])
print("")
print("=== 需人工判斷、**不會自動改**的：%d 筆 ==="%len(unsafelist))
for handid,value,count in unsafelist[:20]:
    print("  hand %s  gametype=%s  底牌 %d 張"%(handid,value,count))
if len(unsafelist)>20:
    print("  …另外 %d 筆"%(len(unsafelist)-20))

print("")
if not APPLYED:
    print("以上是 **dry-run**，沒有改任何資料。")
    print("要真的執行請先備份，再加 --apply：")
    print("    call .\\localenv.cmd && python tool\\dumpdatabase.py pokertrace_test_before_TASK049.dump")
    print("    call .\\localenv.cmd && python tool\\fixgametypetournament.py --apply")
    sys.exit(0)

if not safelist:
    print("沒有可安全改的資料，結束。")
    sys.exit(0)

print("=== --apply：把 %d 筆改成 HE（單一交易，任一失敗整批 rollback）==="%len(safelist))
idlist=[x[0] for x in safelist]
result=querytransaction(DBNAME,[
    ["""UPDATE "hand" SET "gametype"='HE',"updatetime"=NOW() WHERE "id" IN %s""",[tuple(idlist)]]
],DBSETTING)
if result is None:
    print("執行失敗，已 rollback，資料沒有改變。")
    sys.exit(1)
print("已更新。重新統計：")
for item in rows("""SELECT "gametype",COUNT(*) AS n FROM "hand" WHERE "deletetime" IS NULL GROUP BY "gametype" ORDER BY n DESC"""):
    print("  %-14s %5d 筆"%(item["gametype"],item["n"]))
