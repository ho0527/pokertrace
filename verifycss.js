// 驗證 frontend/tailwind.css 這次建置有沒有「靜默漏產出」。
//
// 為什麼需要這支：Tailwind 掃不到某個 class 時**不會報任何錯**，只會安靜地不產出，
// 建置照樣顯示 "Done"，然後畫面就壞了。content 設定寫錯（例如漏了 **/*.js、
// 路徑打錯、之後搬目錄）就是這種下場，而且不會有人立刻發現。
//
// 做法：挑一組「金絲雀 class」，每個代表一種容易出事的類別，檢查它們都有進到產出裡。
// 只要有任何一個檔案/整個目錄沒被掃到，對應的金絲雀就會消失 → 這裡就會 fail。
//
// 注意（寫新金絲雀時很容易錯）：needle 要用「CSS 選擇器裡實際跳脫後」的樣子，
// 不是你在 HTML 裡寫的樣子。例如 class="lg:grid-cols-[minmax(0,1fr)_300px]"
// 在 CSS 裡是 .lg\:grid-cols-\[minmax\(0\2c 1fr\)_300px\]
// （冒號→\: 、括號→\( 、逗號→\2c 空格）。用原樣去比對會永遠找不到 → 假警報。
//
// 用法：npm run verify:css （在 npm run build:css 之後跑）

const fs = require("fs")
const path = require("path")

const CSSPATH = path.join(__dirname, "frontend", "tailwind.css")
const MINSIZE = 20 * 1024   // 產出至少該有這麼大；異常小＝幾乎沒掃到東西

// needle 是「已跳脫」的片段，直接對產出做字串比對（避免自己重寫一套 CSS 跳脫規則）。
// 每一條都標明它在守什麼，壞掉時才知道要查哪裡。
const CANARIES = [
	{ needle: "bg-zinc-950",              guards: "基本工具類（.html 有被掃到）" },
	{ needle: "md\\:text-5xl",            guards: "響應式變體（@media 有產出）" },
	{ needle: "hover\\:bg-zinc-700",      guards: "hover 變體" },
	{ needle: "bg-rose-500\\/15",         guards: "只存在於 .js 的 class（admin.js statuscodeclass）→ content 有含 **/*.js" },
	{ needle: "border-amber-500\\/40",    guards: "只存在於 .js 的 class（broadcast.js）＋不透明度修飾" },
	{ needle: "border-emerald-400",       guards: "只存在於 .js 的 class（batchcreate.js classList.add 三元式）" },
	{ needle: "rounded-\\[28px\\]",       guards: "任意值 class" },
	{ needle: "shadow-\\[0_24px_60px",    guards: "含括號/逗號的任意值 class" },
	{ needle: "grid-cols-\\[minmax",      guards: "tool/ 子目錄有被掃到（range.html 的雙欄版面）" },
	{ needle: "backdrop-blur",            guards: "navbar 樣式" },
]

function main() {
	if (!fs.existsSync(CSSPATH)) {
		console.error("❌ 找不到 " + CSSPATH + "\n   先跑： npm run build:css")
		process.exit(1)
	}
	const css = fs.readFileSync(CSSPATH, "utf8")
	const kb = (Buffer.byteLength(css) / 1024).toFixed(1)

	const missing = []
	for (const c of CANARIES) {
		if (!css.includes(c.needle)) { missing.push(c) }
	}

	console.log("frontend/tailwind.css  " + kb + " KB")
	for (const c of CANARIES) {
		const ok = !missing.includes(c)
		console.log("  " + (ok ? "✅" : "❌") + "  " + c.needle.padEnd(26) + "  " + c.guards)
	}

	let bad = false
	if (Buffer.byteLength(css) < MINSIZE) {
		console.error("\n❌ 產出只有 " + kb + " KB（低於 " + (MINSIZE / 1024) + " KB）→ content 幾乎沒掃到東西")
		bad = true
	}
	if (missing.length) {
		console.error("\n❌ 有 " + missing.length + " 個金絲雀沒產出 → 某些檔案沒被掃描到，畫面會壞。")
		console.error("   先查 tailwind.config.js 的 content：路徑對不對、是不是漏了 ./frontend/**/*.js。")
		console.error("   （新增金絲雀時記得 needle 要用 CSS 跳脫後的樣子，不然是你自己寫錯不是建置壞掉。）")
		bad = true
	}
	if (bad) { process.exit(1) }
	console.log("\n✅ 全部通過")
}

main()
