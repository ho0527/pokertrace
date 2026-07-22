"""
GTO 批次求解的標準情境清單（雙方 range、計分牌、下注尺寸）。
獨立成一個模組，讓 gtoworker.py 和 gtomanifest.py 都能匯入同一份清單，不用維護兩份。
"""

# ---- 手刻的標準情境 ----
SCENARIOS = [
    {
        "name": "BTNvsBB_SRP",
        "ooprange": "22+,A2s+,K9s+,QTs+,JTs,T9s,98s,AJo+,KQo",  # BB（OOP）防守後的 range
        "iprange": "22+,A2s+,K9s+,Q9s+,J9s+,T8s+,A9o+,KTo+,QJo",  # BTN（IP）開池 range
        "pot": 10.0, "stack": 40.0, "betsizes": [0.33, 0.75], "raise": True,
    },
    {
        "name": "COvsBB_SRP",
        "ooprange": "22+,A2s+,K7s+,Q9s+,J9s+,T8s+,A8o+,KTo+,QTo+",
        "iprange": "33+,A5s+,K9s+,Q9s+,J9s+,T9s,A9o+,KJo+",
        "pot": 10.0, "stack": 30.0, "betsizes": [0.5], "raise": True,
    },
    {
        "name": "SBvsBTN_3betpot",
        "ooprange": "TT+,AQs+,AKo",       # SB 3bet 後被 call 的 range（較窄）
        "iprange": "77+,ATs+,KQs,AJo+",   # BTN call 3bet 的 range
        "pot": 20.0, "stack": 60.0, "betsizes": [0.5, 1.0], "raise": False,
    },
    {
        "name": "UTGvsBB_SRP",
        "ooprange": "22+,A2s+,K8s+,QTs+,JTs,T9s,98s,87s,ATo+,KQo",  # BB 防守 UTG 開池（深碼較緊）
        "iprange": "77+,ATs+,KJs+,QJs,AJo+,KQo",                    # UTG 開池 range
        "pot": 10.0, "stack": 100.0, "betsizes": [0.33, 0.66], "raise": True,
    },
    {
        "name": "HJvsBB_SRP",
        "ooprange": "22+,A2s+,K8s+,Q9s+,J9s+,T8s+,98s,A9o+,KTo+",
        "iprange": "55+,A8s+,K9s+,QTs+,JTs,T9s,98s,ATo+,KJo+",
        "pot": 10.0, "stack": 75.0, "betsizes": [0.5], "raise": True,
    },
    {
        "name": "SBvsBB_SRP",
        "ooprange": "22+,A2s+,K5s+,Q8s+,J8s+,T8s+,98s,87s,A8o+,KTo+,QTo+",  # SB 開小池 range
        "iprange": "22+,A2s+,K2s+,Q4s+,J6s+,T6s+,96s+,86s+,75s+,64s,53s,A2o+,K8o+,Q9o+,J9o+,T9o",  # BB 防守
        "pot": 10.0, "stack": 50.0, "betsizes": [0.5, 1.0], "raise": True,
    },
    {
        "name": "BBvsBTN_3betpot",
        "ooprange": "QQ+,AKs,AKo",        # BB 3bet BTN 開池、被 call
        "iprange": "88+,AJs+,KQs,AQo+",   # BTN call 3bet 的 range
        "pot": 20.0, "stack": 50.0, "betsizes": [0.5, 1.0], "raise": False,
    },
    {
        "name": "COvsBTN_3betpot",
        "ooprange": "JJ+,AQs+,AKo",       # CO 3bet BTN 開池、被 call
        "iprange": "99+,ATs+,KQs,AQo+",   # BTN call 3bet 的 range
        "pot": 20.0, "stack": 55.0, "betsizes": [0.75], "raise": False,
    },
]

