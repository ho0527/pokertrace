// Tailwind 建置設定 —— 取代原本每頁的 Play CDN（https://cdn.tailwindcss.com）。
//
// 重要（踩過的雷，別改壞）：
//
// 1. content 一定要含 .js：有 108 個 .js 檔在 template literal 裡寫 Tailwind class
//    （例如 admin.js 的 statuscodeclass() 回傳 "bg-rose-500/15 text-rose-200"）。
//    只掃 .html 會大規模掉樣式。
//
// 2. 備份檔（_old_t）沒有排除，是刻意的：實測「有排除」與「沒排除」兩份產出
//    byte 完全相同（md5 一致）——備份檔裡的 class 都是現役檔案的子集，排不排都一樣，
//    多一條規則只是多一個會寫錯的地方。
//
// 3. 漏產出不會有任何錯誤訊息，只會視覺壞掉（Tailwind 找不到 class 不會報錯，
//    只是不產出）→ 改完請跑 npm run verify:css。
//
// Tailwind 的掃描器是純文字比對（不解析 JS），所以
// classList.add(cond?"border-emerald-400":"border-zinc-800") 這種字面字串抓得到；
// 但 "bg-" 加變數這種執行期拼接抓不到 —— 目前專案沒有這種寫法，請保持。
module.exports = {
	content: [
		"./frontend/**/*.html",
		"./frontend/**/*.js",
	],
	// 全站沿用 Tailwind 預設主題（原本 Play CDN 也沒有 tailwind.config），
	// 只覆寫字體堆疊（TASK-012）。
	//
	// Tailwind 預設的 sans 是 ui-sans-serif, system-ui, sans-serif, ...，完全沒有中文字體。
	// 在沒有安裝合適中文字型的環境（部分 Windows、Linux、某些行動裝置），中文會落到
	// 系統預設字型，字重與字寬和設計不符——這是「看起來廉價」最常見的成因之一。
	// ai/skills/design-craft.md 紀律 5 明文要求中文專案的 stack 必須含
	// 'PingFang TC'（Apple）與 'Microsoft JhengHei'（Windows）。
	//
	// 放在 extend 底下而不是直接覆寫 theme.fontFamily：這樣 mono/serif 仍沿用 Tailwind 預設，
	// 只有 sans 被換掉。中文字體排在英文字體之後，讓拉丁字母仍走系統 UI 字型。
	theme: {
		extend: {
			fontFamily: {
				sans: [
					"ui-sans-serif",
					"system-ui",
					"-apple-system",
					"Segoe UI",
					"Roboto",
					"PingFang TC",
					"Microsoft JhengHei",
					"Noto Sans TC",
					"sans-serif",
					"Apple Color Emoji",
					"Segoe UI Emoji",
					"Segoe UI Symbol",
					"Noto Color Emoji"
				]
			}
		}
	},
	plugins: [],
}
