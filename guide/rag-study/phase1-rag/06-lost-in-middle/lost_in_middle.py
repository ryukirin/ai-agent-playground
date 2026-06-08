"""
Lost in the Middle 実験
LLMはコンテキストの「最初」と「最後」に注意力が集中し、中間の情報を忘れる。
情報の配置順序を変えるだけで回答精度が変わることを確認する。

※ この実験はLLM APIが必要です。
   OPENAI_API_KEY または ANTHROPIC_API_KEY を設定してください。
   APIがない場合は、概念の理解とNOTE.mdの記録で完了としてOKです。
"""

# =============================================================
# 概念のデモンストレーション（API不要）
# =============================================================

# 10件の検索結果をシミュレーション
# 正解は「答え: pymallocは512バイト以下のオブジェクト用のメモリアロケータ」
search_results = [
    "結果1: Pythonは動的型付け言語である。",
    "結果2: Pythonのリストは可変長配列として実装されている。",
    "結果3: Pythonの辞書はハッシュテーブルで実装されている。",
    "結果4: Pythonのタプルは不変（イミュータブル）なシーケンスである。",
    "結果5【正解】: pymallocは512バイト以下のオブジェクト用の専用メモリアロケータである。",
    "結果6: Pythonの文字列はUnicodeで表現される。",
    "結果7: Pythonのsetは重複を許さないコレクションである。",
    "結果8: Pythonのジェネレータはイテレータを生成する関数である。",
    "結果9: Pythonのデコレータは関数を修飾する高階関数である。",
    "結果10: Pythonのwith文はコンテキストマネージャを利用する。",
]

QUERY = "Pythonの小さなオブジェクトのメモリ割り当てはどう行われる？"


def show_arrangement(name: str, arranged: list[str]) -> None:
    """配置パターンを表示"""
    print(f"\n{'=' * 60}")
    print(f" {name}")
    print(f"{'=' * 60}")
    for i, result in enumerate(arranged, 1):
        marker = " ← 正解" if "正解" in result else ""
        print(f"  {i:2d}. {result}{marker}")

    # 正解の位置を表示
    answer_pos = next(i for i, r in enumerate(arranged, 1) if "正解" in r)
    total = len(arranged)
    if answer_pos <= 2:
        zone = "先頭付近 → LLMが見つけやすい ✓"
    elif answer_pos >= total - 1:
        zone = "末尾付近 → LLMが見つけやすい ✓"
    else:
        zone = "中間 → LLMが見落としやすい ✗"
    print(f"\n  正解の位置: {answer_pos}/{total} ({zone})")


# パターン1: 関連度順（正解が5番目 = 中間）
show_arrangement("パターン1: 関連度順（そのまま）", search_results)

# パターン2: 正解を先頭に配置
arrangement_front = [search_results[4]] + search_results[:4] + search_results[5:]
show_arrangement("パターン2: 重要情報を先頭に配置", arrangement_front)

# パターン3: 正解を末尾に配置
arrangement_back = search_results[:4] + search_results[5:] + [search_results[4]]
show_arrangement("パターン3: 重要情報を末尾に配置", arrangement_back)

# パターン4: LongContextReorder（交互配置）
# 関連度の高い順に、奇数番目を先頭から、偶数番目を末尾から配置
def long_context_reorder(results: list[str]) -> list[str]:
    """
    LangChainのLongContextReorderと同じロジック。
    重要な情報をコンテキストの先頭と末尾に配置し、
    中間には重要度の低い情報を置く。
    """
    reordered = []
    for i, result in enumerate(results):
        if i % 2 == 0:
            reordered.insert(len(reordered) // 2, result)  # 中間に挿入
        else:
            reordered.append(result)  # 末尾に追加
    # 先頭と末尾に重要度の高いものが来るように反転調整
    return results[::2][::-1] + results[1::2]


reordered = long_context_reorder(search_results)
show_arrangement("パターン4: LongContextReorder（交互配置）", reordered)


# =============================================================
# LLMを使った実験（APIキーがある場合のみ）
# =============================================================
# import os
# from langchain_openai import ChatOpenAI
#
# llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
#
# def ask_with_context(context_docs: list[str], query: str) -> str:
#     context = "\n".join(context_docs)
#     prompt = f"""以下のコンテキストを使って質問に答えてください。
#
# コンテキスト:
# {context}
#
# 質問: {query}
# """
#     return llm.invoke(prompt).content
#
# # 各配置パターンでLLMに質問し、正しく答えられるか比較
# for name, arrangement in [
#     ("関連度順", search_results),
#     ("先頭配置", arrangement_front),
#     ("末尾配置", arrangement_back),
#     ("LongContextReorder", reordered),
# ]:
#     answer = ask_with_context(arrangement, QUERY)
#     print(f"\n{name}: {answer[:100]}...")


# =============================================================
# まとめ
# =============================================================
print(f"\n{'=' * 60}")
print(" まとめ: Lost in the Middle 対策")
print(f"{'=' * 60}")
print()
print("  LLMの注意力の分布:")
print("  ┌─────────────────────────────────┐")
print("  │ 高 ████              ████ 高   │")
print("  │     ████          ████         │")
print("  │       ████      ████           │")
print("  │         ████  ████             │")
print("  │ 低        ██████       低      │")
print("  └─────────────────────────────────┘")
print("    先頭    ← 中間 →    末尾")
print()
print("  対策:")
print("  1. 最も重要な情報を先頭または末尾に配置する")
print("  2. LongContextReorder で自動的に交互配置する")
print("  3. Rerankingで上位に絞り、渡す件数自体を減らす（最も効果的）")
