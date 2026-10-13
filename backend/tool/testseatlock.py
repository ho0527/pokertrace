import json
import os
import sys
import threading
import time

import psycopg2


BACKENDPATH=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKENDPATH not in sys.path:
	sys.path.insert(0,BACKENDPATH)

from api.initialize import SETTING
from api.seatlock import seatlocked,seatlocknormalize,seatlockread


def databaseconnection():
	setting=SETTING["dbsetting"]
	return psycopg2.connect(
		host=setting["host"],
		dbname=SETTING["dbname"],
		user=setting["username"],
		password=setting["password"],
		port=setting["port"]
	)


def helpertest():
	assert seatlocknormalize([9,1],9)==[1,9]
	assert seatlocknormalize([1,1],9) is None
	assert seatlocknormalize([0],9) is None
	assert seatlocknormalize([10],9) is None
	assert seatlocknormalize([True],9) is None
	assert seatlockread({"lockedseatlist": "[9, 1, 9]"},9)==[1,9]
	assert seatlocked({"lockedseatlist": [9]},9,9)
	assert not seatlocked({"lockedseatlist": [9]},8,9)
	occupied={1,9}
	locked={9}
	assert len(occupied.union(locked))==2
	print("[PASS] seat lock helper normalization and capacity union")


def expectconstraint(cursor,sql,param,message):
	cursor.execute("SAVEPOINT seatlockexpect")
	faileded=False
	try:
		cursor.execute(sql,param)
	except psycopg2.Error as error:
		faileded=error.pgcode=="23514" and message in str(error)
		cursor.execute("ROLLBACK TO SAVEPOINT seatlockexpect")
	if not faileded:
		raise AssertionError(message+" was not enforced")
	cursor.execute("RELEASE SAVEPOINT seatlockexpect")


