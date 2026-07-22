import datetime
import json
import threading
import MySQLdb
import mysql.connector as mysql
import psycopg2
from psycopg2 import pool as pgpool
from psycopg2.extras import RealDictCursor
from MySQLdb.cursors import DictCursor
from mysql.connector import Error
from django.http import JsonResponse

# 自創
from function.thing import *

# PostgreSQL 連線池：避免每次查詢都重新建立連線（握手成本）
# 以連線參數為 key，各自維護一個 ThreadedConnectionPool；多行程時每個行程各有一份。
_PGPOOLS={}
_PGPOOLLOCK=threading.Lock()

def _pgpoolkey(dbname,setting):
    return (setting.get("host"),setting.get("port"),setting.get("username"),dbname)

def _pggetpool(dbname,setting):
    key=_pgpoolkey(dbname,setting)
    poolobj=_PGPOOLS.get(key)
    if poolobj is None:
        with _PGPOOLLOCK:
            poolobj=_PGPOOLS.get(key)
            if poolobj is None:
                poolobj=pgpool.ThreadedConnectionPool(
                    1,
                    8,
                    host=setting["host"],
                    dbname=dbname,
                    user=setting["username"],
                    password=setting["password"],
                    port=setting["port"]
                )
                _PGPOOLS[key]=poolobj
    return poolobj

def _pggetconn(dbname,setting):
    poolobj=_pggetpool(dbname,setting)
    conn=poolobj.getconn()
    # 連線可能被資料庫端閒置關閉，拿到死連線就丟掉重拿
    if getattr(conn,"closed",0):
        try:
            poolobj.putconn(conn,close=True)
        except Exception:
            pass
        conn=poolobj.getconn()
    return conn

def _pgputconn(dbname,setting,conn,ok):
    if conn is None:
        return
    poolobj=_pggetpool(dbname,setting)
    try:
        if ok:
            # 收回前先 rollback，清掉 SELECT 後殘留的閒置交易，避免占用鎖
            try:
                conn.rollback()
            except Exception:
                pass
            poolobj.putconn(conn)
        else:
            poolobj.putconn(conn,close=True)
    except Exception:
        try:
            conn.close()
        except Exception:
            pass

# main START
def createdb(dbname,host="localhost",username="root",password="",port="3306"):
    return MySQLdb.connect(host=host,db=dbname,user=username,passwd=password,port=port)

def query(dbname,sql,data=None,setting={"host": "localhost","username": "root","password": "","port": 3306,"sqltype": "mysql"}):
    response=None
    if setting["sqltype"]=="pgsql":
        db=None
        cursor=None
        ok=False
        try:
            db=_pggetconn(dbname,setting)
            cursor=db.cursor(cursor_factory=RealDictCursor)
            cursor.execute(sql,data)
            sqlhead=sql.strip().lower()
            # WITH 開頭的 CTE 也視為查詢
            if sqlhead.startswith("select") or sqlhead.startswith("with"):
                response=cursor.fetchall()
            else:
                db.commit()
                if sqlhead.startswith("insert"):
                    cursor.execute("SELECT LASTVAL() AS id")
                    response=cursor.fetchone()["id"]
                else:
                    response=cursor.rowcount
            ok=True
        except Exception as error:
            printcolorhaveline("fail","[ERROR] use query function error " + str(error),"")
        finally:
            if cursor:
                cursor.close()
            _pgputconn(dbname,setting,db,ok)
        return response
    else:
        db=None
        cursor=None
        try:
            db=MySQLdb.connect(
                host=setting["host"],
                db=dbname,
                user=setting["username"],
                passwd=setting["password"],
                port=setting["port"]
            )
            cursor=db.cursor(DictCursor)
            cursor.execute(sql,data)
            sqlhead=sql.strip().lower()
            # WITH 開頭的 CTE 也視為查詢
            if sqlhead.startswith("select") or sqlhead.startswith("with"):
                response=cursor.fetchall()
            else:
                db.commit()
                if sqlhead.startswith("insert"):
                    response=cursor.lastrowid
                else:
                    response=cursor.rowcount
        except Exception as error:
            printcolorhaveline("fail","[ERROR] use query function error " + str(error),"")
        finally:
            if cursor:
                cursor.close()
            if db:
                db.close()
        return response

