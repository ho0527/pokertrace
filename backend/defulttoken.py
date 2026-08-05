# defulttoken.py
# ===========================================================================
# 重新產生預設(測試)使用者的 API token
#
# 規則:
#     1. playerid 0 開頭皆為預設(測試)使用者（defultuser.py 產生）
#     2. 先刪除這些使用者在 token 資料表的所有舊 token
#     3. 再為每位使用者產生一組新的隨機 token，格式與登入相同（35 碼英數亂碼）
#     4. 結果會列在終端機，並寫入 backend/localtoken.md（已被 .gitignore 忽略）
#
# 執行:
#     python backend\defulttoken.py
#
# 這支程式可重複執行。每次執行都會把預設使用者的 token 全部換新，
# 舊 token 會立即失效。
# ===========================================================================

import os
import psycopg2
import random
import sys

DBNAME="pokertrace_test"
DBHOST="localhost"
DBUSER="chris0527"
DBPASSWORD=os.environ.get("PT_DB_PASSWORD","")
DBPORT=5432

TOKENTEXT="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
TOKENLENGTH=35
TOKENFILE=os.path.join(os.path.dirname(os.path.abspath(__file__)),"localtoken.md")


def randomtoken():
	token=""
	for index in range(TOKENLENGTH):
		token=token+TOKENTEXT[random.randint(0,len(TOKENTEXT)-1)]
	return token


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
		print("[defulttoken] 無法連線資料庫: "+str(error))
		sys.exit(1)

	cursor=db.cursor()

	try:
		cursor.execute(
			"""
			SELECT "id","playerid","name","type"
			FROM public."user"
			WHERE "playerid" LIKE '0%%' AND "deletetime" IS NULL
			ORDER BY "playerid"
			"""
		)
		userlist=cursor.fetchall()

		if not userlist:
			cursor.close()
			db.close()
			print("[defulttoken] 找不到預設使用者(playerid 0 開頭)，請先執行 defultuser.py")
			sys.exit(1)

		useridlist=[row[0] for row in userlist]
		cursor.execute(
			"""DELETE FROM public."token" WHERE "userid"=ANY(%s)""",
			[useridlist]
		)
		deleted=cursor.rowcount

		resultlist=[]
		for row in userlist:
			token=randomtoken()
			cursor.execute(
				"""INSERT INTO public."token"("userid","token","createtime")VALUES(%s,%s,NOW())""",
				[row[0],token]
			)
			resultlist.append({
				"playerid": row[1],
				"name": row[2],
				"type": row[3],
				"token": token
			})
		db.commit()
	except Exception as error:
		db.rollback()
		cursor.close()
		db.close()
		print("[defulttoken] 重新產生 token 失敗: "+str(error))
		sys.exit(1)

	cursor.close()
	db.close()

	lines=[]
	lines.append("# localtoken.md")
	lines.append("")
	lines.append("本機測試用 token（機密、用完即刪，已被 .gitignore 忽略）。")
	lines.append("由 defulttoken.py 產生，重新執行會全部換新。")
	lines.append("")
	lines.append("| playerid | name | type | token |")
	lines.append("| --- | --- | --- | --- |")
	for result in resultlist:
		lines.append("| "+result["playerid"]+" | "+result["name"]+" | "+result["type"]+" | "+result["token"]+" |")
	with open(TOKENFILE,"w",encoding="utf-8") as file:
		file.write("\n".join(lines)+"\n")

	print("[defulttoken] 預設使用者 token 重新產生完成")
	print("[defulttoken] 舊 token 刪除: "+str(deleted)+" 筆")
	print("[defulttoken] 新 token 產生: "+str(len(resultlist))+" 筆")
	print("[defulttoken] 清單已寫入: "+TOKENFILE)
	print("")
	print("playerid".ljust(10)+"name".ljust(14)+"type".ljust(11)+"token")
	print("-"*70)
	for result in resultlist:
		print(result["playerid"].ljust(10)+result["name"].ljust(14)+result["type"].ljust(11)+result["token"])


if __name__=="__main__":
	main()
