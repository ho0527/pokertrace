# -*- coding: utf-8 -*-
"""
測試機資料完整性健檢。**唯讀，只跑 SELECT**，不寫入任何一列。

## 為什麼要查

這個 schema 沒有真正的外鍵約束，父子關係靠程式碼手動 join，刪除靠 `deletetime` 軟刪。
所以下面這些狀況資料庫**不會阻止**，而且不會有任何錯誤訊息：

- 孤兒列：`tableid` 指向一張已經不存在（或已軟刪）的牌桌
- 軟刪不一致：父列已軟刪，子列還是「有效」的，於是統計會把它算進去
- 應該唯一卻重複：例如同一場次同一座位有兩列 confirmed

## 輸出

每一項都印出筆數與前幾筆的 id，方便直接去查。**只報告，不修**。
"""
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")
HERE=os.path.dirname(os.path.abspath(__file__))
BACKEND=os.path.dirname(HERE)
sys.path.insert(0,BACKEND)

from function.sql import query
from api.initialize import SETTING

DBNAME=SETTING["dbname"]
DBSETTING=SETTING["dbsetting"]


def rows(sql,args=None):
    return query(DBNAME,sql,args or [],DBSETTING) or []


def requiredatabase():
    """連不上資料庫就大聲失敗，不要印一堆 OK。

    專案的 `query()` 在連線失敗時是**靜默回 None** 的。沒有這個檢查的話，
    忘記 `call ./localenv.cmd`（沒有 DB 密碼）時每一項都會回空清單，
    A/B 兩節就會整排印「OK」—— 一個查不到任何東西卻報全綠的健檢，
    比沒有健檢更糟。實際踩過：`npm run audit:data` 少載 localenv.cmd 就是這樣。
    """
    probe=query(DBNAME,"""SELECT COUNT(*) AS n FROM information_schema.tables WHERE "table_schema"='public'""",[],DBSETTING)
    if not probe or int(probe[0]["n"])==0:
        print("連不上資料庫，或 public schema 裡一張表都沒有。")
        print("最常見的原因是沒有載入密鑰。請這樣跑：")
        print("    cd backend")
        print("    call .\\localenv.cmd && python tool\\dataintegrity.py")
        sys.exit(2)


requiredatabase()


def existingtables():
    out=[]
    for item in rows("""SELECT "table_name" FROM information_schema.tables WHERE "table_schema"='public' ORDER BY "table_name" """):
        out.append(item["table_name"])
    return out


def columnsof(tablename):
    out=[]
    for item in rows("""SELECT "column_name" FROM information_schema.columns WHERE "table_schema"='public' AND "table_name"=%s""",[tablename]):
        out.append(item["column_name"])
    return out


TABLESET=set(existingtables())
print("資料庫共 %d 張表"%len(TABLESET))
print("")

# (子表, 子表的外鍵欄, 父表) —— 只列真的存在的表
RELATION=[
    ("table","sessionid","session"),
    ("hand","tableid","table"),
    ("handseating","handid","hand"),
    ("handplayercard","handid","hand"),
    ("handbittingdata","handid","hand"),
    ("handpot","handid","hand"),
    ("communitycard","handid","hand"),
    ("sessionplayer","sessionid","session"),
    ("sessionstaff","sessionid","session"),
    ("sessionchip","sessionid","session"),
    ("sessiontimerconfig","sessionid","session"),
    ("sessionrelation","sourceid","session"),
    ("sessionrelation","targetid","session"),
    ("seriessession","seriesid","series"),
    ("seriessession","sessionid","session"),
    ("userstaff","userid","user"),
    ("notification","userid","user"),
    ("session","userid","user"),
]

problemtotal=0

print("=== A. 孤兒列：外鍵指向不存在的父列 ===")
for child,fkcol,parent in RELATION:
    if child not in TABLESET or parent not in TABLESET:
        print("  跳過 %s.%s → %s（表不存在）"%(child,fkcol,parent))
        continue
    childcols=columnsof(child)
    if fkcol not in childcols:
        print("  跳過 %s.%s → %s（欄位不存在）"%(child,fkcol,parent))
        continue
    childdel=""" AND c."deletetime" IS NULL""" if "deletetime" in childcols else ""
    sql="""SELECT c."id" FROM "%s" c LEFT JOIN "%s" p ON p."id"=c."%s"
           WHERE c."%s" IS NOT NULL AND p."id" IS NULL%s ORDER BY c."id" LIMIT 6"""%(child,parent,fkcol,fkcol,childdel)
    found=rows(sql)
    countsql="""SELECT COUNT(*) AS n FROM "%s" c LEFT JOIN "%s" p ON p."id"=c."%s"
                WHERE c."%s" IS NOT NULL AND p."id" IS NULL%s"""%(child,parent,fkcol,fkcol,childdel)
    total=rows(countsql)[0]["n"]
    if total:
        problemtotal=problemtotal+1
        print("  **%s.%s → %s：%d 筆孤兒**  前幾筆 id=%s"%(child,fkcol,parent,total,[x["id"] for x in found]))
    else:
        print("  OK  %s.%s → %s"%(child,fkcol,parent))

