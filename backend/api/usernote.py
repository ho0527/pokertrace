"""Only the authenticated author may read or write their account notes."""
import json
import re

from rest_framework.decorators import api_view
from rest_framework.response import Response

from function.sql import query,querytransaction
from function.thing import nowtime
from .initialize import SETTING
from .authhelper import gettokenuser as commonauthuser

MAXIMUMUSERNOTECOUNT=100
MAXIMUMUSERNOTELENGTH=1000
MAXIMUMUSERID=9223372036854775807


@api_view(["GET"])
def getmyusernotelist(request):
    user,autherror=commonauthuser(request)
    if autherror:
        autherror["Cache-Control"]="no-store"
        return autherror
    if set(request.GET)-{"page","limit","keyword"}:
        return usernoteresponse("ERROR_request_data_type_error",False,400)
    try:
        page=int(request.GET.get("page","1"))
        limit=int(request.GET.get("limit","20"))
    except (ValueError,TypeError):
        return usernoteresponse("ERROR_request_data_type_error",False,400)
    keyword=request.GET.get("keyword","").strip()
    if page<1 or page>1000000 or limit<1 or limit>100 or len(keyword)>200 or "\x00" in keyword:
        return usernoteresponse("ERROR_request_data_type_error",False,400)
    condition='n."userid"=%s AND u."deletetime" IS NULL'
    param=[user["id"]]
    if keyword:
        condition+=' AND (u."name" ILIKE %s OR u."playerid" ILIKE %s OR n."note" ILIKE %s)'
        param.extend(["%"+keyword+"%"]*3)
    count=query(SETTING["dbname"],'SELECT COUNT(*) AS total FROM "usernote" n JOIN "user" u ON u."id"=n."targetuserid" WHERE '+condition,param,SETTING["dbsetting"],errorredacted=True)
    row=query(SETTING["dbname"],'SELECT n."targetuserid",n."color",n."note",u."name",u."playerid" FROM "usernote" n JOIN "user" u ON u."id"=n."targetuserid" WHERE '+condition+' ORDER BY n."updatetime" DESC,n."id" DESC LIMIT %s OFFSET %s',param+[limit,(page-1)*limit],SETTING["dbsetting"],errorredacted=True)
    if count is None or row is None:
        return usernoteresponse("ERROR_database_error",False,500)
    return usernoteresponse({"notelist": row,"total": count[0]["total"],"page": page,"limit": limit})


def usernoteresponse(data,successed=True,statuscode=200):
    return Response({"success": successed,"data": data},status=statuscode,headers={"Cache-Control": "no-store"})


@api_view(["POST"])
def getusernotelist(request):
    user,autherror=commonauthuser(request)
    if autherror:
        autherror["Cache-Control"]="no-store"
        return autherror
    try:
        data=json.loads(request.body)
    except (ValueError,UnicodeDecodeError):
        return usernoteresponse("ERROR_request_data_type_error",False,400)
    if not isinstance(data,dict) or set(data)!={"targetuseridlist"}:
        return usernoteresponse("ERROR_request_data_type_error",False,400)
    targetlist=data["targetuseridlist"]
    if not isinstance(targetlist,list) or len(targetlist)>MAXIMUMUSERNOTECOUNT:
        return usernoteresponse("ERROR_request_data_type_error",False,400)
    for target in targetlist:
        if type(target)!=int or target<=0 or target>MAXIMUMUSERID:
            return usernoteresponse("ERROR_request_data_type_error",False,400)
    row=[]
    if targetlist:
        row=query(SETTING["dbname"],"""SELECT n."targetuserid",n."color",n."note"
            FROM "usernote" n JOIN "user" u ON u."id"=n."targetuserid" AND u."deletetime" IS NULL
            WHERE n."userid"=%s AND n."targetuserid"=ANY(%s) AND n."targetuserid"<>%s
            ORDER BY n."targetuserid"
            """,[user["id"],list(set(targetlist)),user["id"]],SETTING["dbsetting"],errorredacted=True)
    if row is None:
        return usernoteresponse("ERROR_database_error",False,500)
    response=usernoteresponse(row)
    response.data["userid"]=user["id"]
    return response


@api_view(["PUT"])
def editusernote(request,targetuserid):
    user,autherror=commonauthuser(request)
    if autherror:
        autherror["Cache-Control"]="no-store"
        return autherror
    if re.fullmatch(r"[1-9][0-9]{0,18}",str(targetuserid)) is None:
        return usernoteresponse("ERROR_request_data_type_error",False,400)
    targetuserid=int(targetuserid)
    if targetuserid>MAXIMUMUSERID or targetuserid==user["id"]:
        return usernoteresponse("ERROR_request_data_type_error",False,400)
    try:
        data=json.loads(request.body)
    except (ValueError,UnicodeDecodeError):
        return usernoteresponse("ERROR_request_data_type_error",False,400)
    if not isinstance(data,dict) or set(data)!={"color","note"}:
        return usernoteresponse("ERROR_request_data_type_error",False,400)
    color=data["color"]
    note=data["note"]
    if not isinstance(color,str) or not isinstance(note,str):
        return usernoteresponse("ERROR_request_data_type_error",False,400)
    if (color and re.fullmatch(r"#[0-9a-fA-F]{6}",color) is None) or len(note)>MAXIMUMUSERNOTELENGTH or "\x00" in note:
        return usernoteresponse("ERROR_request_data_type_error",False,400)
    try:
        note.encode("utf-8")
    except UnicodeEncodeError:
        return usernoteresponse("ERROR_request_data_type_error",False,400)
    color=color.lower()
    if not note.strip():
        note=""
    target=query(SETTING["dbname"],"""SELECT "id" FROM "user" WHERE "id"=%s AND "deletetime" IS NULL""",[targetuserid],SETTING["dbsetting"],errorredacted=True)
    if target is None:
        return usernoteresponse("ERROR_database_error",False,500)
    if not target:
        return usernoteresponse("ERROR_user_not_found",False,404)
    # Lock both accounts in a stable order so deletion and saving cannot leave an orphan note.
    transactionlist=[[
        """SELECT "id" FROM "user" WHERE "id" IN (%s,%s) AND "deletetime" IS NULL ORDER BY "id" FOR UPDATE""",
        [user["id"],targetuserid]
    ]]
    if color or note:
        timestamp=nowtime()
        transactionlist.append([
            """INSERT INTO "usernote"("userid","targetuserid","color","note","createtime","updatetime")
                SELECT a."id",b."id",%s,%s,%s,%s FROM "user" a JOIN "user" b ON b."id"=%s AND b."deletetime" IS NULL
                WHERE a."id"=%s AND a."deletetime" IS NULL
                ON CONFLICT ("userid","targetuserid") DO UPDATE SET "color"=EXCLUDED."color","note"=EXCLUDED."note","updatetime"=EXCLUDED."updatetime"
                """,
            [color,note,timestamp,timestamp,targetuserid,user["id"]]
        ])
    else:
        transactionlist.append([
            """DELETE FROM "usernote" WHERE "userid"=%s AND "targetuserid"=%s""",
            [user["id"],targetuserid]
        ])
    result=querytransaction(SETTING["dbname"],transactionlist,SETTING["dbsetting"],errorredacted=True)
    if result is None:
        return usernoteresponse("ERROR_database_error",False,500)
    if len(result[0])!=2:
        return usernoteresponse("ERROR_user_not_found",False,404)
    return usernoteresponse({"targetuserid": targetuserid,"color": color,"note": note})
