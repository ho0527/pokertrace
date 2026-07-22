"""
GTO 生成腳本寫出前端檔之前的備份 helper。

依 AGENTS.md 的備份規則：修改既有檔案前先備份成 {檔名}_old_t{流水號}.{副檔名}，
流水號取同目錄既有 old 檔的下一號。這些腳本會直接覆寫版控中的 frontend/*.js，
沒備份的話上一版產物就直接不見了。
"""
import os
import re
import shutil


def backup_existing(path):
    """path 已存在就先複製成 {檔名}_old_t{下一號}.{副檔名}，回傳備份路徑；
    path 不存在（全新檔案，不需備份）回傳 None。"""
    dst=None
    if os.path.exists(path):
        folder=os.path.dirname(os.path.abspath(path))
        name, ext=os.path.splitext(os.path.basename(path))
        pat=re.compile(r"^%s_old_t(\d+)%s$" % (re.escape(name), re.escape(ext)))
        last=0
        for f in os.listdir(folder):
            m=pat.match(f)
            if m:
                last=max(last, int(m.group(1)))
        dst=os.path.join(folder, "%s_old_t%d%s" % (name, last+1, ext))
        shutil.copy2(path, dst)
    return dst
