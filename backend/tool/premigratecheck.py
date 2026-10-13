# -*- coding: utf-8 -*-
"""
重啟正式機之前，先量化 `dbinitialize.py` 會對正式庫做什麼。**唯讀，只跑 SELECT。**

## 為什麼

`dbinitialize.py` 由 `runserver.cmd` 在每次啟動時執行。它**不是純新增** ——
除了 105 條 `ADD COLUMN IF NOT EXISTS`，還有兩段會 `DROP COLUMN` 的遷移：

- `user.chipsets`（JSON）→ 計分牌組資料表，然後 `DROP COLUMN chipsets`
- `user.toolfavorites`（JSON）→ `usertoolfavorite`，然後 `DROP COLUMN toolfavorites`

兩段都包了 `EXCEPTION WHEN OTHERS THEN RAISE WARNING`：某個使用者的舊 JSON 壞掉
會被**跳過**，然後欄位照樣被 DROP —— 那個人的資料就靜默消失了。

正式庫從來沒跑過這兩段（它的 DBNAME 一直指向測試庫），所以重啟時會是**第一次執行**，
對象是真實使用者。重啟前必須知道：**到底有幾列會被動到。**

如果那兩個欄位在正式庫根本不存在，`IF EXISTS` 守衛會讓整段跳過，風險就是零。
這支就是要把「風險是零」從猜測變成事實。

## 跑法

    cd backend && call .\\localenv.cmd && python tool/premigratecheck.py                 # 正式庫（預設）
    cd backend && call .\\localenv.cmd && python tool/premigratecheck.py pokertrace_test # 測試庫

測試機重啟一樣會跑 dbinitialize，所以一樣要先量。
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
# 預設量正式庫（這支原本就是為了「正式機重啟前先量一次」而寫的）。
# 2026-07-31 加上可指定資料庫：測試機重啟一樣會跑 dbinitialize，一樣要先量，
# 而寫死 pokertrace 會讓人以為量到的是自己那台 —— 那是最糟的一種誤報。
#     python tool/premigratecheck.py                    → pokertrace
#     python tool/premigratecheck.py pokertrace_test    → 測試庫
TARGETNAME="pokertrace"
for argument in sys.argv[1:]:
    if not argument.startswith("-"):
        TARGETNAME=argument

# dbinitialize.py 裡「會 DROP 掉的來源欄位」與「遷移目的地」
RISKLIST=[
    ("user","chipsets","計分牌組 JSON → 計分牌組資料表，之後 DROP COLUMN chipsets"),
    ("user","toolfavorites","工具最愛 JSON → usertoolfavorite，之後 DROP COLUMN toolfavorites"),
]
# 會被資料 UPDATE 動到的
UPDATELIST=[
    ("sessionplayer","serialno IS NULL","依報名順序回填 serialno"),
    ("user","\"cardback\" IS NULL OR \"cardface\" IS NULL","從 carddeck 補 cardback / cardface"),
]


def rows(sql,args=None):
    return query(TARGETNAME,sql,args or [],DBSETTING)


def columnexists(tablename,columnname):
    row=rows("""SELECT COUNT(*) AS n FROM information_schema.columns
        WHERE "table_schema"='public' AND "table_name"=%s AND "column_name"=%s""",[tablename,columnname])
    out=False
    if row is not None and len(row) and int(row[0]["n"])>0:
        out=True
    return out


probe=rows("""SELECT COUNT(*) AS n FROM information_schema.tables WHERE "table_schema"='public'""")
if probe is None:
    print("連不上 %s。多半是沒有先 `call .\\localenv.cmd`（少了 DB 密碼）。"%TARGETNAME)
    sys.exit(2)
print("目標資料庫：%s（%s 張表）"%(TARGETNAME,probe[0]["n"]))
print("")

print("=== 一、會 DROP COLUMN 的兩段遷移：%s 實際會動到幾列 ==="%TARGETNAME)
risky=0
for tablename,columnname,what in RISKLIST:
    if not columnexists(tablename,columnname):
        print("  %s.%s  **這個欄位在 %s 不存在** → IF EXISTS 守衛會讓整段跳過，動到 0 列。"%(tablename,columnname,TARGETNAME))
        print("      （%s）"%what)
    else:
        row=rows("SELECT COUNT(*) AS n FROM \"%s\" WHERE \"%s\" IS NOT NULL AND \"%s\"::text NOT IN ('','[]','{}')"%(tablename,columnname,columnname))
        count="（查不到）"
        if row is not None and len(row):
            count=row[0]["n"]
            risky=risky+int(count)
        print("  %s.%s  **欄位存在，有 %s 列有內容** → 重啟時會遷移然後 DROP。"%(tablename,columnname,count))
        print("      （%s）"%what)
        print("      這些列若 JSON 格式壞掉會被 RAISE WARNING 跳過，然後欄位照樣被 DROP —— 那就是靜默資料遺失。")
print("")

print("=== 二、會被資料 UPDATE 動到的列數 ===")
for tablename,condition,what in UPDATELIST:
    row=rows("SELECT COUNT(*) AS n FROM \"%s\" WHERE %s"%(tablename,condition))
    count="（查不到，可能是欄位還不存在）"
    if row is not None and len(row):
        count=str(row[0]["n"])+" 列"
    print("  %-16s %-28s %s"%(tablename,count,what))
print("")

print("=== 三、結論 ===")
if risky==0:
    print("  **重啟不會遺失任何資料。** 兩段 DROP COLUMN 遷移在 %s 沒有東西可動，"%TARGETNAME)
    print("  剩下的是 ADD COLUMN IF NOT EXISTS 與回填型 UPDATE，都是加東西不是刪東西。")
else:
    print("  **重啟會遷移 %d 列並在之後 DROP 掉來源欄位。**"%risky)
    print("  先確認備份存在且可還原（pg_restore --list 讀得出來）再重啟。")
print("")
print("這支工具**沒有改動任何資料**。")
