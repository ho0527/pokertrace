from validation import *

# test1
print(validate({
	"username": "admin",
	"password": "123456",
},{
	"username": "required|string",
	"password": ["required","string","min:5"]
},{
	"required": "The :key field is required.",
	"string": "ERROR_datatype_error",
	"min": "ERROR_datatype_error"
}))
"""
expected output:
{
	"success": true,
	"data": {
		"username": "admin",
		"password": "123456",
	}
}
"""


# test2
print(validate({
	"username": 123,
	"password": "123456",
},{
	"username": "required|string",
	"password": ["required","string","min:5"]
},{
	"required": "The :key field is required.",
	"string": "ERROR_datatype_error",
	"min": "ERROR_datatype_error"
}))
"""
expected output:
{
	"success": true,
	"data": {
		"username": {
			"string": "ERROR_datatype_error"
		}
	},
	"error": "ERROR_datatype_error"
}
"""

# test3
print(validate({
	"password": "123456",
},{
	"username": "required|string",
	"password": ["required","string","min:5"]
},{
	"username.required": "user name required.",
	"required": "The :key field is required.",
	"string": "ERROR_datatype_error",
	"min": "ERROR_datatype_error"
}))
"""
expected output:
{
	"success": true,
	"data": {
		"username": {
			"required": "user name required."
		}
	},
	"error": "user name required."
}
"""

# test4
print(validate({
	"password": "1234",
},{
	"username": "required|string",
	"password": ["required","string","min:5"]
},{
	"required": "The :key field is required.",
	"string": "ERROR_datatype_error",
	"min": "ERROR_datatype_error"
}))
"""
expected output:
{
	"success": true,
	"data": {
		"username": {
			"required": "The 'username' field is required."
		}
	},
	"error": "The 'username' field is required."
}
"""

# test5
print(validate({
	"password": "123",
},{
	"username": "required|string",
	"password": ["required","string","min:5"]
},{
	"required": "The :key field is required.",
	"string": "ERROR_datatype_error",
	"min": "ERROR_datatype_error"
},True))
"""
expected output:
{
	"success": true,
	"data": {
		"username": {
			"required": "The 'username' field is required."
		},
		"password": {
			"min": "ERROR_datatype_error"
		}
	},
	"error": "The 'username' field is required."
}
"""