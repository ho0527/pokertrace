# -*- coding: utf-8 -*-
"""
正式庫 `pokertrace` 與測試庫 `pokertrace_test` 逐項比對。**唯讀，只跑 SELECT。**

## 為什麼要有這一支

2026-07-31 使用者回報「正式機只剩 5 筆場次、playerid 也變了」。
查到 `C:\\nginx\\web\\pokertrace\\backend\\api\\initialize.py` 的內容
和測試機的**完全相同** —— `dbname` 是 `pokertrace_test`、
`BASERUL` 是 `https://test.pokertrace.net/frontend/`。檔案時間 2026-07-29 17:15:50。
也就是說正式機的後端設定被測試機的版本蓋掉了，**正式站一直在讀寫測試庫**。

這一支要回答三個問題，而且都不能靠猜：

1. 正式庫 `pokertrace` 還在不在、資料還在不在（**最重要**）
2. 使用者在兩個庫裡各是哪一列（`playerid` 為什麼會變）
3. 從 2026-07-29 17:15 之後，有多少列被寫進了**錯的那個庫**

## 不做什麼

**不修任何東西。** 不 INSERT、不 UPDATE、不 DELETE、不建庫、不改設定。
要怎麼處理由人決定 —— 這件事有真實資料在裡面，不是可以順手「修好」的。

## 跑法

    cd backend && call .\\localenv.cmd && python tool/comparedb.py
"""
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")
HERE=os.path.dirname(os.path.abspath(__file__))
BACKEND=os.path.dirname(HERE)
sys.path.insert(0,BACKEND)

from function.sql import query
from api.initialize import SETTING

DBSETTING=SETTING["dbsetting"]
PRODNAME="pokertrace"
TESTNAME="pokertrace_test"
# 正式機 backend/api/initialize.py 被測試機版本覆蓋的時間
BROKENAT="2026-07-29 17:15:50"
EMAIL="chris960527ho@gmail.com"


def rows(dbname,sql,args=None):
    """query() 連不上時是靜默回 None —— 這裡把 None 和「真的沒有列」分開。"""
    out=query(dbname,sql,args or [],DBSETTING)
    return out


def alive(dbname):
    probe=rows(dbname,"""SELECT COUNT(*) AS n FROM information_schema.tables WHERE "table_schema"='public'""")
    out=False
    if probe is not None and len(probe) and int(probe[0]["n"])>0:
        out=True
    return out


print("=== 一、兩個資料庫還在不在 ===")
livelist=[]
for dbname in [PRODNAME,TESTNAME]:
    if alive(dbname):
        table=rows(dbname,"""SELECT COUNT(*) AS n FROM information_schema.tables WHERE "table_schema"='public'""")
        print("  %-18s 連得上，public schema 有 %s 張表"%(dbname,table[0]["n"]))
        livelist.append(dbname)
    else:
        print("  %-18s **連不上或沒有任何表**"%dbname)
print("")

if not livelist:
    print("兩個庫都連不上。多半是沒有先 `call .\\localenv.cmd`（少了 DB 密碼），")
    print("而不是資料不見了 —— 先確認這一點再往下判斷。")
    sys.exit(2)

print("=== 二、主要資料表筆數（含軟刪，另外標出有效列）===")
TABLELIST=["user","session","sessionplayer","hand","club","table","userstaff","sessionstaff"]
print("  %-16s %-24s %-24s"%("資料表",PRODNAME,TESTNAME))
for name in TABLELIST:
    line=[]
    for dbname in [PRODNAME,TESTNAME]:
        cell="（庫連不上）"
        if dbname in livelist:
            total=rows(dbname,"SELECT COUNT(*) AS n FROM \"%s\""%name)
            if total is None:
                cell="（沒有這張表）"
            else:
                live=rows(dbname,"SELECT COUNT(*) AS n FROM \"%s\" WHERE \"deletetime\" IS NULL"%name)
                livetext="-"
                if live is not None:
                    livetext=str(live[0]["n"])
                cell="共 %s（有效 %s）"%(total[0]["n"],livetext)
        line.append(cell)
    print("  %-16s %-24s %-24s"%(name,line[0],line[1]))
print("")

