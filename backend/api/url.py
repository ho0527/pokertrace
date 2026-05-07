from django.contrib import admin
from django.urls import path,include,re_path

from . import club
from . import head
from . import seating
from . import session
from . import table
from . import type
from . import user
# from . import connect

urlpatterns=[
    re_path(r"^signincheck$",user.signincheck,name="signincheck"),

    re_path(r"^signin$",user.signin,name="signin"),
    re_path(r"^signout$",user.signout,name="signout"),

    re_path(r"^getuser$",user.getuser,name="getuser"),

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
]