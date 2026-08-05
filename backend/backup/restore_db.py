"""
PokerTrace 資料庫還原 / 還原演練腳本（對應檢查表 2.3.2、2.3.3）

從 backup_db.py 產生的 .dump 檔，用 pg_restore 還原到指定資料庫。
預設還原到「演練資料庫」（PT_RESTORE_DB，預設 pokertrace_restoretest），
避免不小心覆寫正式資料；確認流程沒問題後，才用 --target 指定正式庫。

用法：
    # 列出可用備份
    python restore_db.py --list

    # 還原最新一份到演練庫（會先 DROP 再 CREATE 該演練庫）
    python restore_db.py --latest

    # 還原指定檔到演練庫
    python restore_db.py --file dumps/pokertrace_20260628_030000.dump

    # 還原到指定資料庫（危險：請確認）
    python restore_db.py --latest --target pokertrace --yes

連線資訊與 backup_db.py 相同（環境變數優先）：
    PT_DB_HOST / PT_DB_PORT / PT_DB_USER / PT_DB_PASSWORD
    PT_RESTORE_DB（演練目標庫名，預設 pokertrace_restoretest）
    PT_PG_BIN（PostgreSQL bin 目錄，找不到 pg_restore/psql 時設定）
"""

import os
import sys
import glob
import argparse
import subprocess


def env(name, default):
    value = os.environ.get(name)
    if value is None or value == "":
        return default
    return value


DB_HOST = env("PT_DB_HOST", "localhost")
DB_PORT = env("PT_DB_PORT", "5432")
DB_USER = env("PT_DB_USER", "chris0527")
DB_PASSWORD = env("PT_DB_PASSWORD", "")
SOURCE_DB = env("PT_DB_NAME", "pokertrace_test")
RESTORE_DB = env("PT_RESTORE_DB", "pokertrace_restoretest")
PG_BIN = env("PT_PG_BIN", "")

THIS_DIR = os.path.dirname(os.path.abspath(__file__))
BACKUP_DIR = env("PT_BACKUP_DIR", os.path.join(THIS_DIR, "dumps"))


def pgtool(name):
    if PG_BIN:
        return os.path.join(PG_BIN, name)
    return name


def environ_with_password():
    e = os.environ.copy()
    e["PGPASSWORD"] = DB_PASSWORD
    return e


def list_dumps():
    files = sorted(glob.glob(os.path.join(BACKUP_DIR, SOURCE_DB + "_*.dump")))
    return files


def latest_dump():
    files = list_dumps()
    if not files:
        return None
    return files[-1]


def psql_postgres(sql):
    # 連到 postgres 維護庫執行 DROP/CREATE DATABASE
    cmd = [pgtool("psql"), "-h", DB_HOST, "-p", str(DB_PORT), "-U", DB_USER,
           "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-c", sql]
    return subprocess.run(cmd, env=environ_with_password()).returncode


def recreate_database(dbname):
    print("[restore] 重建資料庫 " + dbname)
    rc = psql_postgres('DROP DATABASE IF EXISTS "' + dbname + '";')
    if rc != 0:
        return rc
    return psql_postgres('CREATE DATABASE "' + dbname + '";')


def restore(dumpfile, target):
    if not os.path.isfile(dumpfile):
        print("[restore] 找不到備份檔：" + dumpfile)
        return 1
    rc = recreate_database(target)
    if rc != 0:
        print("[restore] 建立目標資料庫失敗")
        return rc
    cmd = [pgtool("pg_restore"), "-h", DB_HOST, "-p", str(DB_PORT), "-U", DB_USER,
           "-d", target, "--no-owner", dumpfile]
    print("[restore] 還原 " + dumpfile + " -> " + target)
    rc = subprocess.run(cmd, env=environ_with_password()).returncode
    # pg_restore 對少數物件（如不存在的 owner/extension）可能回非 0，但資料多半已還原；故僅警告
    if rc != 0:
        print("[restore] pg_restore 回傳碼 " + str(rc) + "（部分物件可能略過，請檢查下方驗證結果）")
    tablecount = verify(target)
    # 驗證不能只是印數字：還原出 0 張表（或驗證本身失敗）就是失敗，exit code 要讓排程器/CI 看得到
    if tablecount < 1:
        print("[restore] 驗證失敗：" + target + " 沒有任何資料表，視為還原失敗")
        return 1
    return 0


def verify(target):
    # 還原驗證：回傳資料表數量，做為 2.3.3「實際還原一次並驗證」的最小證據
    sql = "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';"
    cmd = [pgtool("psql"), "-h", DB_HOST, "-p", str(DB_PORT), "-U", DB_USER,
           "-d", target, "-t", "-A", "-c", sql]
    out = subprocess.run(cmd, env=environ_with_password(), capture_output=True, text=True)
    if out.returncode != 0:
        print("[restore] 驗證失敗：無法連線目標庫 " + target)
        return -1
    count = (out.stdout or "").strip()
    print("[restore] 驗證：" + target + " public schema 共有 " + str(count) + " 張資料表")
    try:
        return int(count)
    except ValueError:
        return -1


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--list", action="store_true", help="列出可用備份檔")
    parser.add_argument("--latest", action="store_true", help="使用最新一份備份")
    parser.add_argument("--file", help="指定備份檔路徑")
    parser.add_argument("--target", default=RESTORE_DB, help="還原目標資料庫（預設為演練庫）")
    parser.add_argument("--yes", action="store_true", help="還原到非演練庫時的確認旗標")
    args = parser.parse_args()

    if args.list:
        files = list_dumps()
        if not files:
            print("（沒有備份檔，先執行 backup_db.py）")
        for f in files:
            print(f)
        return

    dumpfile = None
    if args.file:
        dumpfile = args.file
        if not os.path.isabs(dumpfile):
            dumpfile = os.path.join(THIS_DIR, dumpfile)
    elif args.latest:
        dumpfile = latest_dump()

    if not dumpfile:
        print("請指定 --latest 或 --file <路徑>（或用 --list 查看）")
        sys.exit(2)

    if args.target == SOURCE_DB and not args.yes:
        print("[restore] 目標是正式庫 " + SOURCE_DB + "，這會覆寫正式資料。確認無誤請加 --yes。")
        sys.exit(3)

    rc = restore(dumpfile, args.target)
    sys.exit(rc)


if __name__ == "__main__":
    main()
