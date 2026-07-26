from django.contrib import admin
from django.urls import path,include,re_path

from . import batch
from . import club
from . import contact
from . import gto
from . import hand
from . import notification
from . import seating
from . import series
from . import session
from . import sessionplayer
from . import staff
from . import structureparse
from . import swagger
from . import table
from . import timer
from . import type
from . import user
# from . import connect

urlpatterns=[
    re_path(r"^swagger/$",swagger.swaggerui,name="swaggerui"),
    re_path(r"^swagger.json$",swagger.openapijson,name="openapijson"),

    re_path(r"^signincheck$",user.signincheck,name="signincheck"),

    re_path(r"^signin$",user.signin,name="signin"),
    re_path(r"^signup$",user.signup,name="signup"),
    re_path(r"^signout$",user.signout,name="signout"),

    re_path(r"^newcontactmessage$",contact.newcontactmessage,name="newcontactmessage"),
    re_path(r"^getcontactmessages$",contact.getcontactmessages,name="getcontactmessages"),
    re_path(r"^editcontactmessage/(?P<messageid>[^/]+)$",contact.editcontactmessage,name="editcontactmessage"),
    re_path(r"^replycontactmessage/(?P<messageid>[^/]+)$",contact.replycontactmessage,name="replycontactmessage"),

    re_path(r"^getuser$",user.getuser,name="getuser"),
    re_path(r"^searchusers$",user.searchusers,name="searchusers"),
    re_path(r"^getuserreport$",user.getuserreport,name="getuserreport"),
    re_path(r"^edituserlanguage$",user.edituserlanguage,name="edituserlang"),
    re_path(r"^edituserchipcolors$",user.edituserchipcolors,name="edituserchipcolors"),
    re_path(r"^editusercarddeck$",user.editusercarddeck,name="editusercarddeck"),
    re_path(r"^edituserpotmainside$",user.edituserpotmainside,name="edituserpotmainside"),
    re_path(r"^edituserchipset$",user.edituserchipset,name="edituserchipset"),
    re_path(r"^gettoolfavorite$",user.gettoolfavorite,name="gettoolfavorite"),
    re_path(r"^edittoolfavorite$",user.edittoolfavorite,name="edittoolfavorite"),

    re_path(r"^getuserlist$",user.getuserlist,name="getuserlist"),
    re_path(r"^blockuser/(?P<userid>[^/]+)$",user.blockuser,name="blockuser"),
    re_path(r"^banuser/(?P<userid>[^/]+)$",user.banuser,name="banuser"),
    re_path(r"^unbanuser/(?P<userid>[^/]+)$",user.unbanuser,name="unbanuser"),
    re_path(r"^edituser$",user.edituser,name="edituser"),
    re_path(r"^edituserpermission/(?P<userid>[^/]+)$",user.edituserpermission,name="edituserpermission"),
    re_path(r"^deleteuser/(?P<userid>[^/]+)$",user.deleteuser,name="deleteuser"),
    re_path(r"^deleteuseraccount$",user.deleteuseraccount,name="deleteuseraccount"),
    re_path(r"^getauditlog$",user.getauditlog,name="getauditlog"),
    re_path(r"^getapilog$",user.getapilog,name="getapilog"),

    re_path(r"^gettypelist$",type.gettypelist,name="gettypelist"),
    re_path(r"^gettype/(?P<typeid>[^/]+)$",type.gettype,name="gettype"),
    re_path(r"^newtype$",type.newtype,name="newtype"),
    re_path(r"^edittype/(?P<typeid>[^/]+)$",type.edittype,name="edittype"),
    re_path(r"^deletetype/(?P<typeid>[^/]+)$",type.deletetype,name="deletetype"),

    re_path(r"^getsessionlist$",session.getsessionlist,name="getsessionlist"),
    re_path(r"^getsession/(?P<sessionid>[^/]+)$",session.getsession,name="getsession"),
    re_path(r"^newsession$",session.newsession,name="newsession"),
    re_path(r"^copysession/(?P<sessionid>[^/]+)$",session.copysession,name="copysession"),
    re_path(r"^editsession/(?P<sessionid>[^/]+)$",session.editsession,name="editsession"),
    re_path(r"^editsessionsettings/(?P<sessionid>[^/]+)$",session.editsessionsettings,name="editsessionsettings"),
    re_path(r"^editsessionresult/(?P<sessionid>[^/]+)$",session.editsessionresult,name="editsessionresult"),
    re_path(r"^getsessionrelations/(?P<sessionid>[^/]+)$",session.getsessionrelations,name="getsessionrelations"),
    re_path(r"^searchsessionrelations/(?P<sessionid>[^/]+)$",session.searchsessionrelations,name="searchsessionrelations"),
    re_path(r"^editsessionrelations/(?P<sessionid>[^/]+)$",session.editsessionrelations,name="editsessionrelations"),
    re_path(r"^deletesession/(?P<sessionid>[^/]+)$",session.deletesession,name="deletesession"),

    re_path(r"^getserieslist$",series.getserieslist,name="getserieslist"),
    re_path(r"^getseries/(?P<seriesid>[^/]+)$",series.getseries,name="getseries"),
    re_path(r"^newseries$",series.newseries,name="newseries"),
    re_path(r"^editseries/(?P<seriesid>[^/]+)$",series.editseries,name="editseries"),
    re_path(r"^deleteseries/(?P<seriesid>[^/]+)$",series.deleteseries,name="deleteseries"),
    re_path(r"^editseriessessions/(?P<seriesid>[^/]+)$",series.editseriessessions,name="editseriessessions"),
    re_path(r"^getseriesleaderboard/(?P<seriesid>[^/]+)$",series.getseriesleaderboard,name="getseriesleaderboard"),

    re_path(r"^batchcreatesessions$",batch.batchcreatesessions,name="batchcreatesessions"),

    re_path(r"^getclublist$",club.getclublist,name="getclublist"),
    re_path(r"^getclub/(?P<clubid>[^/]+)$",club.getclub,name="getclub"),
    re_path(r"^newclub$",club.newclub,name="newclub"),
    re_path(r"^editclub/(?P<clubid>[^/]+)$",club.editclub,name="editclub"),
    re_path(r"^deleteclub/(?P<clubid>[^/]+)$",club.deleteclub,name="deleteclub"),

    re_path(r"^gettablelist/(?P<sessionid>[^/]+)$",table.gettablelist,name="gettablelist"),
    re_path(r"^getsessiontableboard/(?P<sessionid>[^/]+)$",table.getsessiontableboard,name="getsessiontableboard"),
    re_path(r"^getnotificationlist$",notification.getnotificationlist,name="getnotificationlist"),
    re_path(r"^getnotificationunreadcount$",notification.getnotificationunreadcount,name="getnotificationunreadcount"),
    re_path(r"^readnotification/(?P<notificationid>[^/]+)$",notification.readnotification,name="readnotification"),
    re_path(r"^readallnotification$",notification.readallnotification,name="readallnotification"),
    re_path(r"^deletenotification/(?P<notificationid>[^/]+)$",notification.deletenotification,name="deletenotification"),
    re_path(r"^gettable/(?P<tableid>[^/]+)$",table.gettable,name="gettable"),
    re_path(r"^newtable/(?P<sessionid>[^/]+)$",table.newtable,name="newtable"),
    re_path(r"^edittable/(?P<tableid>[^/]+)$",table.edittable,name="edittable"),
    re_path(r"^edittablesetting/(?P<tableid>[^/]+)$",table.edittablesetting,name="edittablesetting"),
    re_path(r"^savetableplayers/(?P<tableid>[^/]+)$",table.savetableplayers,name="savetableplayers"),
    re_path(r"^eliminatetableplayer/(?P<tableid>[^/]+)$",table.eliminatetableplayer,name="eliminatetableplayer"),
    re_path(r"^movetableplayer/(?P<tableid>[^/]+)$",table.movetableplayer,name="movetableplayer"),
    re_path(r"^mergetableplayers/(?P<tableid>[^/]+)$",table.mergetableplayers,name="mergetableplayers"),
    re_path(r"^closetable/(?P<tableid>[^/]+)$",table.closetable,name="closetable"),
    re_path(r"^deletetable/(?P<tableid>[^/]+)$",table.deletetable,name="deletetable"),

    re_path(r"^getseatinglist/(?P<tableid>[^/]+)$",seating.getseatinglist,name="getseatinglist"),
    re_path(r"^getseating/(?P<seatingid>[^/]+)$",seating.getseating,name="getseating"),
    re_path(r"^newseating/(?P<tableid>[^/]+)/(?P<seatno>[^/]+)$",seating.newseating,name="newseating"),
    re_path(r"^editseating/(?P<seatingid>[^/]+)$",seating.editseating,name="editseating"),
    re_path(r"^deleteseating/(?P<seatingid>[^/]+)$",seating.deleteseating,name="deleteseating"),

    re_path(r"^gethandcontext/(?P<tableid>[^/]+)$",hand.gethandcontext,name="gethandcontext"),
    re_path(r"^gettimebank/(?P<tableid>[^/]+)$",hand.gettimebank,name="gettimebank"),
    re_path(r"^gethandlist/(?P<tableid>[^/]+)$",hand.gethandlist,name="gethandlist"),
    re_path(r"^getsessionhandlist/(?P<sessionid>[^/]+)$",hand.getsessionhandlist,name="getsessionhandlist"),
    re_path(r"^getbroadcasthandlist/(?P<sessionid>[^/]+)$",hand.getbroadcasthandlist,name="getbroadcasthandlist"),
    re_path(r"^getbroadcastcontrol/(?P<sessionid>[^/]+)$",hand.getbroadcastcontrol,name="getbroadcastcontrol"),
    re_path(r"^broadcastrelease/(?P<sessionid>[^/]+)$",hand.broadcastrelease,name="broadcastrelease"),
    re_path(r"^getsessionchips/(?P<sessionid>[^/]+)$",hand.getsessionchips,name="getsessionchips"),
    re_path(r"^gethand/(?P<handid>[^/]+)$",hand.gethand,name="gethand"),
    re_path(r"^solvehandwinner$",hand.solvehandwinner,name="solvehandwinner"),
    re_path(r"^equity$",hand.equity,name="equity"),
    re_path(r"^solveflop$",gto.solveflop,name="solveflop"),
    re_path(r"^solvenextstreet$",gto.solvenextstreet,name="solvenextstreet"),
    re_path(r"^newhand/(?P<tableid>[^/]+)$",hand.newhand,name="newhand"),
    re_path(r"^editmyhandcard/(?P<handid>[^/]+)$",hand.editmyhandcard,name="editmyhandcard"),
    re_path(r"^edithand/(?P<handid>[^/]+)$",hand.edithand,name="edithand"),
    re_path(r"^savetimebank/(?P<tableid>[^/]+)$",hand.savetimebank,name="savetimebank"),
    re_path(r"^deletehand/(?P<handid>[^/]+)$",hand.deletehand,name="deletehand"),

    re_path(r"^getstafflist$",staff.getstafflist,name="getstafflist"),
    re_path(r"^newstaff$",staff.newstaff,name="newstaff"),
    re_path(r"^deletestaff/(?P<staffid>[^/]+)$",staff.deletestaff,name="deletestaff"),
    re_path(r"^verifystaff/(?P<verifytoken>[^/]+)$",staff.verifystaff,name="verifystaff"),
    re_path(r"^getsessionstafflist/(?P<sessionid>[^/]+)$",staff.getsessionstafflist,name="getsessionstafflist"),
    re_path(r"^newstaff/(?P<sessionid>[^/]+)$",staff.newsessionstaff,name="newsessionstaff"),
    re_path(r"^deletesessionstaff/(?P<sessionstaffid>[^/]+)$",staff.deletesessionstaff,name="deletesessionstaff"),

    re_path(r"^parsestructure$",structureparse.parsestructure,name="parsestructure"),

    re_path(r"^gettimer/(?P<sessionid>[^/]+)$",timer.gettimer,name="gettimer"),
    re_path(r"^savetimer/(?P<sessionid>[^/]+)$",timer.savetimer,name="savetimer"),
    re_path(r"^gettimerplayers/(?P<sessionid>[^/]+)$",timer.gettimerplayers,name="gettimerplayers"),
    re_path(r"^edittimerplayer/(?P<sessionid>[^/]+)/(?P<timerplayerid>[^/]+)$",timer.edittimerplayer,name="edittimerplayer"),

    re_path(r"^registersession/(?P<sessionid>[^/]+)$",sessionplayer.registersession,name="registersession"),
    re_path(r"^unregistersession/(?P<sessionid>[^/]+)$",sessionplayer.unregistersession,name="unregistersession"),
    re_path(r"^getmyregistrations$",sessionplayer.getmyregistrations,name="getmyregistrations"),
    re_path(r"^getmyregistrationstatus/(?P<sessionid>[^/]+)$",sessionplayer.getmyregistrationstatus,name="getmyregistrationstatus"),
    re_path(r"^getsessionregistrationlist/(?P<sessionid>[^/]+)$",sessionplayer.getsessionregistrationlist,name="getsessionregistrationlist"),
    re_path(r"^getcheckininfo/(?P<sessionplayerid>[^/]+)$",sessionplayer.getcheckininfo,name="getcheckininfo"),
    re_path(r"^getcheckininfobyentry/(?P<sessionid>[^/]+)/(?P<entryno>[^/]+)$",sessionplayer.getcheckininfobyentry,name="getcheckininfobyentry"),
    # re_path(r"^getsessionregistrations/(?P<sessionid>[^/]+)$",sessionplayer.getsessionregistrations,name="getsessionregistrations"),
    re_path(r"^registersessionplayer/(?P<sessionid>[^/]+)$",sessionplayer.registersessionplayer,name="registersessionplayer"),
    re_path(r"^advancesessionplayer/(?P<sessionplayerid>[^/]+)$",sessionplayer.advancesessionplayer,name="advancesessionplayer"),
    re_path(r"^confirmsessionplayer/(?P<sessionplayerid>[^/]+)$",sessionplayer.confirmsessionplayer,name="confirmsessionplayer"),
    re_path(r"^rebuysessionplayer/(?P<sessionplayerid>[^/]+)$",sessionplayer.rebuysessionplayer,name="rebuysessionplayer"),
    re_path(r"^cancelsessionplayer/(?P<sessionplayerid>[^/]+)$",sessionplayer.cancelsessionplayer,name="cancelsessionplayer"),
    re_path(r"^editsessionplayerfinance/(?P<sessionplayerid>[^/]+)$",sessionplayer.editsessionplayerfinance,name="editsessionplayerfinance"),
    re_path(r"^editsessionplayerseat/(?P<sessionplayerid>[^/]+)$",sessionplayer.editsessionplayerseat,name="editsessionplayerseat"),
    re_path(r"^randomizesessionplayerseats/(?P<sessionid>[^/]+)$",sessionplayer.randomizesessionplayerseats,name="randomizesessionplayerseats"),
]
