import datetime
import MySQLdb
import mysql.connector as mysql
import psycopg2
from psycopg2.extras import RealDictCursor
from MySQLdb.cursors import DictCursor
from mysql.connector import Error
from django.http import JsonResponse

# 自創
from function.thing import *

# main START
def createdb(dbname,host="localhost",username="root",password="",port="3306"):
    return MySQLdb.connect(host=host,db=dbname,user=username,passwd=password,port=port)

def query(dbname,sql,data=None,setting={"host": "localhost","username": "root","password": "","port": 3306,"sqltype": "mysql"}):
    response=None
    if setting["sqltype"]=="pgsql":
        db=None
        cursor=None
        try:
            db=psycopg2.connect(
                host=setting["host"],
                dbname=dbname,
                user=setting["username"],
                password=setting["password"],
                port=setting["port"]
            )
            cursor=db.cursor(cursor_factory=RealDictCursor)
            cursor.execute(sql,data)
            if sql.strip().lower().startswith("select"):
                response=cursor.fetchall()
            else:
                db.commit()
                if sql.strip().lower().startswith("insert"):
                    cursor.execute("SELECT LASTVAL() AS id")
                    response=cursor.fetchone()["id"]
                else:
                    response=cursor.rowcount
            printcolorhaveline("green","use query function SUCCESS","")
        except Exception as error:
            printcolorhaveline("fail","[ERROR] use query function error " + str(error),"")
        finally:
            if cursor:
                cursor.close()
            if db:
                db.close()
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
            if sql.strip().lower().startswith("select"):
                response=cursor.fetchall()
            else:
                db.commit()
                if sql.strip().lower().startswith("insert"):
                    response=cursor.lastrowid
                else:
                    response=cursor.rowcount
            printcolorhaveline("green","use query function SUCCESS","")
        except Exception as error:
            printcolorhaveline("fail","[ERROR] use query function error " + str(error),"")
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
        try:
            db=psycopg2.connect(
                host=setting["host"],
                dbname=dbname,
                user=setting["username"],
                password=setting["password"],
                port=setting["port"]
            )
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
            printcolorhaveline("green","use queryinsert function SUCCESS","")
        except Exception as error:
            printcolorhaveline("fail","[ERROR] use queryinsert function error " + str(error),"")
        finally:
            if cursor:
                cursor.close()
            if db:
                db.close()
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
            printcolorhaveline("green","use queryinsert function SUCCESS","")
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
        try:
            db=psycopg2.connect(
                host=setting["host"],
                dbname=dbname,
                user=setting["username"],
                password=setting["password"],
                port=setting["port"]
            )
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
            printcolorhaveline("green","use queryupdate function SUCCESS","")
        except Exception as error:
            printcolorhaveline("fail","[ERROR] use queryupdate function error " + str(error),"")
        finally:
            if cursor:
                cursor.close()
            if db:
                db.close()
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
            printcolorhaveline("green","use queryupdate function SUCCESS","")
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
        try:
            db=psycopg2.connect(
                host=setting["host"],
                dbname=dbname,
                user=setting["username"],
                password=setting["password"],
                port=setting["port"]
            )
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
            printcolorhaveline("green","use querydelete function SUCCESS","")
        except Exception as error:
            printcolorhaveline("fail","[ERROR] use querydelete function error " + str(error),"")
        finally:
            if cursor:
                cursor.close()
            if db:
                db.close()
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
            printcolorhaveline("green","use querydelete function SUCCESS","")
        except Exception as error:
            printcolorhaveline("fail","[ERROR] use querydelete function error " + str(error),"")
        finally:
            if cursor:
                cursor.close()
            if db:
                db.close()
        return response