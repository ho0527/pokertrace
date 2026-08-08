"""
產生 gtoresults/manifest.json（德州翻後結果庫的清單），給前端 gto.js 的翻後分頁用。

實際邏輯與格式說明都在 `gtomanifestbuild.py` —— 短牌那邊（`shortdeckworker.py`）
跑的是同一支，不要在這裡另外寫一份，兩份一模一樣的迴圈遲早會漂移。

TASK-086：格式從「一列一筆的陣列」改成「共用翻牌清單 + 對位名稱」，
7.3 MB 降到約 17 KB。原因與逐筆驗證過程見 `gtomanifestbuild.py` 的檔頭。
"""
from gtomanifestbuild import writemanifest
from gtoscenarios import SCENARIOS

RESULTSDIR="gtoresults"


def main():
    writemanifest(RESULTSDIR,[sc["name"] for sc in SCENARIOS])


if __name__ == "__main__":
    main()
