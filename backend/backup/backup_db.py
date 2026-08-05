"""
PokerTrace 資料庫自動備份腳本（對應檢查表 2.3.1）

用 pg_dump 以自訂格式（-Fc）備份 PostgreSQL，輸出帶時間戳的 .dump 檔，
並依保留天數自動刪除過舊的備份。

連線資訊優先讀環境變數，讀不到才退回專案預設值（與 backend/api/initialize.py 一致）。
建議正式機改用環境變數，不要依賴預設值：
    PT_DB_HOST / PT_DB_PORT / PT_DB_NAME / PT_DB_USER / PT_DB_PASSWORD
備份目錄與保留天數：
    PT_BACKUP_DIR（預設：此檔同目錄下的 dumps/）
    PT_BACKUP_KEEP_DAYS（預設：14）

用法：
    python backup_db.py
需求：系統已安裝 PostgreSQL 用戶端工具（pg_dump 可在 PATH 中，或設 PT_PG_BIN 指向其資料夾）。
"""

import os
import sys
import time
import glob
import subprocess
from datetime import datetime


def env(name, default):
    value = os.environ.get(name)
    if value is None or value == "":
        return default
    return value


DB_HOST = env("PT_DB_HOST", "localhost")
DB_PORT = env("PT_DB_PORT", "5432")
DB_NAME = env("PT_DB_NAME", "pokertrace_test")
DB_USER = env("PT_DB_USER", "chris0527")
DB_PASSWORD = env("PT_DB_PASSWORD", "")

THIS_DIR = os.path.dirname(os.path.abspath(__file__))
BACKUP_DIR = env("PT_BACKUP_DIR", os.path.join(THIS_DIR, "dumps"))
KEEP_DAYS = int(env("PT_BACKUP_KEEP_DAYS", "14"))
PG_BIN = env("PT_PG_BIN", "")


def pgtool(name):
    # 允許用 PT_PG_BIN 指定 PostgreSQL bin 目錄（Windows 常見：C:\\Program Files\\PostgreSQL\\16\\bin）
    if PG_BIN:
        return os.path.join(PG_BIN, name)
    return name


def run_backup():
    if not os.path.isdir(BACKUP_DIR):
        os.makedirs(BACKUP_DIR)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    outfile = os.path.join(BACKUP_DIR, DB_NAME + "_" + stamp + ".dump")

    cmd = [
        pgtool("pg_dump"),
        "-h", DB_HOST,
        "-p", str(DB_PORT),
        "-U", DB_USER,
        "-d", DB_NAME,
        "-Fc",            # 自訂格式，可用 pg_restore 還原
        "-f", outfile,
    ]
    environ = os.environ.copy()
    environ["PGPASSWORD"] = DB_PASSWORD  # 不把密碼放進指令列，避免被行程清單看到

    print("[backup] 開始備份 " + DB_NAME + " -> " + outfile)
    result = subprocess.run(cmd, env=environ)
    if result.returncode != 0:
        print("[backup] 失敗，pg_dump 回傳碼 " + str(result.returncode))
        return None
    size = os.path.getsize(outfile)
    print("[backup] 完成（" + str(size) + " bytes）")
    return outfile


def prune_old():
    if KEEP_DAYS <= 0:
        return
    cutoff = time.time() - KEEP_DAYS * 86400
    removed = 0
    for path in glob.glob(os.path.join(BACKUP_DIR, DB_NAME + "_*.dump")):
        if os.path.getmtime(path) < cutoff:
            try:
                os.remove(path)
                removed = removed + 1
            except OSError as error:
                print("[backup] 無法刪除 " + path + "：" + str(error))
    if removed:
        print("[backup] 已清除 " + str(removed) + " 個超過 " + str(KEEP_DAYS) + " 天的舊備份")


def main():
    outfile = run_backup()
    if outfile is None:
        sys.exit(1)
    prune_old()
    print("[backup] 全部完成")


if __name__ == "__main__":
    main()
