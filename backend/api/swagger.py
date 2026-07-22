import re

from django.conf import settings
from django.http import HttpResponse,JsonResponse,Http404


def regexpath(pattern):
    text=pattern.regex.pattern
    text=text.replace("^","")
    text=text.replace("$","")
    text=re.sub(r"\(\?P<([^>]+)>\.\+\)",r"{\1}",text)
    text=re.sub(r"\(\?P<([^>]+)>[^)]+\)",r"{\1}",text)
    if not text.startswith("/"):
        text="/"+text
    return text


def pathparams(pathtext):
    params=[]
    names=re.findall(r"{([^}]+)}",pathtext)
    for name in names:
        params.append({
            "name": name,
            "in": "path",
            "required": True,
            "schema": {
                "type": "string"
            }
        })
    return params


def viewmethods(callback):
    cls=getattr(callback,"cls",None)
    methods=getattr(cls,"http_method_names",[])
    result=[]
    for method in methods:
        if method!="options" and method!="head":
            result.append(method)
    if len(result)==0:
        result.append("get")
    return result


def requestbody(method):
    if method!="post" and method!="put" and method!="patch":
        return None
    return {
        "required": False,
        "content": {
            "application/json": {
                "schema": {
                    "type": "object",
                    "additionalProperties": True
                }
            }
        }
    }


def operation(pathtext,pattern,method):
    item={
        "summary": pattern.name or callbackname(pattern.callback),
        "tags": [
            callbackmodule(pattern.callback)
        ],
        "parameters": pathparams(pathtext),
        "responses": {
            "200": {
                "description": "API response",
                "content": {
                    "application/json": {
                        "schema": {
                            "$ref": "#/components/schemas/ApiResponse"
                        }
                    }
                }
            }
        }
    }
    body=requestbody(method)
    if body:
        item["requestBody"]=body
    return item


def callbackname(callback):
    name=getattr(callback,"__name__","api")
    return name


def callbackmodule(callback):
    module=getattr(callback,"__module__","api")
    parts=module.split(".")
    if len(parts)>0:
        return parts[len(parts)-1]
    return "api"


def buildpaths():
    from . import url

    paths={}
    patterns=url.urlpatterns
    for pattern in patterns:
        pathtext=regexpath(pattern.pattern)
        if pathtext=="/swagger/" or pathtext=="/swagger.json":
            continue
        if pathtext not in paths:
            paths[pathtext]={}
        methods=viewmethods(pattern.callback)
        for method in methods:
            paths[pathtext][method]=operation(pathtext,pattern,method)
    return paths


def openapispec(request):
    spec={
        "openapi": "3.0.3",
        "info": {
            "title": "PokerTrace API",
            "version": "1.0.0",
            "description": "PokerTrace backend API documentation generated from Django URL patterns."
        },
        "servers": [
            {
                "url": request.build_absolute_uri("/").rstrip("/")
            }
        ],
        "paths": buildpaths(),
        "components": {
            "securitySchemes": {
                "BearerAuth": {
                    "type": "http",
                    "scheme": "bearer",
                    "bearerFormat": "Token"
                }
            },
            "schemas": {
                "ApiResponse": {
                    "type": "object",
                    "properties": {
                        "success": {
                            "type": "boolean"
                        },
                        "data": {
                            "nullable": True
                        }
                    }
                }
            }
        },
        "security": [
            {
                "BearerAuth": []
            }
        ]
    }
    return spec


def openapijson(request):
    # API 文件只在 DEBUG 提供，避免正式環境公開列出全部端點
    if not settings.DEBUG:
        raise Http404()
    return JsonResponse(openapispec(request))


def swaggerui(request):
    # API 文件只在 DEBUG 提供，避免正式環境公開列出全部端點
    if not settings.DEBUG:
        raise Http404()
    title="PokerTrace API Swagger"
    html=f"""<!doctype html>
<html lang="zh-Hant">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{title}</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
        <style>
            body{{
                margin: 0;
                background: #f7f7f7;
            }}
        </style>
    </head>
    <body>
        <div id="swagger-ui"></div>
        <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
        <script>
            window.onload=function(){{
                window.ui=SwaggerUIBundle({{
                    url: "/swagger.json",
                    dom_id: "#swagger-ui",
                    deepLinking: true,
                    presets: [
                        SwaggerUIBundle.presets.apis
                    ],
                    layout: "BaseLayout"
                }})
            }}
        </script>
    </body>
</html>"""
    return HttpResponse(html)
