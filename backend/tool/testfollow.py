# -*- coding: utf-8 -*-
"""追隨功能的端到端測試（測試機）。

會寫入 userfollow 與一個臨時 token，跑完自己清掉。
不建立場次（新場次通知另外用既有場次列模擬 notifyfollowernewsession）。
"""
import json
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
import api.follow as followapi
import api.session as sessionapi

DB=SETTING["dbname"]
S=SETTING["dbsetting"]
FACTORY=RequestFactory()
TEMPTOKEN="testfollow0000000000000000000000"
failed=0


def check(title,actual,expected):
    global failed
    mark="OK  "
    if actual!=expected:
        mark="FAIL"
        failed=failed+1
    print("  [%s] %-52s 得到 %s / 預期 %s"%(mark,title,actual,expected))


def callget(view,token,querystring="",**kwargs):
    request=FACTORY.get("/?"+querystring,HTTP_AUTHORIZATION="Bearer "+token)
    return view(request,**kwargs)


def callbody(view,token,method,body,**kwargs):
    request=getattr(FACTORY,method)("/",data=json.dumps(body),content_type="application/json",HTTP_AUTHORIZATION="Bearer "+token)
    return view(request,**kwargs)


print("資料庫：%s"%DB)
if DB!="pokertrace_test":
    print("只跑測試庫，停止。")
    sys.exit(2)

# ---- 找一個「別人看得到的主辦場次」當素材 ----
visiblerow=query(DB,"""
    SELECT s."id",s."userid",s."clubid",s."name",c."name" AS clubname
    FROM "session" s JOIN "club" c ON c."id"=s."clubid" AND c."deletetime" IS NULL
    WHERE s."deletetime" IS NULL AND s."owned"=true AND s."linkuser"=true AND COALESCE(s."private",false)=false
    ORDER BY s."id"
""",[],S) or []
print("")
print("公開的主辦場次：%d 場"%len(visiblerow))
for item in visiblerow:
    print("  session %-5s 主辦 userid=%-4s clubid=%-4s %s"%(item["id"],item["userid"],item["clubid"],item["name"][:40]))
if not visiblerow:
    print("測試庫沒有任何公開主辦場次，無法測。")
    sys.exit(2)

ORGANIZERID=visiblerow[0]["userid"]
CLUBID=visiblerow[0]["clubid"]
organizersessionidlist=[]
organizerclubidlist=[]
for item in visiblerow:
    if item["userid"]==ORGANIZERID:
        organizersessionidlist.append(item["id"])
        if item["clubid"] not in organizerclubidlist:
            organizerclubidlist.append(item["clubid"])

viewerrow=query(DB,"""SELECT "id","name" FROM "user" WHERE "deletetime" IS NULL AND "id"<>%s ORDER BY "id" LIMIT 1""",[ORGANIZERID],S)
VIEWERID=viewerrow[0]["id"]
print("")
print("主辦者 userid=%s（%d 場公開、%d 個地點）；檢視者 userid=%s（%s）"%(ORGANIZERID,len(organizersessionidlist),len(organizerclubidlist),VIEWERID,viewerrow[0]["name"]))

query(DB,"""DELETE FROM "token" WHERE "token"=%s""",[TEMPTOKEN],S)
tokenid=queryinsert(DB,"token",{"userid": VIEWERID,"token": TEMPTOKEN,"createtime": nowtime()},S)
query(DB,"""DELETE FROM "userfollow" WHERE "userid"=%s""",[VIEWERID],S)

print("")
print("=== 1. getfollowtargetlist 應該看得到這位主辦者 ===")
response=callget(followapi.getfollowtargetlist,TEMPTOKEN)
targetlist=response.data["data"]["followtargetlist"]
found=None
for item in targetlist:
    if item["followuserid"]==ORGANIZERID:
        found=item
check("回應成功",response.data["success"],True)
check("清單裡有這位主辦者",found is not None,True)
if found:
    check("地點數",len(found["clublist"]),len(organizerclubidlist))
    check("目前未追隨",found["followed"],False)
check("清單裡不含自己",len([x for x in targetlist if x["followuserid"]==VIEWERID]),0)

print("")
print("=== 2. 不能追隨自己 ===")
response=callbody(followapi.newfollow,TEMPTOKEN,"post",{"followuserid": str(VIEWERID),"allclubed": True})
check("錯誤碼",response.data["data"],"ERROR_cannot_follow_self")

