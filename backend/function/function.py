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
	"ERROR_user_not_found": status.HTTP_404_NOT_FOUND,
	"ERROR_api_not_found": status.HTTP_404_NOT_FOUND,
	"ERROR_product_not_found": status.HTTP_404_NOT_FOUND,
	"ERROR_phone_exist": status.HTTP_409_CONFLICT,
	"ERROR_email_exist": status.HTTP_409_CONFLICT,
	"ERROR_request_mimes_type_error": status.HTTP_400_BAD_REQUEST,
	"ERROR_request_data_not_found": status.HTTP_400_BAD_REQUEST,
	"ERROR_request_data_not_found": status.HTTP_400_BAD_REQUEST,
}

def errorresponse(key):
	return Response({
		"success": False,
		"data": key
	},ERRORLIST[key])