print("=== 三、使用者 %s 在兩個庫各是哪一列 ==="%EMAIL)
print("（`playerid` 是各庫自己發的流水號 —— 換一個庫，同一個人本來就會是不同的號。）")
for dbname in livelist:
    row=rows(dbname,"""SELECT "id","playerid","name","email","createtime","deletetime"
        FROM "user" WHERE "email"=%s ORDER BY "id\"""",[EMAIL])
    print("  --- %s ---"%dbname)
    if row is None or not len(row):
        print("      這個庫裡**沒有**這個 email 的帳號")
    else:
        for item in row:
            print("      id=%s  playerid=%s  name=%s  建立=%s  刪除=%s"%(
                item["id"],item["playerid"],item["name"],item["createtime"],item["deletetime"]))
print("")

print("=== 四、該使用者名下的場次數 ===")
for dbname in livelist:
    row=rows(dbname,"""SELECT COUNT(*) AS n FROM "session"
        WHERE "userid" IN (SELECT "id" FROM "user" WHERE "email"=%s) AND "deletetime" IS NULL""",[EMAIL])
    count="（查不到）"
    if row is not None and len(row):
        count=row[0]["n"]
    print("  %-18s %s 筆有效場次"%(dbname,count))
print("")

print("=== 五、%s 之後寫進各庫的列（這些是「跑錯庫」期間產生的資料）==="%BROKENAT)
print("（正式站從那個時間點起讀寫的是 %s。這裡列的是那之後新增的列，"%TESTNAME)
print("  也就是**本來應該進正式庫、實際進了測試庫**的候選資料。要不要搬、怎麼搬，由人決定。）")
for name in ["user","session","sessionplayer","hand"]:
    line=[]
    for dbname in [PRODNAME,TESTNAME]:
        cell="（庫連不上）"
        if dbname in livelist:
            row=rows(dbname,"SELECT COUNT(*) AS n FROM \"%s\" WHERE \"createtime\">=%%s"%name,[BROKENAT])
            if row is None:
                cell="（沒有這張表或沒有 createtime）"
            else:
                cell=str(row[0]["n"])+" 列"
        line.append(cell)
    print("  %-16s %-24s %-24s"%(name,PRODNAME+"："+line[0],TESTNAME+"："+line[1]))
print("")

print("=== 六、兩庫最新一筆場次的時間（看正式庫是不是從那時起就沒再進資料）===")
for dbname in livelist:
    row=rows(dbname,"""SELECT MAX("createtime") AS latest FROM "session\"""")
    latest="（查不到）"
    if row is not None and len(row):
        latest=row[0]["latest"]
    print("  %-18s 最新場次建立時間 %s"%(dbname,latest))
print("")

print("=== 七、schema 差異：正式庫少了哪些欄位 ===")
print("（2026-07-31 重啟正式機後端後，log 每次排程都噴")
print("  `column \"startnotifiedtime\" does not exist` —— 那個欄位在測試庫有、正式庫沒有。")
print("  程式已經在用的欄位，正式庫卻沒有，等於那條功能在正式站是壞的而且一直在報錯。）")
COLSQL="""SELECT "table_name"||'.'||"column_name" AS col
    FROM information_schema.columns WHERE "table_schema"='public'"""
colof={}
for dbname in [PRODNAME,TESTNAME]:
    row=rows(dbname,COLSQL)
    colof[dbname]=set()
    if row is not None:
        for item in row:
            colof[dbname].add(item["col"])
missingprod=sorted(colof[TESTNAME]-colof[PRODNAME])
missingtest=sorted(colof[PRODNAME]-colof[TESTNAME])
print("  測試庫有、**正式庫沒有**：%d 個"%len(missingprod))
for name in missingprod:
    print("      %s"%name)
print("  正式庫有、測試庫沒有：%d 個"%len(missingtest))
for name in missingtest:
    print("      %s"%name)
print("")
TABLESQL="""SELECT "table_name" AS t FROM information_schema.tables WHERE "table_schema"='public'"""
tableof={}
for dbname in [PRODNAME,TESTNAME]:
    row=rows(dbname,TABLESQL)
    tableof[dbname]=set()
    if row is not None:
        for item in row:
            tableof[dbname].add(item["t"])
print("  測試庫有、正式庫沒有的**資料表**：%s"%(sorted(tableof[TESTNAME]-tableof[PRODNAME]) or "（無）"))
print("  正式庫有、測試庫沒有的**資料表**：%s"%(sorted(tableof[PRODNAME]-tableof[TESTNAME]) or "（無）"))
print("")
print("這支工具**沒有改動任何資料**。")