print("")
print("=== 3. 追不到看不見的主辦者 ===")
response=callbody(followapi.newfollow,TEMPTOKEN,"post",{"followuserid": "99999999","allclubed": True})
check("錯誤碼",response.data["data"],"ERROR_follow_target_not_found")

print("")
print("=== 4. 追隨全部地點 ===")
response=callbody(followapi.newfollow,TEMPTOKEN,"post",{"followuserid": str(ORGANIZERID),"allclubed": True,"notifyed": True})
check("回應成功",response.data["success"],True)
row=query(DB,"""SELECT "clubid" FROM "userfollow" WHERE "userid"=%s AND "deletetime" IS NULL""",[VIEWERID],S) or []
check("userfollow 只有一列",len(row),1)
check("clubid 是 NULL",row[0]["clubid"] is None,True)

print("")
print("=== 5. 重送同一筆不會變兩列（冪等）===")
callbody(followapi.newfollow,TEMPTOKEN,"post",{"followuserid": str(ORGANIZERID),"allclubed": True,"notifyed": True})
callbody(followapi.newfollow,TEMPTOKEN,"post",{"followuserid": str(ORGANIZERID),"allclubed": True,"notifyed": True})
row=query(DB,"""SELECT "id" FROM "userfollow" WHERE "userid"=%s AND "deletetime" IS NULL""",[VIEWERID],S) or []
check("連送三次仍只有一列",len(row),1)

print("")
print("=== 6. 場次列表 quickfilter=followed ===")
# 比相異場次：測試庫有 59 列孤兒 sessiontimerplayer（testbot 跑完留下的，
# sessionplayerid 指到已硬刪的 sessionplayer），會讓列表的 tp LEFT JOIN 把
# session 95 乘成 9 列。那是**既有的測試資料問題**，不帶任何篩選也一樣會重複，
# 正式機 0 列孤兒。所以這裡比相異場次，不比列數。
request=FACTORY.get("/?quickfilter=followed&limit=200",HTTP_AUTHORIZATION="Bearer "+TEMPTOKEN)
response=sessionapi.getsessionlist(request)
sessionidlist=[]
for item in response.data["data"]["sessions"]:
    if item["id"] not in sessionidlist:
        sessionidlist.append(item["id"])
check("篩到的相異場次數",len(sessionidlist),len(organizersessionidlist))
check("篩到的都是這位主辦者的",sorted(sessionidlist)==sorted(organizersessionidlist),True)

print("")
print("=== 7. 改成只追一個地點 ===")
response=callbody(followapi.newfollow,TEMPTOKEN,"post",{"followuserid": str(ORGANIZERID),"allclubed": False,"clubidlist": [CLUBID],"notifyed": True})
check("回應成功",response.data["success"],True)
row=query(DB,"""SELECT "clubid" FROM "userfollow" WHERE "userid"=%s AND "deletetime" IS NULL""",[VIEWERID],S) or []
check("全地點那列已被收掉，只剩一列",len(row),1)
check("clubid 是指定的地點",row[0]["clubid"],CLUBID)
request=FACTORY.get("/?quickfilter=followed&limit=200",HTTP_AUTHORIZATION="Bearer "+TEMPTOKEN)
response=sessionapi.getsessionlist(request)
expectlist=[]
for item in visiblerow:
    if item["userid"]==ORGANIZERID and item["clubid"]==CLUBID:
        expectlist.append(item["id"])
gotlist=[]
for item in response.data["data"]["sessions"]:
    if item["id"] not in gotlist:
        gotlist.append(item["id"])
check("只剩該地點的場次",sorted(gotlist)==sorted(expectlist),True)

print("")
print("=== 8. 追隨一個看得到的主辦者、但指定他沒有的地點 ===")
response=callbody(followapi.newfollow,TEMPTOKEN,"post",{"followuserid": str(ORGANIZERID),"allclubed": False,"clubidlist": [99999]})
check("錯誤碼",response.data["data"],"ERROR_follow_target_not_found")

