"""Per-account club ordering and private notes; public details stay on the owner row."""
from function.sql import querytransaction
from function.thing import nowtime
from .initialize import SETTING


def getuserclublist(userid):
    timestamp=nowtime()
    result=querytransaction(SETTING["dbname"],[
        ['SELECT "id" FROM "user" WHERE "id"=%s AND "deletetime" IS NULL FOR UPDATE',[userid]],
        ['''WITH eligible AS (
            SELECT c."id",c."userid",c."sortorder" FROM "club" c
            WHERE c."deletetime" IS NULL AND (c."userid"=%s OR EXISTS(
                SELECT 1 FROM "session" s JOIN "sessionplayer" sp ON sp."sessionid"=s."id"
                WHERE s."clubid"=c."id" AND s."deletetime" IS NULL AND sp."userid"=%s
                AND sp."deletetime" IS NULL AND sp."status" IN ('confirmed','advanced')
            ))
        ), inserted AS (INSERT INTO "userclub"("userid","clubid","sortorder","createtime","updatetime")
        SELECT %s,e."id",COALESCE((SELECT MAX("sortorder") FROM "userclub" WHERE "userid"=%s),0)
            +ROW_NUMBER() OVER(ORDER BY CASE WHEN e."userid"=%s THEN 0 ELSE 1 END,e."sortorder",e."id"),%s,%s
        FROM eligible e WHERE EXISTS(SELECT 1 FROM "user" WHERE "id"=%s AND "deletetime" IS NULL)
        ON CONFLICT("userid","clubid") DO NOTHING RETURNING "id") SELECT "id" FROM inserted''',[userid,userid,userid,userid,userid,timestamp,timestamp,userid]],
        ['''SELECT c."id",c."userid",c."name",c."address",c."createtime",c."updatetime",uc."sortorder",
            c."userid"=%s AS owned,CASE WHEN c."userid"=%s THEN c."ps" ELSE uc."ps" END AS ps
            FROM "userclub" uc JOIN "club" c ON c."id"=uc."clubid" AND c."deletetime" IS NULL
            WHERE uc."userid"=%s ORDER BY uc."sortorder",c."id"''',[userid,userid,userid]]
    ],SETTING["dbsetting"],errorredacted=True)
    row=None
    if result is not None:
        row=result[-1]
    return row
