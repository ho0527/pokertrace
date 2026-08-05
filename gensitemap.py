# -*- coding: utf-8 -*-
"""
sitemap.xml 產生器 + 維護中工具 noindex 同步

單一資料來源是 frontend/tooldata.js：
  - TOOLITEMLIST            全部工具（目前 85 個）
  - TOOLMAINTENANCEOFFLIST  已解禁、正式站看得到的工具（白名單）

正式站 pokertrace.net 只顯示白名單裡的工具，其餘一律當「維護中」整個隱藏
（見 tooldata.js 的 pttoolitemvisible）。但那些頁面檔案還在、網址直接打得開，
所以搜尋引擎一旦從外部發現就會索引到半成品。這支腳本負責讓兩件事跟白名單一致：

  1. sitemap.xml 只列白名單工具 + 固定的靜態頁
  2. 非白名單的工具頁加上 <meta name="robots" content="noindex,follow">
     白名單裡的工具頁則把該標籤移除

用法：解禁工具時把它從 tooldata.js 的 TOOLMAINTENANCEOFFLIST 移除後，重跑一次

    python gensitemap.py            # 實際寫入
    python gensitemap.py --dry-run  # 只印出會做什麼，不寫檔
"""

import datetime
import os
import re
import sys

# Windows 主控台預設 cp1252，中文訊息會直接炸掉
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = os.path.dirname(os.path.abspath(__file__))
TOOLDATA = os.path.join(ROOT, "frontend", "tooldata.js")
SITEMAP = os.path.join(ROOT, "sitemap.xml")
BASEURL = "https://pokertrace.net"

# 非工具的靜態頁：(相對網址, priority)。根首頁用空字串代表 https://pokertrace.net/
STATICPAGE = [
    ("", "1.0", os.path.join(ROOT, "index.html")),
    ("frontend/toollist.html", "0.9", os.path.join(ROOT, "frontend", "toollist.html")),
    ("frontend/guide.html", "0.6", os.path.join(ROOT, "frontend", "guide.html")),
    ("frontend/contact.html", "0.6", os.path.join(ROOT, "frontend", "contact.html")),
    ("frontend/terms.html", "0.6", os.path.join(ROOT, "frontend", "terms.html")),
    ("frontend/privacy.html", "0.6", os.path.join(ROOT, "frontend", "privacy.html")),
]
TOOLPRIORITY = "0.7"

# 這行結尾的註解是移除時的辨識標記，不要改
NOINDEXMARK = "pt-noindex"
NOINDEXTAG = (
    '<meta name="robots" content="noindex,follow">'
    "<!-- " + NOINDEXMARK + ": 維護中工具，解禁後重跑 gensitemap.py 會自動移除 -->"
)


def readtext(path):
    with open(path, "r", encoding="utf-8", newline="") as f:
        return f.read()


def writetext(path, text):
    with open(path, "w", encoding="utf-8", newline="") as f:
        f.write(text)


def parsetooldata():
    """從 tooldata.js 取出全部工具 href 與已解禁白名單"""
    source = readtext(TOOLDATA)

    alltool = re.findall(r'href:"(tool/[^"]+\.html)"', source)

    match = re.search(
        r"const\s+TOOLMAINTENANCEOFFLIST\s*=\s*\[(.*?)\]", source, re.S
    )
    if not match:
        raise SystemExit("tooldata.js 找不到 TOOLMAINTENANCEOFFLIST，格式可能改了")
    released = re.findall(r'"(tool/[^"]+\.html)"', match.group(1))

    # 白名單裡若有 tooldata already 不存在的工具，提早喊出來，不要靜靜漏掉
    unknown = [h for h in released if h not in alltool]
    if unknown:
        raise SystemExit("TOOLMAINTENANCEOFFLIST 有 TOOLITEMLIST 裡不存在的項目: " + ", ".join(unknown))

    # 保持 TOOLITEMLIST 的原始順序，sitemap 才有穩定的 diff
    visible = [h for h in alltool if h in released]
    hidden = [h for h in alltool if h not in released]
    return alltool, visible, hidden


def lastmod(path):
    """用檔案實際修改時間當 lastmod，比手寫日期誠實"""
    if not os.path.exists(path):
        return None
    stamp = os.path.getmtime(path)
    return datetime.date.fromtimestamp(stamp).isoformat()


def buildsitemap(visible):
    entry = []

    for relurl, priority, path in STATICPAGE:
        if not os.path.exists(path):
            print("  跳過（檔案不存在）: " + relurl)
            continue
        entry.append((BASEURL + "/" + relurl, lastmod(path), priority))

    for href in visible:
        path = os.path.join(ROOT, "frontend", href.replace("/", os.sep))
        if not os.path.exists(path):
            print("  跳過（檔案不存在）: " + href)
            continue
        entry.append((BASEURL + "/frontend/" + href, lastmod(path), TOOLPRIORITY))

    line = ['<?xml version="1.0" encoding="UTF-8"?>']
    line.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    for loc, mod, priority in entry:
        line.append("\t<url>")
        line.append("\t\t<loc>" + loc + "</loc>")
        if mod:
            line.append("\t\t<lastmod>" + mod + "</lastmod>")
        line.append("\t\t<priority>" + priority + "</priority>")
        line.append("\t</url>")
    line.append("</urlset>")
    return "\n".join(line) + "\n", len(entry)


def stripnoindex(text):
    """移除先前插入的 noindex 行（整行刪掉，含前導縮排與換行）"""
    return re.sub(r"[ \t]*<meta name=\"robots\"[^\n]*" + NOINDEXMARK + r"[^\n]*\r?\n", "", text)


def addnoindex(text, path):
    """插在 viewport meta 之後，沿用同一行的縮排與換行風格"""
    match = re.search(r"([ \t]*)<meta name=\"viewport\"[^\n]*(\r?\n)", text)
    if not match:
        print("  略過（找不到 viewport meta）: " + path)
        return text, False
    indent = match.group(1)
    eol = match.group(2)
    insert = indent + NOINDEXTAG + eol
    at = match.end()
    return text[:at] + insert + text[at:], True


def syncnoindex(hidden, visible, dryrun):
    added = 0
    removed = 0
    for href in hidden + visible:
        path = os.path.join(ROOT, "frontend", href.replace("/", os.sep))
        if not os.path.exists(path):
            continue
        before = readtext(path)
        after = stripnoindex(before)
        had = after != before

        if href in hidden:
            after, ok = addnoindex(after, href)
            if ok and not had:
                added = added + 1
        elif had:
            removed = removed + 1

        if after != before and not dryrun:
            writetext(path, after)
    return added, removed


def main():
    dryrun = "--dry-run" in sys.argv

    alltool, visible, hidden = parsetooldata()
    print("工具總數 %d：已解禁 %d、維護中 %d" % (len(alltool), len(visible), len(hidden)))

    print("\n[sitemap.xml]")
    xml, count = buildsitemap(visible)
    if dryrun:
        print("  會寫入 %d 筆 URL（dry-run，未寫檔）" % count)
    else:
        writetext(SITEMAP, xml)
        print("  已寫入 %d 筆 URL" % count)

    print("\n[noindex 同步]")
    added, removed = syncnoindex(hidden, visible, dryrun)
    print("  新增 noindex %d 頁、移除 noindex %d 頁%s" % (added, removed, "（dry-run，未寫檔）" if dryrun else ""))

    if visible:
        print("\n已解禁工具：" + ", ".join(h.replace("tool/", "").replace(".html", "") for h in visible))


main()
