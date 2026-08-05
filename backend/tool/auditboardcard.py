# -*- coding: utf-8 -*-
"""
TASK-034：hand.boardcard 資料健檢（唯讀）。

為什麼要先做這個：hand.boardcard 是自由格式的字串欄位（varchar，沒有 schema 約束），
實際資料裡有幾種形態沒有人知道。TASK-036 的回填腳本要把它拆進正規化表，
如果不先知道有幾種格式，回填一定會漏。

**本腳本只跑 SELECT，不做任何 INSERT / UPDATE / DELETE / DDL。**

用法（在專案根目錄）：

    call localenv.cmd
    python backend\\tool\\auditboardcard.py

輸出會直接印在終端機，也會寫成 markdown 到：
    ai/artifacts/手牌紀錄完整度/dataaudit-boardcard.md

把那份檔案交回來，TASK-036 的回填腳本才有辦法涵蓋每一種格式。
"""

import os
import sys
import json
import collections

HERE=os.path.dirname(os.path.abspath(__file__))
BACKEND=os.path.dirname(HERE)
ROOT=os.path.dirname(BACKEND)
sys.path.insert(0,BACKEND)

from function.sql import query
from api.initialize import SETTING

DBNAME=SETTING["dbname"]
DBSETTING=SETTING["dbsetting"]

SAMPLELIMIT=3


def rows(sql,args=None):
    return query(DBNAME,sql,args or [],DBSETTING)


def scalar(sql,args=None):
    result=rows(sql,args)
    if not result:
        return 0
    return list(result[0].values())[0]


def parseboard(raw):
    """回傳 (形態標籤, 解析後的物件或 None)。形態標籤就是這份報告的分類依據。"""
    if raw is None:
        return "NULL",None
    text=str(raw).strip()
    if text=="":
        return "空字串",None
    try:
        data=json.loads(text)
    except Exception:
        return "非法 JSON",None
    if isinstance(data,list):
        return "陣列（已是多 board？）",data
    if not isinstance(data,dict):
        return "JSON 但不是物件也不是陣列（%s）"%type(data).__name__,data
    keys=sorted([k for k in data.keys()])
    return "物件 keys=%s"%(",".join(keys) or "(空物件)"),data


def cardshape(value):
    if value is None:
        return "None"
    if isinstance(value,list):
        return "陣列(%d)"%len(value)
    if isinstance(value,str):
        if value.strip()=="":
            return "空字串"
        for sep in [",","/"," ","-"]:
            if sep in value:
                return "字串(以 %s 分隔, %d 段)"%(repr(sep),len(value.split(sep)))
        return "字串(單一, 長度 %d)"%len(value)
    return type(value).__name__


