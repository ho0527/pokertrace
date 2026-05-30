from django.contrib import admin
from django.urls import path,include,re_path

from . import club
from . import contact
from . import head
from . import seating
from . import session
from . import sessionplayer
from . import staff
from . import table
from . import timer
from . import type
from . import user
# from . import connect

urlpatterns=[
    re_path(r"^signincheck$",user.signincheck,name="signincheck"),

    re_path(r"^signin$",user.signin,name="signin"),
    re_path(r"^signup$",user.signup,name="signup"),
    re_path(r"^signout$",user.signout,name="signout"),

    re_path(r"^newcontactmessage$",contact.newcontactmessage,name="newcontactmessage"),
    re_path(r"^getcontactmessages$",contact.getcontactmessages,name="getcontactmessages"),
    re_path(r"^editcontactmessage/(?P<messageid>.+)$",contact.editcontactmessage,name="editcontactmessage"),
    re_path(r"^replycontactmessage/(?P<messageid>.+)$",contact.replycontactmessage,name="replycontactmessage"),

    re_path(r"^getuser$",user.getuser,name="getuser"),
    re_path(r"^searchusers$",user.searchusers,name="searchusers"),
    re_path(r"^getuserreport$",user.getuserreport,name="getuserreport"),
    re_path(r"^edituserlanguage$",user.edituserlanguage,name="edituserlang"),
    re_path(r"^edituserchipcolors$",user.edituserchipcolors,name="edituserchipcolors"),

    re_path(r"^gettypelist$",type.gettypelist,name="gettypelist"),
    re_path(r"^gettype/(?P<typeid>.+)$",type.gettype,name="gettype"),
    re_path(r"^newtype$",type.newtype,name="newtype"),
    re_path(r"^edittype/(?P<typeid>.+)$",type.edittype,name="edittype"),
    re_path(r"^deletetype/(?P<typeid>.+)$",type.deletetype,name="deletetype"),

    re_path(r"^getsessionlist$",session.getsessionlist,name="getsessionlist"),
    re_path(r"^getsession/(?P<sessionid>.+)$",session.getsession,name="getsession"),
    re_path(r"^newsession$",session.newsession,name="newsession"),
    re_path(r"^copysession/(?P<sessionid>.+)$",session.copysession,name="copysession"),
    re_path(r"^editsession/(?P<sessionid>.+)$",session.editsession,name="editsession"),
    re_path(r"^editsessionsettings/(?P<sessionid>.+)$",session.editsessionsettings,name="editsessionsettings"),
    re_path(r"^editsessionresult/(?P<sessionid>.+)$",session.editsessionresult,name="editsessionresult"),
    re_path(r"^getsessionrelations/(?P<sessionid>.+)$",session.getsessionrelations,name="getsessionrelations"),
    re_path(r"^searchsessionrelations/(?P<sessionid>.+)$",session.searchsessionrelations,name="searchsessionrelations"),
    re_path(r"^editsessionrelations/(?P<sessionid>.+)$",session.editsessionrelations,name="editsessionrelations"),
    re_path(r"^deletesession/(?P<sessionid>.+)$",session.deletesession,name="deletesession"),

    re_path(r"^getclublist$",club.getclublist,name="getclublist"),
    re_path(r"^getclub/(?P<clubid>.+)$",club.getclub,name="getclub"),
    re_path(r"^newclub$",club.newclub,name="newclub"),
    re_path(r"^editclub/(?P<clubid>.+)$",club.editclub,name="editclub"),
    re_path(r"^deleteclub/(?P<clubid>.+)$",club.deleteclub,name="deleteclub"),

    re_path(r"^gettablelist/(?P<sessionid>.+)$",table.gettablelist,name="gettablelist"),
    re_path(r"^gettable/(?P<tableid>.+)$",table.gettable,name="gettable"),
    re_path(r"^newtable/(?P<sessionid>.+)$",table.newtable,name="newtable"),
    re_path(r"^edittable/(?P<tableid>.+)$",table.edittable,name="edittable"),
    re_path(r"^edittablesetting/(?P<tableid>.+)$",table.edittablesetting,name="edittablesetting"),
    re_path(r"^deletetable/(?P<tableid>.+)$",table.deletetable,name="deletetable"),

    re_path(r"^getseatinglist/(?P<tableid>.+)$",seating.getseatinglist,name="getseatinglist"),
    re_path(r"^getseating$",seating.getseating,name="getseating"),
    re_path(r"^newseating/(?P<tableid>.+)/(?P<seatno>.+)$",seating.newseating,name="newseating"),
    re_path(r"^editseating/(?P<tableid>.+)$",seating.editseating,name="editseating"),
    re_path(r"^deleteseating/(?P<seatingid>.+)$",seating.deleteseating,name="deleteseating"),

    re_path(r"^getheadlist/(?P<tableid>.+)$",head.getheadlist,name="getheadlist"),
    re_path(r"^gethead$",head.gethead,name="gethead"),
    re_path(r"^newhead/(?P<tableid>.+)$",head.newhead,name="newhead"),
    re_path(r"^edithead/(?P<tableid>.+)$",head.edithead,name="edithead"),
    re_path(r"^deletehead/(?P<headid>.+)$",head.deletehead,name="deletehead"),

    re_path(r"^getstafflist$",staff.getstafflist,name="getstafflist"),
    re_path(r"^newstaff$",staff.newstaff,name="newstaff"),
    re_path(r"^deletestaff/(?P<staffid>.+)$",staff.deletestaff,name="deletestaff"),
    re_path(r"^verifystaff/(?P<verifytoken>.+)$",staff.verifystaff,name="verifystaff"),
    re_path(r"^getsessionstafflist/(?P<sessionid>.+)$",staff.getsessionstafflist,name="getsessionstafflist"),
    re_path(r"^newstaff/(?P<sessionid>.+)$",staff.newsessionstaff,name="newsessionstaff"),
    re_path(r"^deletesessionstaff/(?P<sessionstaffid>.+)$",staff.deletesessionstaff,name="deletesessionstaff"),

    re_path(r"^gettimer/(?P<sessionid>.+)$",timer.gettimer,name="gettimer"),
    re_path(r"^savetimer/(?P<sessionid>.+)$",timer.savetimer,name="savetimer"),
    re_path(r"^gettimerplayers/(?P<sessionid>.+)$",timer.gettimerplayers,name="gettimerplayers"),
    re_path(r"^edittimerplayer/(?P<sessionid>.+)/(?P<timerplayerid>.+)$",timer.edittimerplayer,name="edittimerplayer"),

    re_path(r"^registersession/(?P<sessionid>.+)$",sessionplayer.registersession,name="registersession"),
    re_path(r"^unregistersession/(?P<sessionid>.+)$",sessionplayer.unregistersession,name="unregistersession"),
    re_path(r"^getmyregistrations$",sessionplayer.getmyregistrations,name="getmyregistrations"),
    re_path(r"^getmyregistrationstatus/(?P<sessionid>.+)$",sessionplayer.getmyregistrationstatus,name="getmyregistrationstatus"),
    re_path(r"^getsessionregistrationlist/(?P<sessionid>.+)$",sessionplayer.getsessionregistrationlist,name="getsessionregistrationlist"),
    # re_path(r"^getsessionregistrations/(?P<sessionid>.+)$",sessionplayer.getsessionregistrations,name="getsessionregistrations"),
    re_path(r"^registersessionplayer/(?P<sessionid>.+)$",sessionplayer.registersessionplayer,name="registersessionplayer"),
    re_path(r"^advancesessionplayer/(?P<sessionplayerid>.+)$",sessionplayer.advancesessionplayer,name="advancesessionplayer"),
    re_path(r"^confirmsessionplayer/(?P<sessionplayerid>.+)$",sessionplayer.confirmsessionplayer,name="confirmsessionplayer"),
    re_path(r"^cancelsessionplayer/(?P<sessionplayerid>.+)$",sessionplayer.cancelsessionplayer,name="cancelsessionplayer"),
    re_path(r"^editsessionplayerfinance/(?P<sessionplayerid>.+)$",sessionplayer.editsessionplayerfinance,name="editsessionplayerfinance"),
    re_path(r"^editsessionplayerseat/(?P<sessionplayerid>.+)$",sessionplayer.editsessionplayerseat,name="editsessionplayerseat"),
    re_path(r"^randomizesessionplayerseats/(?P<sessionid>.+)$",sessionplayer.randomizesessionplayerseats,name="randomizesessionplayerseats"),
]
