import os

# 正式機（production）：DB=pokertrace、後端 8061、nginx 3061、網域 pokertrace.net
# 測試機在 C:\nginx\htdocs\website\externalcase\project00061（DB=pokertrace_test、8161、test.pokertrace.net）
BASERUL="https://pokertrace.net/frontend/"
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