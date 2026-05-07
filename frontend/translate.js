/*
	製作人員: 賀皓群(小賀) / dc: chris0527 / line: ho960527 / email: chris960527ho@gmail.com / 電話: 0906585605

		|-------    -----    -                     -     -----  -----  -----   -------|
	   |-------    -        -            - - -          -                     -------|
	  |-------    -        -------    -          -     -----    --       --  -------|
	 |-------    -        -     -    -          -         -      --     --  -------|
	|-------    -----    -     -    -          -     -----         -----  -------|

	無授權禁止拷貝使用!
*/

const TRANSLATE={
	"zhtw": {
		"api": {
			"signin": {
				"success": "登入成功"
			},
			"signup": {
				"success": "註冊成功"
			},
			"signout": {
				"success": "登出成功"
			},
		},
		"adminuser": {
			"name": "名稱",
			"permission": "權限",
			"function": "功能區",
			"ban": "封禁",
			"delete": "刪除",
			"editpermission": "修改權限"
		},
		"navigationbar": {
			"index": "首頁",
			"signin": "登入",
			"signup": "註冊",
			"signout": "登出",
			"back": "返回",
			"main": "專案主頁",
			"adminuser": "使用者管理",
			"newproject": "新增專案",
			"newapi": "新增API"
		},
		"index": {
			"index": "首頁",
			"signin": "登入",
			"signup": "註冊",
			"adminuser": "管理使用者"
		},
		"gametype": {
			"cash": "現金局",
			"tournament": "錦標賽",
			"limited": "限時錦標賽",
		},
		"seatingtype": {
			"buyin": "買入",
			"rebuy": "重新買入",
			"leave": "離席",
		},
		"seating": {
			"CO": "關煞(CO)",
			"HJ": "劫位(HJ)",
			"BTN": "莊家(BTN)",
			"SB": "小盲",
			"BB": "大盲",
			"UTG": "槍口(UTG)",
			"UTG+1": "槍口+1",
			"UTG+2": "槍口+2",
			"MP": "中位(MP)",
			"MP+1": "中位+1",
		},
		"projectandapi": {
			"newapi": "新增api",
			"back": "返回",
			"index": "首頁",
			"signout": "登出",
			"copyrootlink": "複製根目錄連結",
			"editproject": "修改專案",
			"deleteproject": "刪除專案",
			"copylink": "複製連結",
			"editapi": "修改api",
			"deleteapi": "刪除api",
			"newproject": "新增專案",
			"projecttitle": "專案名稱",
			"projectdescription": "專案描述",
			"projectrootlink": "專案根目錄",
			"projectpermission": "專案權限",
			"projectpermissionpublic": "公開",
			"projectpermissioninvite": "邀請",
			"projectpermissionprivate": "私人",
			"projecttype": "專案權限類型",
			"projecttypeedit": "編輯",
			"projecttypeadd": "新增",
			"projecttypeview": "查看",
			"testapi": "發送測試",
			"setpermission": "設定權限"
		},
		"errorlist": {
			"ERROR_request_mimes_type_error": "檔案需為圖片",
			"ERROR_request_data_not_found": "缺少必填資料",
			"ERROR_request_data_type_error": "資料型態錯誤",
			"ERROR_password_error": "密碼錯誤",
			"ERROR_username_error": "使用者名稱錯誤",
			"ERROR_username_exist": "使用者名稱已存在",
			"ERROR_token_error": "token錯誤",
			"ERROR_token_not_found": "找不到token",
			"ERROR_no_permission": "沒有權限",
			"ERROR_user_not_found": "找不到使用者",
			"ERROR_session_not_found": "找不到場次",
			"ERROR_product_not_found": "找不到此商品",
			"ERROR_phone_exist": "手機號碼已存在",
			"ERROR_email_exist": "電子郵件已存在"
		},
		"breadcrumb": {
			"index": "專案主頁",
			"newapi": "新增API"
		},
		"warning": {
			"exitpage": "確定要離開嗎,將丟失未儲存的內容"
		},
		"type": {
			"game": {
				"HE": "德州撲克(Hold'em)",
				"O": "奧馬哈(Omaha)",
				"ST": "梭哈(Stud)",
				"MX": "混合遊戲(Mixed up)",
				"Z": "其他(Other) "
			},
			"limit": {
				"NL": "無限注(no limit)",
				"PL": "底池限注(pot limit)",
				"FL": "固定注(fixed limit)"
			},
			"stack": {
				"N": "正常(normal)",
				"D": "深籌(deep)",
				"L": "深籌(moster)",
				"S": "極深籌(super)",
				"M": "巨籌(mega)",
				"U": "極巨籌(ultra)",
			},
			"event": {
				"OD": "單日賽",
				"SA": "衛星賽",
				"ND": "多日賽"
			}
		},
		"default": "預設模式",
		"coding": "程式碼模式",
		"clearall": "清空全部",
		"reset": "重設",
		"back": "返回",
		"submit": "送出",
		"confirm": "確認",
		"clearallconfirm": "確認清空全部?",
		"clearallconfirmdescription": "此操作將清空所有內容並不能復原,請確認是否繼續?",
		"resetconfirm": "確認重設?",
		"resetconfirmdescription": "此操作將重設所有內容並不能復原,請確認是否繼續?",
		"deleteconfirm": "確認刪除",
		"deleteconfirmdescription": "此操作將刪除該項目",
		"copyed": "已複製"
	}
}