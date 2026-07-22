"""
短牌 flop 批次求解的標準情境（雙方 range、計分牌、下注尺寸）。
range 直接沿用 shortdeckpreflow.py 生成的短牌開池範圍，轉成 eval7 能吃的逗號字串。

情境分兩塊：
  1) 前 3 組手動情境（沿用最初的定義，讓已算好的結果不失效）。
  2) gen_position_pair_scenarios()：自動補齊其餘所有位置對位（跟標準版 gtoscenarios.py 一樣齊全）。

注意：import 本模組就會建 RFI，需要 shortdeckeqmatrix.json；缺檔時 shortdeckpreflow 會給
「請先執行 python shortdeckequity.py」的友善訊息，而不是裸 FileNotFoundError。
"""
import shortdeckpreflow as sp

RFI = sp.build_rfi()   # {position: [hand labels]}


def rng(pos):
    return ",".join(RFI[pos])


# 非盲注位置的行動順序（越晚＝IP），跟標準版 gtoscenarios.py 慣例一致
NONBLIND_ORDER = ["UTG", "UTG1", "MP", "LJ", "HJ", "CO", "BTN"]


# --- 1) 手動情境：保留最初 3 組，維持既有結果有效 ---
SCENARIOS = [
    {
        "name": "BTNvsBB_SRP",
        "ooprange": rng("SB"),   # BB 沒有獨立開池範圍，用 SB 範圍近似 BB 防守（跟標準版同樣的簡化）
        "iprange": rng("BTN"),
        "pot": 10.0, "stack": 40.0, "betsizes": [0.33, 0.75], "raise": True,
    },
    {
        "name": "COvsBTN_SRP",
        "ooprange": rng("CO"),
        "iprange": rng("BTN"),
        "pot": 10.0, "stack": 50.0, "betsizes": [0.5], "raise": True,
    },
    {
        "name": "HJvsCO_SRP",
        "ooprange": rng("HJ"),
        "iprange": rng("CO"),
        "pot": 10.0, "stack": 50.0, "betsizes": [0.66], "raise": True,
    },
]


def gen_position_pair_scenarios():
    """補齊所有非盲注對位（開池者較早＝OOP、跟注者較晚＝IP）＋各位置 vs BB。
    已在手動清單裡的名字會跳過，避免重算既有結果。"""
    have = {s["name"] for s in SCENARIOS}
    out = []
    # 非盲注 vs 非盲注：所有 (i<j) 對位
    for i, opener in enumerate(NONBLIND_ORDER):
        for caller in NONBLIND_ORDER[i + 1:]:
            name = "%svs%s_SRP" % (opener, caller)
            if name in have:
                continue
            out.append({
                "name": name,
                "ooprange": rng(opener),
                "iprange": rng(caller),
                "pot": 10.0, "stack": 50.0, "betsizes": [0.5], "raise": True,
            })
    # 各位置 vs BB（BB 用 SB 範圍近似防守，開池者在 IP）
    for opener in NONBLIND_ORDER:
        name = "%svsBB_SRP" % opener
        if name in have:
            continue
        out.append({
            "name": name,
            "ooprange": rng("SB"),
            "iprange": rng(opener),
            "pot": 10.0, "stack": 50.0, "betsizes": [0.5], "raise": True,
        })
    return out


SCENARIOS = SCENARIOS + gen_position_pair_scenarios()