def main():
    out=[]

    def emit(line=""):
        print(line)
        out.append(line)

    emit("# hand.boardcard 資料健檢（TASK-034）")
    emit()
    emit("本報告由 `backend/tool/auditboardcard.py` 產生，**只跑 SELECT**。")
    emit()

    total=scalar("""SELECT COUNT(*) AS n FROM "hand" """)
    alive=scalar("""SELECT COUNT(*) AS n FROM "hand" WHERE "deletetime" IS NULL""")
    emit("## 總量")
    emit()
    emit("| 項目 | 筆數 |")
    emit("| --- | ---: |")
    emit("| hand 總列數 | %d |"%total)
    emit("| 未刪除 | %d |"%alive)
    emit("| 已軟刪除 | %d |"%(total-alive))
    emit()

    emit("## boardcard 欄位的空值分布")
    emit()
    nullcount=scalar("""SELECT COUNT(*) AS n FROM "hand" WHERE "deletetime" IS NULL AND "boardcard" IS NULL""")
    emptycount=scalar("""SELECT COUNT(*) AS n FROM "hand" WHERE "deletetime" IS NULL AND "boardcard" IS NOT NULL AND btrim("boardcard")=''""")
    emit("| 狀態 | 筆數 |")
    emit("| --- | ---: |")
    emit("| NULL | %d |"%nullcount)
    emit("| 空字串 | %d |"%emptycount)
    emit("| 有內容 | %d |"%(alive-nullcount-emptycount))
    emit()

    emit("## boardcard 的格式分類")
    emit()
    data=rows("""SELECT "id","gametype","boardcard","totalpot" FROM "hand" WHERE "deletetime" IS NULL""")
    shapes=collections.Counter()
    samples=collections.defaultdict(list)
    fieldshapes=collections.defaultdict(collections.Counter)
    badjson=[]
    for row in data:
        label,parsed=parseboard(row["boardcard"])
        shapes[label]=shapes[label]+1
        if len(samples[label])<SAMPLELIMIT:
            samples[label].append((row["id"],row["boardcard"]))
        if label=="非法 JSON":
            badjson.append(row["id"])
        if isinstance(parsed,dict):
            for key in parsed:
                fieldshapes[key][cardshape(parsed[key])]+=1

    emit("| 形態 | 筆數 |")
    emit("| --- | ---: |")
    for label,count in shapes.most_common():
        emit("| %s | %d |"%(label,count))
    emit()

    emit("### 每種形態的實際範例")
    emit()
    for label,count in shapes.most_common():
        emit("**%s**（%d 筆）"%(label,count))
        emit()
        for handid,raw in samples[label]:
            emit("    hand.id=%s  %s"%(handid,repr(raw)[:200]))
        emit()

    emit("## 各 key 的值形態")
    emit()
    emit("回填腳本要能處理下面每一種形態。")
    emit()
    emit("| key | 值的形態 | 筆數 |")
    emit("| --- | --- | ---: |")
    for key in sorted(fieldshapes.keys()):
        for shape,count in fieldshapes[key].most_common():
            emit("| %s | %s | %d |"%(key,shape,count))
    emit()

    emit("## totalpot 的空值")
    emit()
    potnull=scalar("""SELECT COUNT(*) AS n FROM "hand" WHERE "deletetime" IS NULL AND "totalpot" IS NULL""")
    potzero=scalar("""SELECT COUNT(*) AS n FROM "hand" WHERE "deletetime" IS NULL AND "totalpot"=0""")
    emit("| 狀態 | 筆數 |")
    emit("| --- | ---: |")
    emit("| NULL | %d |"%potnull)
    emit("| 0 | %d |"%potzero)
    emit()

    emit("## 正規化表的現況")
    emit()
    emit("架構筆記說這三張表「完全沒有寫入路徑」，這裡實際確認一次。")
    emit()
    emit("| 表 | 列數 |")
    emit("| --- | ---: |")
    for table in ["communitycard","handpot","handpotallocation"]:
        try:
            emit("| %s | %d |"%(table,scalar("""SELECT COUNT(*) AS n FROM "%s" """%table)))
        except Exception as error:
            emit("| %s | 查詢失敗：%s |"%(table,error))
    emit()

    emit("## gametype 分布")
    emit()
    emit("多 board 主要影響 board 家族（holdem / omaha 等），這裡看實際比例。")
    emit()
    emit("| gametype | 筆數 |")
    emit("| --- | ---: |")
    for row in rows("""SELECT "gametype",COUNT(*) AS n FROM "hand" WHERE "deletetime" IS NULL GROUP BY "gametype" ORDER BY n DESC"""):
        emit("| %s | %s |"%(row["gametype"],row["n"]))
    emit()

    emit("## 需要注意的列")
    emit()
    if badjson:
        emit("**非法 JSON 的 hand.id**（回填時會直接失敗，必須先決定怎麼處理）：")
        emit()
        emit("    "+", ".join([str(x) for x in badjson[:50]]))
        if len(badjson)>50:
            emit("    …共 %d 筆"%len(badjson))
    else:
        emit("沒有非法 JSON。")
    emit()

    target=os.path.join(ROOT,"ai","artifacts","手牌紀錄完整度","dataaudit-boardcard.md")
    os.makedirs(os.path.dirname(target),exist_ok=True)
    with open(target,"w",encoding="utf-8") as handle:
        handle.write("\n".join(out)+"\n")
    print()
    print("報告已寫到：%s"%target)


if __name__=="__main__":
    main()