def querytransaction(dbname,sqllist,setting={"host": "localhost","username": "root","password": "","port": 3306,"sqltype": "mysql"}):
    """在單一連線、單一交易內依序執行多條語句，全部成功才 commit，任一失敗整批 rollback。

    Args:
        dbname: 資料庫名稱
        sqllist: [[sql,data], ...]，data 可為 None
        setting: 資料庫連線設定

    Returns:
        全部成功回傳各語句結果的 list（SELECT/WITH 回 fetchall、INSERT 回最新 id、其他回 rowcount），任一失敗回傳 None
    """
    if not sqllist:
        printcolorhaveline("fail","[ERROR] sqllist is empty","")
        return None
    if setting["sqltype"]=="pgsql":
        db=None
        cursor=None
        response=None
        ok=False
        try:
            db=_pggetconn(dbname,setting)
            cursor=db.cursor(cursor_factory=RealDictCursor)
            resultlist=[]
            for item in sqllist:
                sql=item[0]
                data=item[1] if len(item)>1 else None
                cursor.execute(sql,data)
                sqlhead=sql.strip().lower()
                if sqlhead.startswith("select") or sqlhead.startswith("with"):
                    resultlist.append(cursor.fetchall())
                elif sqlhead.startswith("insert"):
                    cursor.execute("SELECT LASTVAL() AS id")
                    resultlist.append(cursor.fetchone()["id"])
                else:
                    resultlist.append(cursor.rowcount)
            db.commit()
            response=resultlist
            ok=True
        except Exception as error:
            printcolorhaveline("fail","[ERROR] use querytransaction function error " + str(error),"")
            if db:
                try:
                    db.rollback()
                except Exception:
                    pass
        finally:
            if cursor:
                cursor.close()
            _pgputconn(dbname,setting,db,ok)
        return response
    else:
        db=None
        cursor=None
        response=None
        try:
            db=MySQLdb.connect(
                host=setting["host"],
                db=dbname,
                user=setting["username"],
                passwd=setting["password"],
                port=setting["port"]
            )
            cursor=db.cursor(DictCursor)
            resultlist=[]
            for item in sqllist:
                sql=item[0]
                data=item[1] if len(item)>1 else None
                cursor.execute(sql,data)
                sqlhead=sql.strip().lower()
                if sqlhead.startswith("select") or sqlhead.startswith("with"):
                    resultlist.append(cursor.fetchall())
                elif sqlhead.startswith("insert"):
                    resultlist.append(cursor.lastrowid)
                else:
                    resultlist.append(cursor.rowcount)
            db.commit()
            response=resultlist
        except Exception as error:
            printcolorhaveline("fail","[ERROR] use querytransaction function error " + str(error),"")
            if db:
                try:
                    db.rollback()
                except Exception:
                    pass
        finally:
            if cursor:
                cursor.close()
            if db:
                db.close()
        return response

def queryinsert(dbname, tablename, data=None, setting={"host": "localhost","username": "root","password": "","port": 3306,"sqltype": "mysql"}):
    """
    插入資料到資料庫

    Args:
        dbname: 資料庫名稱
        tablename: 資料表名稱
        data: 單筆物件 {"欄位": 值} 或多筆陣列 [{"欄位": 值}, ...]
        setting: 資料庫連線設定

    Returns:
        單筆插入時回傳 lastrowid，多筆時回傳插入筆數
    """

    if not data:
        printcolorhaveline("fail","[ERROR] data is empty","")
        return None

    # 將單筆物件轉為陣列
    data_list = data if isinstance(data, list) else [data]

    if setting["sqltype"]=="pgsql":
        db=None
        cursor=None
        response=None
        ok=False
        try:
            db=_pggetconn(dbname,setting)
            cursor=db.cursor(cursor_factory=RealDictCursor)

            insert_count = 0
            last_id = None

            for item in data_list:
                if not isinstance(item, dict):
                    continue

                # 獲取欄位名和值
                columns = list(item.keys())
                values = list(item.values())

                # 生成 SQL
                sql = f"INSERT INTO \"{tablename}\" ({', '.join(['\"' + col + '\"' for col in columns])}) VALUES ({', '.join(['%s'] * len(columns))})"

                cursor.execute(sql, values)
                db.commit()

                # 取得最後插入的 ID
                cursor.execute("SELECT LASTVAL() AS id")
                result = cursor.fetchone()
                if result:
                    last_id = result["id"]

                insert_count += 1

            response = last_id if len(data_list) == 1 else insert_count
            ok=True
        except Exception as error:
            printcolorhaveline("fail","[ERROR] use queryinsert function error " + str(error),"")
        finally:
            if cursor:
                cursor.close()
            _pgputconn(dbname,setting,db,ok)
        return response
    else:
        db=None
        cursor=None
        response=None
        try:
            db=MySQLdb.connect(
                host=setting["host"],
                db=dbname,
                user=setting["username"],
                passwd=setting["password"],
                port=setting["port"]
            )
            cursor=db.cursor(DictCursor)

            insert_count = 0
            last_id = None

            for item in data_list:
                if not isinstance(item, dict):
                    continue

                # 獲取欄位名和值
                columns = list(item.keys())
                values = list(item.values())

                # 生成 SQL
                sql = f"INSERT INTO `{tablename}` ({', '.join(['`' + col + '`' for col in columns])}) VALUES ({', '.join(['%s'] * len(columns))})"

                cursor.execute(sql, values)
                db.commit()

                # 取得最後插入的 ID
                last_id = cursor.lastrowid
                insert_count += 1

            response = last_id if len(data_list) == 1 else insert_count
        except Exception as error:
            printcolorhaveline("fail","[ERROR] use queryinsert function error " + str(error),"")
        finally:
            if cursor:
                cursor.close()
            if db:
                db.close()
        return response

