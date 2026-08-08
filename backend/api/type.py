# import
import bcrypt
import hashlib
import json
import random
import re
# import google.oauth2.id_token
from django.http import HttpResponse,HttpResponseRedirect,JsonResponse
from django.views.decorators.http import require_http_methods
from rest_framework import status
from rest_framework.decorators import api_view,renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
# from google.oauth2 import id_token
# from google.auth.transport import requests

# 自創
from function.validation import *
from function.sql import *
from function.thing import *
from function.function import *
from .initialize import *
from .authhelper import gettokenuser as commonauthuser

# main START
#
# 這個檔案原本還有 gettype / newtype / edittype / deletetype 四支端點，
# 它們操作一張叫 "type" 的資料表。**那張表不存在，而且從來沒有存在過**
# （git 歷史裡 dbinitialize.py 沒有任何 CREATE TABLE type）。
# 因為 function/sql.py 的 query() 吞掉例外回 None，那四支的失敗一直被
# 當成「查不到」回 404，看起來像正常的找不到資料。
#
# 2026-08-06（TASK-104）查清方向後移除，備份 type_old_t1.py：
# 把 newtype 的 INSERT 欄位（token / userid / gametype / name / clubid / buyin /
# rebuycount / rebuybuyin / winprice / chip / winthing / starttime / endtime /
# description / place / totalbuyin）拿去比 session 表 —— **16 個全部都在**。
# 也就是 "type" 就是後來的 "session"，那四支是 session.py 的前身殘骸。
# 依 AGENTS.md 的慣例：沒被使用的殘渣該刪，不該接回去。
#
# **留下來的 gettypelist 是好的**，它讀的是 gametype / limittype / stacktype /
# eventtype 四張真實存在的表，與 "type" 無關，batchcreate / newedithand /
# newsession / session / sessionlist 五個頁面都在用。
@api_view(["GET"])
def gettypelist(request):
	tokenuserrow,autherror=commonauthuser(request)
	if autherror:
		return autherror

	gametyperow=query(SETTING["dbname"],f"""SELECT*FROM "gametype" WHERE "deletetime" IS NULL ORDER BY "id" ASC""",[],SETTING["dbsetting"])
	limittyperow=query(SETTING["dbname"],f"""SELECT*FROM "limittype" WHERE "deletetime" IS NULL ORDER BY "id" ASC""",[],SETTING["dbsetting"])
	stacktyperow=query(SETTING["dbname"],f"""SELECT*FROM "stacktype" WHERE "deletetime" IS NULL ORDER BY "id" ASC""",[],SETTING["dbsetting"])
	eventtyperow=query(SETTING["dbname"],f"""SELECT*FROM "eventtype" WHERE "deletetime" IS NULL ORDER BY "id" ASC""",[],SETTING["dbsetting"])

	return Response({
		"success": True,
		"data": {
			"game": gametyperow,
			"limit": limittyperow,
			"stack": stacktyperow,
			"event": eventtyperow
		}
	},status.HTTP_200_OK)