def integrationtest():
	seed=int(time.time()*1000000)
	token="sl"+str(seed)[-12:]
	sessionid=None
	userid=None
	tableid=None
	connection=databaseconnection()
	try:
		cursor=connection.cursor()
		cursor.execute("""
			SELECT s.id,u.id
			FROM public.session s
			CROSS JOIN public."user" u
			WHERE s.deletetime IS NULL AND u.deletetime IS NULL
			AND NOT EXISTS(
				SELECT 1 FROM public.sessionplayer sp
				WHERE sp.sessionid=s.id AND sp.userid=u.id
			)
			ORDER BY s.id DESC,u.id DESC
			LIMIT 1
		""")
		pair=cursor.fetchone()
		if pair is None:
			raise AssertionError("no unused session/user pair is available for the integration fixture")
		sessionid=pair[0]
		userid=pair[1]
		cursor.execute(
			"""INSERT INTO public.\"table\"(sessionid,no,token,lockedseatlist)VALUES(%s,%s,%s,'[]'::jsonb)RETURNING id""",
			[sessionid,999999,token]
		)
		tableid=cursor.fetchone()[0]
		cursor.execute("""UPDATE public.\"table\" SET lockedseatlist=%s::jsonb WHERE id=%s""",[json.dumps([9]),tableid])
		expectconstraint(
			cursor,
			"""INSERT INTO public.sessionplayer(sessionid,userid,status,tableid,seatno)VALUES(%s,%s,'confirmed',%s,9)""",
			[sessionid,userid,tableid],
			"ERROR_seat_locked"
		)
		expectconstraint(
			cursor,
			"""INSERT INTO public.seating(tableid,seatno,buyin,name,type)VALUES(%s,9,0,'seatlock test','buyin')""",
			[tableid],
			"ERROR_seat_locked"
		)
		cursor.execute("""INSERT INTO public.seating(tableid,seatno,buyin,name,type)VALUES(%s,9,0,'','leave')""",[tableid])
		cursor.execute("""UPDATE public.\"table\" SET lockedseatlist='[]'::jsonb WHERE id=%s""",[tableid])
		cursor.execute(
			"""INSERT INTO public.sessionplayer(sessionid,userid,status,tableid,seatno)VALUES(%s,%s,'confirmed',%s,1)""",
			[sessionid,userid,tableid]
		)
		expectconstraint(
			cursor,
			"""UPDATE public.\"table\" SET lockedseatlist='[1]'::jsonb WHERE id=%s""",
			[tableid],
			"ERROR_seat_occupied_lock"
		)
		cursor.execute("""DELETE FROM public.sessionplayer WHERE tableid=%s AND userid=%s""",[tableid,userid])
		cursor.execute("""DELETE FROM public.seating WHERE tableid=%s""",[tableid])
		cursor.execute("""UPDATE public.\"table\" SET lockedseatlist='[]'::jsonb WHERE id=%s""",[tableid])
		connection.commit()
		print("[PASS] database rejects locked placement and occupied-seat locking")

		lockedready=threading.Event()
		placementstarted=threading.Event()
		commitlock=threading.Event()
		resultlist=[]

		def lockfirst():
			threadconnection=databaseconnection()
			try:
				threadcursor=threadconnection.cursor()
				threadcursor.execute("""UPDATE public.\"table\" SET lockedseatlist='[9]'::jsonb WHERE id=%s""",[tableid])
				lockedready.set()
				commitlock.wait(5)
				threadconnection.commit()
				resultlist.append("lock-committed")
			finally:
				threadconnection.close()

		def placeafterlock():
			threadconnection=databaseconnection()
			try:
				lockedready.wait(5)
				threadcursor=threadconnection.cursor()
				placementstarted.set()
				try:
					threadcursor.execute(
						"""INSERT INTO public.sessionplayer(sessionid,userid,status,tableid,seatno)VALUES(%s,%s,'confirmed',%s,9)""",
						[sessionid,userid,tableid]
					)
					threadconnection.commit()
					resultlist.append("placement-committed")
				except psycopg2.Error as error:
					threadconnection.rollback()
					if error.pgcode=="23514" and "ERROR_seat_locked" in str(error):
						resultlist.append("placement-rejected")
			finally:
				threadconnection.close()

		lockthread=threading.Thread(target=lockfirst)
		placementthread=threading.Thread(target=placeafterlock)
		lockthread.start()
		placementthread.start()
		placementstarted.wait(5)
		commitlock.set()
		lockthread.join(5)
		placementthread.join(5)
		if "lock-committed" not in resultlist or "placement-rejected" not in resultlist:
			raise AssertionError("lock-first race did not serialize safely: "+str(resultlist))
		print("[PASS] concurrent lock-first request rejects the waiting placement")

		cursor=connection.cursor()
		cursor.execute("""UPDATE public.\"table\" SET lockedseatlist='[]'::jsonb WHERE id=%s""",[tableid])
		connection.commit()
		placementready=threading.Event()
		lockstarted=threading.Event()
		commitplacement=threading.Event()
		resultlist=[]

		def placefirst():
			threadconnection=databaseconnection()
			try:
				threadcursor=threadconnection.cursor()
				threadcursor.execute(
					"""INSERT INTO public.sessionplayer(sessionid,userid,status,tableid,seatno)VALUES(%s,%s,'confirmed',%s,9)""",
					[sessionid,userid,tableid]
				)
				placementready.set()
				commitplacement.wait(5)
				threadconnection.commit()
				resultlist.append("placement-committed")
			finally:
				threadconnection.close()

		def lockafterplacement():
			threadconnection=databaseconnection()
			try:
				placementready.wait(5)
				threadcursor=threadconnection.cursor()
				lockstarted.set()
				try:
					threadcursor.execute("""UPDATE public.\"table\" SET lockedseatlist='[9]'::jsonb WHERE id=%s""",[tableid])
					threadconnection.commit()
					resultlist.append("lock-committed")
				except psycopg2.Error as error:
					threadconnection.rollback()
					if error.pgcode=="23514" and "ERROR_seat_occupied_lock" in str(error):
						resultlist.append("lock-rejected")
			finally:
				threadconnection.close()

		placementthread=threading.Thread(target=placefirst)
		lockthread=threading.Thread(target=lockafterplacement)
		placementthread.start()
		lockthread.start()
		lockstarted.wait(5)
		commitplacement.set()
		placementthread.join(5)
		lockthread.join(5)
		if "placement-committed" not in resultlist or "lock-rejected" not in resultlist:
			raise AssertionError("placement-first race did not serialize safely: "+str(resultlist))
		print("[PASS] concurrent placement-first request rejects the waiting lock")
	finally:
		connection.rollback()
		connection.close()
		if tableid is not None:
			cleanupconnection=databaseconnection()
			try:
				cleanupconnection.autocommit=True
				cleanupcursor=cleanupconnection.cursor()
				cleanupcursor.execute("""DELETE FROM public.sessionplayer WHERE tableid=%s AND userid=%s""",[tableid,userid])
				cleanupcursor.execute("""DELETE FROM public.seating WHERE tableid=%s""",[tableid])
				cleanupcursor.execute("""DELETE FROM public.\"table\" WHERE id=%s""",[tableid])
			finally:
				cleanupconnection.close()


if __name__=="__main__":
	helpertest()
	if "--selftest" not in sys.argv:
		integrationtest()
	print("[PASS] testseatlock")