print("")
print("=== 9. 通知開關 ===")
response=callbody(followapi.editfollow,TEMPTOKEN,"put",{"notifyed": False},followuserid=str(ORGANIZERID))
check("回應成功",response.data["success"],True)
row=query(DB,"""SELECT "notifyed" FROM "userfollow" WHERE "userid"=%s AND "deletetime" IS NULL""",[VIEWERID],S) or []
check("notifyed 已關",row[0]["notifyed"],False)
response=callbody(followapi.editfollow,TEMPTOKEN,"put",{"notifyed": "0"},followuserid=str(ORGANIZERID))
row=query(DB,"""SELECT "notifyed" FROM "userfollow" WHERE "userid"=%s AND "deletetime" IS NULL""",[VIEWERID],S) or []
check("字串 \"0\" 也要判成關（不可用 Python bool()）",row[0]["notifyed"],False)
request=FACTORY.get("/?quickfilter=followed&limit=200",HTTP_AUTHORIZATION="Bearer "+TEMPTOKEN)
response=sessionapi.getsessionlist(request)
check("關掉通知不影響篩選",0<len(response.data["data"]["sessions"]),True)

print("")
print("=== 10. 新場次通知（notifyed=false 時不發）===")
before=query(DB,"""SELECT COUNT(*) AS c FROM "notification" WHERE "userid"=%s AND "type"='sessionnew'""",[VIEWERID],S)[0]["c"]
fakerow={"id": 999999001,"userid": ORGANIZERID,"clubid": CLUBID,"name": "追隨通知測試","owned": True,"linkuser": True,"private": False}
sent=followapi.notifyfollowernewsession(fakerow)
check("關掉通知時發出 0 則",sent,0)

print("")
print("=== 11. 新場次通知（notifyed=true 時要發）===")
callbody(followapi.editfollow,TEMPTOKEN,"put",{"notifyed": True},followuserid=str(ORGANIZERID))
sent=followapi.notifyfollowernewsession(fakerow)
check("發出 1 則",sent,1)
after=query(DB,"""SELECT COUNT(*) AS c FROM "notification" WHERE "userid"=%s AND "type"='sessionnew'""",[VIEWERID],S)[0]["c"]
check("通知列 +1",after-before,1)
sent=followapi.notifyfollowernewsession(fakerow)
check("同一個 sessionid 再發一次會被去重擋掉",sent,0)

print("")
print("=== 12. 場次不公開時不發通知 ===")
for key,value,title in [("private",True,"private 場次"),("linkuser",False,"沒開使用者連結"),("owned",False,"個人紀錄非主辦")]:
    otherrow=dict(fakerow)
    otherrow["id"]=999999002
    otherrow[key]=value
    check(title+"不發",followapi.notifyfollowernewsession(otherrow),0)

print("")
print("=== 13. getfollowlist ===")
response=callget(followapi.getfollowlist,TEMPTOKEN)
followlist=response.data["data"]["followlist"]
check("一位主辦者一筆",len(followlist),1)
check("allclubed 為假",followlist[0]["allclubed"],False)
check("followclubidlist 有值",followlist[0]["followclubidlist"],[CLUBID])
check("回應不含主辦者姓名","followusername" not in followlist[0],True)

print("")
print("=== 14. 取消追隨 ===")
response=callbody(followapi.deletefollow,TEMPTOKEN,"delete",{},followuserid=str(ORGANIZERID))
check("回應成功",response.data["success"],True)
row=query(DB,"""SELECT "id" FROM "userfollow" WHERE "userid"=%s AND "deletetime" IS NULL""",[VIEWERID],S) or []
check("沒有有效列了",len(row),0)
response=callbody(followapi.deletefollow,TEMPTOKEN,"delete",{},followuserid=str(ORGANIZERID))
check("再取消一次回查無",response.data["data"],"ERROR_follow_not_found")
request=FACTORY.get("/?quickfilter=followed&limit=200",HTTP_AUTHORIZATION="Bearer "+TEMPTOKEN)
response=sessionapi.getsessionlist(request)
check("篩選變成空的",len(response.data["data"]["sessions"]),0)

# ---- 收尾 ----
query(DB,"""DELETE FROM "userfollow" WHERE "userid"=%s""",[VIEWERID],S)
query(DB,"""DELETE FROM "notification" WHERE "sessionid"=999999001""",[],S)
query(DB,"""DELETE FROM "token" WHERE "id"=%s""",[tokenid],S)

print("")
if failed:
    print("有 %d 項不符。"%failed)
else:
    print("全部通過。")
sys.exit(1 if failed else 0)
