import json


def seatlockread(tablerow,maxseat=None):
	value=[]
	if tablerow:
		value=tablerow.get("lockedseatlist") or []
	if isinstance(value,str):
		try:
			value=json.loads(value)
		except Exception:
			value=[]
	if not isinstance(value,list):
		value=[]
	seatlist=[]
	for item in value:
		try:
			seatno=int(item)
		except Exception:
			seatno=0
		valided=0<seatno
		if maxseat is not None and int(maxseat)<seatno:
			valided=False
		if valided and seatno not in seatlist:
			seatlist.append(seatno)
	seatlist.sort()
	return seatlist


def seatlocknormalize(value,maxseat):
	if not isinstance(value,list):
		return None
	seatlist=[]
	for item in value:
		if isinstance(item,bool):
			return None
		try:
			seatno=int(item)
		except Exception:
			return None
		if str(item).strip()!=str(seatno) or seatno<1 or int(maxseat)<seatno or seatno in seatlist:
			return None
		seatlist.append(seatno)
	seatlist.sort()
	return seatlist


def seatlocked(tablerow,seatno,maxseat=None):
	try:
		seatno=int(seatno)
	except Exception:
		seatno=0
	return seatno in seatlockread(tablerow,maxseat)
