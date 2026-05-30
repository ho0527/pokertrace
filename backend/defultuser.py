# defultuser.py
# ===========================================================================
# 產生 PokerTrace 測試用使用者
#
# 規則:
#     1. playerid 0 開頭皆為測試使用者
#     2. 01XXXXXX 是 player
#     3. 03XXXXXX 是 dealer
#     4. 05XXXXXX 是 floor
#     5. 07XXXXXX 是 assistant
#     6. email 為 {你的電子郵件}}+prokertrace{playerid}@gmail.com
#     7. name 為 TU{type}_{id}
#     8. avatarurl 為 ../material/image/default.png
#
# 執行:
#     python backend\defultuser.py
#
# 這支程式可重複執行。若 playerid 已存在就更新測試資料，否則新增。
# 同時會建立固定 API token: testtoken{playerid}
# ===========================================================================

import psycopg2
import sys

DBNAME="// 輸入你的資料庫名稱"
DBHOST="localhost"
DBUSER="// 輸入你的資料庫使用者名稱"
DBPASSWORD="// 輸入你的資料庫使用者密碼"
DBPORT=5432

AVATARURL="../material/image/default.png"
EMAILPREFIX="// 輸入你的電子郵件"
EMAILDOMAIN="@gmail.com"

TESTUSERS=[
	{
		"type": "player",
		"prefix": "01",
		"count": 30,
		"permission": 1
	},
	{
		"type": "dealer",
		"prefix": "03",
		"count": 10,
		"permission": 1
	},
	{
		"type": "floor",
		"prefix": "05",
		"count": 10,
		"permission": 1
	},
	{
		"type": "assistant",
		"prefix": "07",
		"count": 10,
		"permission": 1
	}
]


def buildusers():
	users=[]
	for group in TESTUSERS:
		for index in range(1,group["count"]+1):
			idtext=str(index).zfill(6)
			playerid=group["prefix"]+idtext
			users.append({
				"uid": "test-"+group["type"]+"-"+playerid,
				"email": EMAILPREFIX+playerid+EMAILDOMAIN,
				"name": "TU"+group["type"]+"_"+idtext,
				"avatarurl": AVATARURL,
				"permission": group["permission"],
				"verifytoken": "0",
				"playerid": playerid,
				"type": group["type"],
				"token": "testtoken"+playerid
			})
	return users


def saveuser(cursor,user):
	cursor.execute(
		"""SELECT "id" FROM public."user" WHERE "playerid"=%s""",
		[user["playerid"]]
	)
	row=cursor.fetchone()
	if row:
		cursor.execute(
			"""
			UPDATE public."user"
			SET "uid"=%s,
				"email"=%s,
				"name"=%s,
				"avatarurl"=%s,
				"permission"=%s,
				"verifytoken"=%s,
				"type"=%s,
				"verified"=true,
				"deletetime"=NULL,
				"updatetime"=NOW()
			WHERE "id"=%s
			""",
			[
				user["uid"],
				user["email"],
				user["name"],
				user["avatarurl"],
				user["permission"],
				user["verifytoken"],
				user["type"],
				row[0]
			]
		)
		return row[0],"updated"

	cursor.execute(
		"""
		INSERT INTO public."user"
			("token","uid","email","name","avatarurl","permission","verifytoken","createtime","updatetime","playerid","type","verified")
		VALUES
			(gen_random_uuid(),%s,%s,%s,%s,%s,%s,NOW(),NOW(),%s,%s,true)
		RETURNING "id"
		""",
		[
			user["uid"],
			user["email"],
			user["name"],
			user["avatarurl"],
			user["permission"],
			user["verifytoken"],
			user["playerid"],
			user["type"]
		]
	)
	row=cursor.fetchone()
	return row[0],"inserted"


def savetoken(cursor,userid,user):
	cursor.execute(
		"""SELECT "id" FROM public."token" WHERE "token"=%s""",
		[user["token"]]
	)
	row=cursor.fetchone()
	if row:
		cursor.execute(
			"""UPDATE public."token" SET "userid"=%s WHERE "id"=%s""",
			[userid,row[0]]
		)
		return "updated"

	cursor.execute(
		"""INSERT INTO public."token"("userid","token","createtime")VALUES(%s,%s,NOW())""",
		[userid,user["token"]]
	)
	return "inserted"


def main():
	try:
		db=psycopg2.connect(
			host=DBHOST,
			dbname=DBNAME,
			user=DBUSER,
			password=DBPASSWORD,
			port=DBPORT
		)
	except Exception as error:
		print("[defultuser] 無法連線資料庫: "+str(error))
		sys.exit(1)

	cursor=db.cursor()
	users=buildusers()
	inserted=0
	updated=0
	tokeninserted=0
	tokenupdated=0

	try:
		for user in users:
			userid,status=saveuser(cursor,user)
			tokenstatus=savetoken(cursor,userid,user)
			if status=="inserted":
				inserted=inserted+1
			else:
				updated=updated+1
			if tokenstatus=="inserted":
				tokeninserted=tokeninserted+1
			else:
				tokenupdated=tokenupdated+1
		db.commit()
	except Exception as error:
		db.rollback()
		cursor.close()
		db.close()
		print("[defultuser] 測試使用者產生失敗: "+str(error))
		sys.exit(1)

	cursor.close()
	db.close()
	print("[defultuser] 測試使用者完成")
	print("[defultuser] user inserted: "+str(inserted)+", updated: "+str(updated))
	print("[defultuser] token inserted: "+str(tokeninserted)+", updated: "+str(tokenupdated))
	print("[defultuser] 範例 token: testtoken01000001")


if __name__=="__main__":
	main()