def queryupdate(dbname, tablename, data, where=None, setting={"host": "localhost","username": "root","password": "","port": 3306,"sqltype": "mysql"}):
    """
    更新資料庫資料

    Args:
        dbname: 資料庫名稱
        tablename: 資料表名稱
        data: 更新的資料 {"欄位": 值}
        where: WHERE 條件 {"欄位": 值} 或 {"欄位": {"op": "=|>|<|>=|<=|!=|LIKE", "value": 值}}
        setting: 資料庫連線設定

    Returns:
        更新的筆數
    """

    if not data or not isinstance(data, dict):
        printcolorhaveline("fail","[ERROR] data must be a dictionary","")
        return None

    if setting["sqltype"]=="pgsql":
        db=None
        cursor=None
        response=None
        ok=False
        try:
            db=_pggetconn(dbname,setting)
            cursor=db.cursor(cursor_factory=RealDictCursor)

            # 生成 UPDATE 部分
            set_parts = []
            values = []
            for col, val in data.items():
                set_parts.append(f"\"{col}\" = %s")
                values.append(val)

            sql = f"UPDATE \"{tablename}\" SET {', '.join(set_parts)}"

            # 生成 WHERE 部分
            if where:
                where_parts = []
                for col, cond in where.items():
                    if isinstance(cond, dict):
                        op = cond.get("op", "=")
                        where_parts.append(f"\"{col}\" {op} %s")
                        values.append(cond.get("value"))
                    else:
                        where_parts.append(f"\"{col}\" = %s")
                        values.append(cond)
                sql += " WHERE " + " AND ".join(where_parts)

            cursor.execute(sql, values)
            db.commit()
            response = cursor.rowcount
            ok=True
        except Exception as error:
            printcolorhaveline("fail","[ERROR] use queryupdate function error " + str(error),"")
        finally:
            if cursor:
                cursor.close()
            _pgputconn(dbname,setting,db,ok)
        return response
    else:
        db=None
        cursor=None
        response=None
        try:
            db=MySQLdb.connect(
                host=setting["host"],
                db=dbname,
                user=setting["username"],
                passwd=setting["password"],
                port=setting["port"]
            )
            cursor=db.cursor(DictCursor)

            # 生成 UPDATE 部分
            set_parts = []
            values = []
            for col, val in data.items():
                set_parts.append(f"`{col}` = %s")
                values.append(val)

            sql = f"UPDATE `{tablename}` SET {', '.join(set_parts)}"

            # 生成 WHERE 部分
            if where:
                where_parts = []
                for col, cond in where.items():
                    if isinstance(cond, dict):
                        op = cond.get("op", "=")
                        where_parts.append(f"`{col}` {op} %s")
                        values.append(cond.get("value"))
                    else:
                        where_parts.append(f"`{col}` = %s")
                        values.append(cond)
                sql += " WHERE " + " AND ".join(where_parts)

            cursor.execute(sql, values)
            db.commit()
            response = cursor.rowcount
        except Exception as error:
            printcolorhaveline("fail","[ERROR] use queryupdate function error " + str(error),"")
        finally:
            if cursor:
                cursor.close()
            if db:
                db.close()
        return response

