# -*- coding: utf-8 -*-
"""
用 pg_dump 備份目前設定檔指向的資料庫（測試機 = pokertrace_test）。

密碼直接從環境變數傳給 pg_dump 的子行程，不經過 shell，避免密碼裡的
特殊字元（& ^ ! % 等）被 cmd 解析掉——實測用 set PGPASSWORD=%...% 會失敗。

備份檔放在版控之外（C:\\nginx\\dbbackup），避免二進位 dump 被誤加進 git。

用法：

    cd backend
    call .\\localenv.cmd && python tool\\dumpdatabase.py [輸出檔名]
"""

import os
import sys
import subprocess

# 2026-07-31：少了這一行的後果不是「中文變亂碼」，是**備份根本沒開始**——
# 第一個 print 就在 cp1252 主控台丟 UnicodeEncodeError，整支腳本結束、
# pg_dump 一次都沒被呼叫。而它是「改動前先備份」流程的第一步，
# 失敗在這裡最容易被當成「跑過了」。backend/ 下其他工具都有這一行。
sys.stdout.reconfigure(encoding="utf-8")

HERE=os.path.dirname(os.path.abspath(__file__))
BACKEND=os.path.dirname(HERE)
sys.path.insert(0,BACKEND)

from api.initialize import SETTING

PGDUMP=r"C:\Program Files\PostgreSQL\17\bin\pg_dump.exe"
BACKUPDIR=r"C:\nginx\dbbackup"


def main():
    dbname=SETTING["dbname"]
    setting=SETTING["dbsetting"]
    if not setting.get("password"):
        print("中止：環境變數 PT_DB_PASSWORD 沒有載入，請先 call .\\localenv.cmd")
        return 1

    name=sys.argv[1] if len(sys.argv)>1 else "%s.dump"%dbname
    if not os.path.isdir(BACKUPDIR):
        os.makedirs(BACKUPDIR)
    target=os.path.join(BACKUPDIR,name)

    print("資料庫  ：%s @ %s:%s"%(dbname,setting["host"],setting["port"]))
    print("輸出檔  ：%s"%target)
    print()

    env=dict(os.environ)
    env["PGPASSWORD"]=setting["password"]
    command=[PGDUMP,"-h",str(setting["host"]),"-p",str(setting["port"]),"-U",str(setting["username"]),"-Fc","-f",target,dbname]
    result=subprocess.run(command,env=env)
    if result.returncode!=0:
        print("pg_dump 失敗，離開碼 %s"%result.returncode)
        return result.returncode

    size=os.path.getsize(target)
    print("完成：%s bytes（%.1f MB）"%(size,size/1024.0/1024.0))
    return 0


if __name__=="__main__":
    sys.exit(main())
