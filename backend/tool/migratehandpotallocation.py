# -*- coding: utf-8 -*-
"""
TASK-035 前置：讓 handpotallocation 可以真的被寫入。

## 為什麼需要這個

handpotallocation.winnerplayerid 是 NOT NULL 且外鍵指向 public.player(id)。
實測（2026-07-29，測試機）：

    org 0 列 / player 0 列 / handcategory 0 列 / handplayercard 0 列
    playerstatdaily 0 列 / playerstatistic 0 列 / importsource 0 列
    pokertable 這張表在資料庫裡根本不存在

那是一套已經被放棄的第一代 schema（org -> player），而實際做出來的系統走的是
user -> sessionplayer。所以照原樣沒有任何一列插得進 handpotallocation。

## 改法

粒度對齊 handseating 與 handbittingdata —— 它們都是用 handid + seatno 當對象。
handpotallocation 透過 handpot 已經有 handid，這裡補上 seatno 就完全一致。

不用 sessionplayerid 當對象的原因：handseating.sessionplayerid 是 nullable，
前端的 felt 座位彈窗明確支援「臨時名字」（沒有帳號的現場選手）。目前測試資料剛好
0 筆為 null，但那是設計上允許的情況，拿它當外鍵會在第一個臨時選手出現時失敗。

winnerplayerid 欄位**保留不刪**（依專案規則不單邊移除既有欄位），只放寬成可為空、
並移除那個指向死表的外鍵約束。

## 安全性

三個動作全部作用在**空表**上，執行前會再確認一次列數；不是 0 就中止。
沒有任何既有資料會被影響。腳本可重複執行（IF NOT EXISTS / IF EXISTS）。

用法：

    cd backend
    call .\\localenv.cmd && python tool\\migratehandpotallocation.py
"""

import os
import sys

HERE=os.path.dirname(os.path.abspath(__file__))
BACKEND=os.path.dirname(HERE)
sys.path.insert(0,BACKEND)

from function.sql import query,querytransaction
from api.initialize import SETTING

DBNAME=SETTING["dbname"]
DBSETTING=SETTING["dbsetting"]


def columns():
    rows=query(DBNAME,"""
        SELECT column_name,is_nullable
        FROM information_schema.columns
        WHERE table_schema='public' AND table_name='handpotallocation'
        ORDER BY ordinal_position
    """,[],DBSETTING)
    return rows or []


def constraints():
    rows=query(DBNAME,"""
        SELECT conname
        FROM pg_constraint
        WHERE conrelid='public.handpotallocation'::regclass AND contype='f'
    """,[],DBSETTING)
    return [r["conname"] for r in (rows or [])]


def show(title):
    print(title)
    for row in columns():
        print("    %-20s nullable=%s"%(row["column_name"],row["is_nullable"]))
    print("    外鍵：%s"%(", ".join(constraints()) or "(無)"))
    print()


def main():
    print("=== 執行前確認 ===")
    result=query(DBNAME,"""SELECT COUNT(*) AS n FROM "handpotallocation" """,[],DBSETTING)
    rowcount=result[0]["n"] if result else None
    print("  handpotallocation 目前列數：%s"%rowcount)
    if rowcount!=0:
        print()
        print("  中止：這張表不是空的。本腳本只設計給空表使用，")
        print("        有資料時放寬 NOT NULL 與移除外鍵需要另外評估。")
        return 1
    print()

    show("=== 改動前的結構 ===")

    sqllist=[
        ["""ALTER TABLE "handpotallocation" ADD COLUMN IF NOT EXISTS "seatno" integer""",[]],
        ["""ALTER TABLE "handpotallocation" ALTER COLUMN "winnerplayerid" DROP NOT NULL""",[]],
        ['ALTER TABLE "handpotallocation" DROP CONSTRAINT IF EXISTS "handpotallocation_winnerplayerid_fkey"',[]],
    ]
    print("=== 即將執行 ===")
    for item in sqllist:
        print("  "+" ".join(item[0].split()))
    print()

    transactionresult=querytransaction(DBNAME,sqllist,DBSETTING)
    if transactionresult is None:
        print("執行失敗（交易已回退）")
        return 1

    print("=== 改動後的結構 ===")
    show("")
    print("完成。")
    return 0


if __name__=="__main__":
    sys.exit(main())