print("")
print("=== B. 軟刪不一致：父列已軟刪，子列還是有效的 ===")
for child,fkcol,parent in RELATION:
    if child not in TABLESET or parent not in TABLESET:
        continue
    childcols=columnsof(child)
    parentcols=columnsof(parent)
    if fkcol not in childcols or "deletetime" not in childcols or "deletetime" not in parentcols:
        continue
    countsql="""SELECT COUNT(*) AS n FROM "%s" c JOIN "%s" p ON p."id"=c."%s"
                WHERE c."deletetime" IS NULL AND p."deletetime" IS NOT NULL"""%(child,parent,fkcol)
    total=rows(countsql)[0]["n"]
    if total:
        problemtotal=problemtotal+1
        found=rows("""SELECT c."id" FROM "%s" c JOIN "%s" p ON p."id"=c."%s"
                      WHERE c."deletetime" IS NULL AND p."deletetime" IS NOT NULL ORDER BY c."id" LIMIT 6"""%(child,parent,fkcol))
        print("  **%s → %s：%d 筆子列有效但父列已刪**  前幾筆 id=%s"%(child,parent,total,[x["id"] for x in found]))
    else:
        print("  OK  %s → %s"%(child,parent))

print("")
print("=== C. hand.gametype 的實際值（TASK-049）===")
for item in rows("""SELECT "gametype",COUNT(*) AS n FROM "hand" WHERE "deletetime" IS NULL GROUP BY "gametype" ORDER BY n DESC"""):
    valid=item["gametype"] in ["HE","OM","O5","O8","BO","SD","ST","RA","AS","AD","AT","DS","DD","DT"]
    mark="OK " if valid else "**不是合法牌型代碼**"
    print("  %-14s %5d 筆   %s"%(item["gametype"],item["n"],mark))
    if not valid:
        problemtotal=problemtotal+1

print("")
print("=== D. 同一場次同一牌桌同一座位，有多筆有效報名 ===")
found=rows("""SELECT "sessionid","tableid","seatno",COUNT(*) AS n FROM "sessionplayer"
              WHERE "deletetime" IS NULL AND "tableid" IS NOT NULL AND "seatno" IS NOT NULL
              GROUP BY "sessionid","tableid","seatno" HAVING COUNT(*)>1 ORDER BY n DESC LIMIT 10""")
if found:
    problemtotal=problemtotal+1
    for item in found:
        print("  **場次 %s 牌桌 %s 座位 %s：%d 筆**"%(item["sessionid"],item["tableid"],item["seatno"],item["n"]))
else:
    print("  OK  沒有重複座位")

print("")
print("=== E. 手牌沒有任何座位列（記了手牌卻沒有人）===")
total=rows("""SELECT COUNT(*) AS n FROM "hand" h WHERE h."deletetime" IS NULL
              AND NOT EXISTS(SELECT 1 FROM "handseating" s WHERE s."handid"=h."id" AND s."deletetime" IS NULL)""")[0]["n"]
if total:
    problemtotal=problemtotal+1
    found=rows("""SELECT h."id" FROM "hand" h WHERE h."deletetime" IS NULL
                  AND NOT EXISTS(SELECT 1 FROM "handseating" s WHERE s."handid"=h."id" AND s."deletetime" IS NULL)
                  ORDER BY h."id" LIMIT 6""")
    print("  **%d 筆手牌沒有座位列**  前幾筆 id=%s"%(total,[x["id"] for x in found]))
else:
    print("  OK  每一筆手牌都有座位列")

print("")
print("共 %d 類有問題"%problemtotal)
# 有問題就回非零。不然 `npm run audit:data` 會顯示成功，
# 這支健檢就變成永遠是綠燈的裝飾品。連不上資料庫回 2，有問題回 1，全乾淨回 0。
sys.exit(1 if problemtotal else 0)
