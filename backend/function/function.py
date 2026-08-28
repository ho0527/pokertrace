# import
import bcrypt
import hashlib
import json
import os
import random
import re
import time
from django.http import HttpResponse,HttpResponseRedirect,JsonResponse
from django.utils.text import get_valid_filename
from django.views.decorators.http import require_http_methods
from rest_framework import status
from rest_framework.decorators import api_view,renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response

# 自創
from function.sql import *
from function.thing import *

# main START
db="db"

ERRORLIST={
	"ERROR_request_data_not_found": status.HTTP_400_BAD_REQUEST,
	"ERROR_request_data_type_error": status.HTTP_400_BAD_REQUEST,
	"ERROR_signin_error": status.HTTP_401_UNAUTHORIZED,
	"ERROR_username_error": status.HTTP_401_UNAUTHORIZED,
	"ERROR_token_error": status.HTTP_403_FORBIDDEN,
	"ERROR_token_not_found": status.HTTP_401_UNAUTHORIZED,
	"ERROR_no_permission": status.HTTP_403_FORBIDDEN,
	"ERROR_table_not_found": status.HTTP_404_NOT_FOUND,
	"ERROR_seating_not_found": status.HTTP_404_NOT_FOUND,
	"ERROR_session_not_found": status.HTTP_404_NOT_FOUND,
	"ERROR_series_not_found": status.HTTP_404_NOT_FOUND,
	"ERROR_user_not_found": status.HTTP_404_NOT_FOUND,
	"ERROR_api_not_found": status.HTTP_404_NOT_FOUND,
	"ERROR_product_not_found": status.HTTP_404_NOT_FOUND,
	"ERROR_phone_exist": status.HTTP_409_CONFLICT,
	"ERROR_email_exist": status.HTTP_409_CONFLICT,
	"ERROR_request_mimes_type_error": status.HTTP_400_BAD_REQUEST,
	"ERROR_already_signed_up": status.HTTP_409_CONFLICT,
	"ERROR_staff_not_found": status.HTTP_404_NOT_FOUND,
	"ERROR_staff_role_mismatch": status.HTTP_400_BAD_REQUEST,
	"ERROR_staff_already_invited": status.HTTP_409_CONFLICT,
	"ERROR_staff_self_invite": status.HTTP_400_BAD_REQUEST,
	"ERROR_verifytoken_invalid": status.HTTP_400_BAD_REQUEST,
	"ERROR_session_not_open_for_registration": status.HTTP_400_BAD_REQUEST,
	"ERROR_cannot_register_own_session": status.HTTP_400_BAD_REQUEST,
	"ERROR_staff_cannot_register": status.HTTP_400_BAD_REQUEST,
	"ERROR_session_ended": status.HTTP_400_BAD_REQUEST,
	"ERROR_already_registered": status.HTTP_409_CONFLICT,
	"ERROR_registration_not_found": status.HTTP_404_NOT_FOUND,
	"ERROR_timer_player_not_found": status.HTTP_404_NOT_FOUND,
	"ERROR_only_latest_hand_deletable": status.HTTP_400_BAD_REQUEST,
	"ERROR_database_error": status.HTTP_500_INTERNAL_SERVER_ERROR,
	"ERROR_unknow_error_pls_tell_the_admin": status.HTTP_500_INTERNAL_SERVER_ERROR,
	"ERROR_hand_not_found": status.HTTP_404_NOT_FOUND,
	"ERROR_timer_save_conflict": status.HTTP_409_CONFLICT,
	"ERROR_club_not_found": status.HTTP_404_NOT_FOUND,
	"ERROR_session_relation_not_found": status.HTTP_404_NOT_FOUND,
	"ERROR_type_not_found": status.HTTP_404_NOT_FOUND,
	"ERROR_player_eliminated": status.HTTP_400_BAD_REQUEST,
	"WARNING_rebuycount_exceeded": status.HTTP_400_BAD_REQUEST,
	"ERROR_staff_already_clockedin": status.HTTP_409_CONFLICT,
	"ERROR_staff_not_clockedin": status.HTTP_400_BAD_REQUEST,
	"ERROR_worklog_not_found": status.HTTP_404_NOT_FOUND,
	"ERROR_worklog_time_invalid": status.HTTP_400_BAD_REQUEST,
	"ERROR_worklog_time_overlap": status.HTTP_409_CONFLICT,
	"ERROR_tablestaff_not_found": status.HTTP_404_NOT_FOUND,
	"ERROR_staff_already_ontable": status.HTTP_409_CONFLICT,
	"ERROR_staff_already_onbreak": status.HTTP_400_BAD_REQUEST,
	"ERROR_staff_not_onbreak": status.HTTP_400_BAD_REQUEST,
	"ERROR_follow_not_found": status.HTTP_404_NOT_FOUND,
	"ERROR_follow_target_not_found": status.HTTP_404_NOT_FOUND,
	"ERROR_cannot_follow_self": status.HTTP_400_BAD_REQUEST,
	"ERROR_invalid_gametype_code": status.HTTP_400_BAD_REQUEST,
	"ERROR_duplicate_gametype_code": status.HTTP_409_CONFLICT,
	"ERROR_zz_required": status.HTTP_400_BAD_REQUEST,
}

def errorresponse(key):
	return Response({
		"success": False,
		"data": key
	},ERRORLIST.get(key,status.HTTP_400_BAD_REQUEST))
