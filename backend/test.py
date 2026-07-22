import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "pokertrace.settings")  # ← 修改成你的設定路徑
django.setup()

from django.core.mail import send_mail

name="張威廷"
BASERUL="https://shop.chrisho.ggff.net/frontend/"
verifytoken="lNpVp87eXBOeyl7TbEWLbt3yO"
email="waeten0613@gmail.com"
# name="張威廷"
# name="張威廷"

send_mail(
	subject="請驗證您的 Email",
	message="請使用支援 HTML 的郵件軟體查看此信件。",
	html_message=f"""
		您好 {name}，<br>
		請點擊以下連結完成 Email 驗證：<br>
		<a href="{BASERUL}emailverify.html?token={verifytoken}">{BASERUL}emailverify.html?token={verifytoken}</a><br>
		皓群商城,<br>
		敬上
	""",
	from_email="chris960527ho@gmail.com",
	recipient_list=[email],
	fail_silently=False,
)
