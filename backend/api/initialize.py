import os

# ⚠ 這是**正式機專屬**設定檔。不要從測試機同步覆蓋它。
# 正式機（production）：DB=pokertrace、後端 8061、nginx 3061、網域 pokertrace.net
# 測試機在 C:/nginx/htdocs/website/externalcase/project00061
#（DB=pokertrace_test、後端 8161、nginx 3161、網域 test.pokertrace.net）
#
# 2026-07-29 17:15 這個檔被測試機的版本整份蓋掉，dbname 變成 pokertrace_test，
# 正式站因此有兩天讀的是測試庫（畫面只剩 5 筆場次、playerid 也換了一個號）。
# 資料沒有損失 —— 那段期間兩個庫都沒有新增列 —— 但下次同步再犯就未必這麼幸運。
BASERUL="https://pokertrace.net/frontend/"
# 排程器與時間顯示用的時區（TASK-053）。原本硬編在 schedulerjob.py 裡，
# 那是一個沒有被設定管理的隱含假設。改由環境變數覆寫，預設維持原值。
PTTIMEZONE=os.environ.get("PT_TIMEZONE","Asia/Taipei")

SETTING={
    "dbname": "pokertrace",
	"dbsetting": {
		"host": "localhost",
		"username": "chris0527",
		"password": os.environ.get("PT_DB_PASSWORD",""),
		"port": 5432,
		"sqltype": "pgsql"
	}
}