def querydelete(dbname, tablename, where=None, setting={"host": "localhost","username": "root","password": "","port": 3306,"sqltype": "mysql"}):
    """
    刪除資料庫資料

    Args:
        dbname: 資料庫名稱
        tablename: 資料表名稱
        where: WHERE 條件 {"欄位": 值} 或 {"欄位": {"op": "=|>|<|>=|<=|!=|LIKE", "value": 值}}
        setting: 資料庫連線設定

    Returns:
        刪除的筆數
    """

    if setting["sqltype"]=="pgsql":
        db=None
        cursor=None
        response=None
        ok=False
        try:
            db=_pggetconn(dbname,setting)
            cursor=db.cursor(cursor_factory=RealDictCursor)

            sql = f"DELETE FROM \"{tablename}\""
            values = []

            # 生成 WHERE 部分
            if where:
                where_parts = []
                for col, cond in where.items():
                    if isinstance(cond, dict):
                        op = cond.get("op", "=")
                        where_parts.append(f"\"{col}\" {op} %s")
                        values.append(cond.get("value"))
                    else:
                        where_parts.append(f"\"{col}\" = %s")
                        values.append(cond)
                sql += " WHERE " + " AND ".join(where_parts)

            cursor.execute(sql, values)
            db.commit()
            response = cursor.rowcount
            ok=True
        except Exception as error:
            printcolorhaveline("fail","[ERROR] use querydelete function error " + str(error),"")
        finally:
            if cursor:
                cursor.close()
            _pgputconn(dbname,setting,db,ok)
        return response
    else:
        db=None
        cursor=None
        response=None
        try:
            db=MySQLdb.connect(
                host=setting["host"],
                db=dbname,
                user=setting["username"],
                passwd=setting["password"],
                port=setting["port"]
            )
            cursor=db.cursor(DictCursor)

            sql = f"DELETE FROM `{tablename}`"
            values = []

            # 生成 WHERE 部分
            if where:
                where_parts = []
                for col, cond in where.items():
                    if isinstance(cond, dict):
                        op = cond.get("op", "=")
                        where_parts.append(f"`{col}` {op} %s")
                        values.append(cond.get("value"))
                    else:
                        where_parts.append(f"`{col}` = %s")
                        values.append(cond)
                sql += " WHERE " + " AND ".join(where_parts)

            cursor.execute(sql, values)
            db.commit()
            response = cursor.rowcount
        except Exception as error:
            printcolorhaveline("fail","[ERROR] use querydelete function error " + str(error),"")
        finally:
            if cursor:
                cursor.close()
            if db:
                db.close()
        return response


def writeauditlog(dbname,setting,userid,tablename,action,recordid=None,beforedata=None,afterdata=None,request=None,handid=None):
    """寫入操作稽核日誌（對應檢查表 1.7）。

    記錄「誰(userid)／何時(createtime 預設 now())／對哪個目標(tablename+recordid)做了什麼(action)／
    前後值(beforedata/afterdata)」。任何錯誤都被吞掉並寫進主控台，絕不影響主要寫入操作。

    Args:
        userid: 操作者 user.id
        tablename: 被異動的資料表名稱（如 "user"、"sessionplayer"、"session"）
        action: 動作（如 "edit"、"delete"、"editpermission"、"editfinance"）
        recordid: 被異動資料列的 id
        beforedata/afterdata: dict，會序列化成 jsonb；只放關鍵欄位即可
        request: Django request，用來取 IP 與 User-Agent
    """
    try:
        ip=None
        useragent=None
        if request is not None:
            # 與 middleware/contact/hand 取 IP 的寫法一致: 優先 nginx 設的 X-Real-IP, 取不到才 fallback
            # REMOTE_ADDR; 本部署兩者都是真實 client IP (uvicorn proxy_headers 預設開啟已還原來源 IP)
            ip=request.META.get("HTTP_X_REAL_IP") or request.META.get("REMOTE_ADDR") or None
            useragent=request.META.get("HTTP_USER_AGENT") or None
        before=json.dumps(beforedata,ensure_ascii=False,default=str) if beforedata is not None else None
        after=json.dumps(afterdata,ensure_ascii=False,default=str) if afterdata is not None else None
        query(
            dbname,
            """INSERT INTO "auditlog"("userid","handid","tablename","action","recordid","beforedata","afterdata","ipaddress","useragent")VALUES(%s,%s,%s,%s,%s,%s::jsonb,%s::jsonb,%s::inet,%s)""",
            [userid,handid,tablename,action,recordid,before,after,ip,useragent],
            setting
        )
    except Exception as error:
        printcolorhaveline("fail","[ERROR] writeauditlog error " + str(error),"")