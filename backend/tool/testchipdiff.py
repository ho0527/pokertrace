# -*- coding: utf-8 -*-
"""測試機：驗證報名清單端點的 expectedchipcount 與誤差。

會暫時改一位選手的 startchip 製造誤差，驗完改回原值。
"""
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0,os.path.abspath("."))
os.environ.setdefault("DJANGO_SETTINGS_MODULE","pokertrace.settings")
import django

django.setup()

from django.test import RequestFactory
from function.sql import query,queryinsert
from function.thing import nowtime
from api.initialize import SETTING
import api.sessionplayer as sessionplayerapi

DB=SETTING["dbname"]
S=SETTING["dbsetting"]
FACTORY=RequestFactory()
TEMPTOKEN="chipdifftest00000000000000000"
failed=0

if DB!="pokertrace_test":
    print("只跑測試庫，停止。")
    sys.exit(2)


def check(title,actual,expected):
    global failed
    mark="OK  "
    if actual!=expected:
        mark="FAIL"
        failed=failed+1
    print("  [%s] %-46s 得到 %s / 預期 %s"%(mark,title,actual,expected))


def fetch(sessionid,ownerid):
    request=FACTORY.get("/",HTTP_AUTHORIZATION="Bearer "+TEMPTOKEN)
    response=sessionplayerapi.getsessionregistrationlist(request,sessionid)
    return response.data["data"]


sessionrow=query(DB,"""
    SELECT s."id",s."userid",s."name",s."chip"
    FROM "session" s
    WHERE s."deletetime" IS NULL AND s."owned"=true AND s."linkuser"=true
      AND EXISTS(SELECT 1 FROM "sessionplayer" sp WHERE sp."sessionid"=s."id" AND sp."deletetime" IS NULL AND sp."status"='confirmed')
    ORDER BY s."id" LIMIT 1
""",[],S)[0]
SESSIONID=sessionrow["id"]
print("測試場次 %s：%s（起始碼 %s）"%(SESSIONID,sessionrow["name"],sessionrow["chip"]))

query(DB,"""DELETE FROM "token" WHERE "token"=%s""",[TEMPTOKEN],S)
tokenid=queryinsert(DB,"token",{"userid": sessionrow["userid"],"token": TEMPTOKEN,"createtime": nowtime()},S)

print("")
print("=== 1. 端點要回 expectedchipcount ===")
data=fetch(SESSIONID,sessionrow["userid"])
expectedbefore=data.get("expectedchipcount")
totalbefore=data.get("totalchipcount")
check("有 expectedchipcount 欄位",expectedbefore is not None,True)
print("      totalchipcount=%s  expectedchipcount=%s  誤差=%s"%(totalbefore,expectedbefore,totalbefore-expectedbefore))

print("")
print("=== 2. 改一位在場選手的碼量，誤差要跟著動 ===")
target=query(DB,"""
    SELECT sp."id",sp."startchip" FROM "sessionplayer" sp
    LEFT JOIN "sessiontimerplayer" tp ON tp."sessionplayerid"=sp."id" AND tp."sessionid"=sp."sessionid" AND tp."deletetime" IS NULL
    WHERE sp."sessionid"=%s AND sp."deletetime" IS NULL AND sp."status"='confirmed' AND COALESCE(tp."status",'')<>'eliminated'
    ORDER BY sp."id" LIMIT 1
""",[SESSIONID],S)[0]
originalchip=int(target["startchip"] or 0)
query(DB,"""UPDATE "sessionplayer" SET "startchip"=%s,"updatetime"=NOW() WHERE "id"=%s""",[originalchip+7777,target["id"]],S)
data=fetch(SESSIONID,sessionrow["userid"])
check("應有總量不受改碼影響",data.get("expectedchipcount"),expectedbefore)
check("已記錄總量 +7777",data.get("totalchipcount"),totalbefore+7777)
check("誤差 +7777",data.get("totalchipcount")-data.get("expectedchipcount"),(totalbefore-expectedbefore)+7777)

print("")
print("=== 3. 改回原值，誤差要回到原樣 ===")
query(DB,"""UPDATE "sessionplayer" SET "startchip"=%s,"updatetime"=NOW() WHERE "id"=%s""",[originalchip,target["id"]],S)
data=fetch(SESSIONID,sessionrow["userid"])
check("已記錄總量還原",data.get("totalchipcount"),totalbefore)
check("誤差還原",data.get("totalchipcount")-data.get("expectedchipcount"),totalbefore-expectedbefore)

after=query(DB,"""SELECT "startchip" FROM "sessionplayer" WHERE "id"=%s""",[target["id"]],S)[0]["startchip"]
check("選手碼量已回到原值",int(after or 0),originalchip)

query(DB,"""DELETE FROM "token" WHERE "id"=%s""",[tokenid],S)
print("")
if failed:
    print("有 %d 項不符。"%failed)
else:
    print("全部通過。")
sys.exit(1 if failed else 0)