# ---- 位置對位置全配對（自動生成，不手刻每一組 range） ----
# 開池方 range 沿用 frontend/gtodata.js 的 GTORFI（9-max 100bb），跟注方沒有現成的
# 每對位精算防守表，用「跟注方自己的開池 range」當近似（常見簡化：假設這個位置面對
# 更早位置的開池時，大致用自己會開池的牌去跟注）。這是參考近似，不是逐對 solver 精算。
RFIOPEN = {
    "UTG": "77+,ATs+,KTs+,QTs+,JTs,AJo+,KQo",
    "UTG1": "66+,A9s+,KTs+,QTs+,JTs,T9s,AJo+,KQo",
    "MP": "55+,A8s+,K9s+,QTs+,JTs,T9s,98s,ATo+,KJo+,QJo",
    "LJ": "44+,A7s+,K9s+,Q9s+,J9s+,T9s,98s,87s,ATo+,KJo+,QJo",
    "HJ": "33+,A5s+,K8s+,Q9s+,J9s+,T8s+,98s,87s,76s,A9o+,KTo+,QTo+,JTo",
    "CO": "22+,A2s+,K8s+,Q9s+,J9s+,T8s+,97s+,87s,76s,65s,A8o+,KTo+,QTo+,JTo",
    "BTN": "22+,A2s+,K5s+,Q7s+,J8s+,T8s+,97s+,86s+,75s+,65s,54s,A5o+,K9o+,Q9o+,J9o+,T9o",
}
NONBLIND_ORDER = ["UTG", "UTG1", "MP", "LJ", "HJ", "CO", "BTN"]   # preflop 行動順序（早到晚）

# BB 防守表：沿用之前已經手刻過的 UTG/HJ/CO/BTN，缺的 UTG1/MP/LJ 用內插補齊
BBDEFEND = {
    "UTG": ("22+,A2s+,K8s+,QTs+,JTs,T9s,98s,87s,ATo+,KQo", 100.0),
    "UTG1": ("22+,A2s+,K8s+,QTs+,JTs,T9s,98s,87s,A9o+,KQo", 100.0),
    "MP": ("22+,A2s+,K8s+,Q9s+,J9s+,T8s+,98s,87s,A9o+,KTo+", 90.0),
    "LJ": ("22+,A2s+,K8s+,Q9s+,J9s+,T8s+,98s,A9o+,KTo+", 80.0),
    "HJ": ("22+,A2s+,K8s+,Q9s+,J9s+,T8s+,98s,A9o+,KTo+", 75.0),
    "CO": ("22+,A2s+,K7s+,Q9s+,J9s+,T8s+,A8o+,KTo+,QTo+", 30.0),
    "BTN": ("22+,A2s+,K9s+,QTs+,JTs,T9s,98s,AJo+,KQo", 40.0),
}


def gen_position_pair_scenarios():
    out = []
    # 非盲注兩兩配對：開池在前、跟注在後，各自用自己的 RFI range
    for i in range(len(NONBLIND_ORDER)):
        for j in range(i + 1, len(NONBLIND_ORDER)):
            opener, caller = NONBLIND_ORDER[i], NONBLIND_ORDER[j]
            out.append({
                "name": "%svs%s_SRP" % (opener, caller),
                "ooprange": RFIOPEN[opener],   # 開池方先手，postflop 先行動
                "iprange": RFIOPEN[caller],    # 跟注方近似用自己的開池 range
                "pot": 10.0, "stack": 100.0, "betsizes": [0.66], "raise": True,
            })
    # 補 UTG1 / MP / LJ vs BB（其餘位置 vs BB 已經在上面手刻過）
    for opener in ("UTG1", "MP", "LJ"):
        bbrange, stack = BBDEFEND[opener]
        out.append({
            "name": "%svsBB_SRP" % opener,
            "ooprange": bbrange,
            "iprange": RFIOPEN[opener],
            "pot": 10.0, "stack": stack, "betsizes": [0.5], "raise": True,
        })
    return out


SCENARIOS = SCENARIOS + gen_position_pair_scenarios()
