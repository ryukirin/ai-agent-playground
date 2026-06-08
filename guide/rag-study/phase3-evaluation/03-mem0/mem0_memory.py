"""
Mem0 / 長期記憶レイヤー
エージェントにユーザーごとの長期記憶を持たせ、
パーソナライズされた応答を実現する。

※ Mem0のインストール: pip install mem0ai
※ LLM APIキーが必要です。
"""

# =============================================================
# 概念説明（API不要）
# =============================================================

print("=" * 60)
print(" Mem0 — エージェントの長期記憶")
print("=" * 60)
print("""
セッションを跨ぐ記憶の3つのレイヤー:

┌──────────────────────────────────────┐
│  Short-term Memory（短期記憶）        │
│  = 会話履歴（現在のセッション内）      │
│  LLMのコンテキスト窓に入る範囲        │
└──────────────────────────────────────┘
               ↓ 重要な情報を抽出
┌──────────────────────────────────────┐
│  Long-term Memory（長期記憶）         │
│  = ユーザーの嗜好、過去の決定          │
│  Mem0がベクトルDBに保存               │
└──────────────────────────────────────┘
               ↓ 必要な時に検索
┌──────────────────────────────────────┐
│  次の会話で活用                       │
│  「前回Pythonを希望されましたね」      │
└──────────────────────────────────────┘
""")

# =============================================================
# 記憶の構造
# =============================================================
print("=" * 60)
print(" 記憶の構造化")
print("=" * 60)

# Mem0が管理する記憶の例
memory_examples = [
    {
        "user_id": "user_001",
        "memory": "Pythonを主要言語として使っている",
        "category": "preference",
        "created_at": "2026-04-10",
    },
    {
        "user_id": "user_001",
        "memory": "FastAPIでバックエンドを構築中",
        "category": "project",
        "created_at": "2026-04-12",
    },
    {
        "user_id": "user_001",
        "memory": "コード例は型ヒント付きで欲しい",
        "category": "preference",
        "created_at": "2026-04-13",
    },
    {
        "user_id": "user_001",
        "memory": "前回、認証機能の実装で困っていた",
        "category": "context",
        "created_at": "2026-04-14",
    },
]

for mem in memory_examples:
    print(f"  [{mem['category']}] {mem['memory']} ({mem['created_at']})")

print(f"""
カテゴリ:
  preference — ユーザーの好み・スタイル
  project    — 取り組んでいるプロジェクト情報
  context    — 過去の会話の文脈
  fact       — ユーザーについての事実情報
""")

# =============================================================
# Mem0の使い方（APIキーがある場合）
# =============================================================
# from mem0 import Memory
#
# # 初期化
# config = {
#     "llm": {
#         "provider": "openai",
#         "config": {"model": "gpt-4o-mini"},
#     },
#     "version": "v1.1",
# }
# m = Memory.from_config(config)
#
# # --- 記憶の追加 ---
# # 会話内容からLLMが自動的に重要な情報を抽出して保存する
# m.add(
#     "Pythonが好きで、FastAPIでプロジェクトを作っています。コードは型ヒント付きがいいです。",
#     user_id="user_001",
# )
#
# # --- 記憶の検索 ---
# # クエリに関連する記憶をベクトル検索で取得
# memories = m.search("プログラミング言語の好み", user_id="user_001")
# for mem in memories:
#     print(f"  {mem['memory']} (relevance: {mem['score']:.2f})")
#
# # --- 記憶を使った回答生成 ---
# def answer_with_memory(query: str, user_id: str) -> str:
#     # 関連する記憶を検索
#     memories = m.search(query, user_id=user_id, limit=5)
#     memory_context = "\n".join([mem["memory"] for mem in memories])
#
#     # 記憶をプロンプトに含めて回答生成
#     prompt = f"""ユーザーについての記憶:
# {memory_context}
#
# 質問: {query}
#
# 上記の記憶を踏まえて、ユーザーに合わせた回答をしてください。
# """
#     return llm.invoke(prompt).content
#
# # --- 記憶の更新・削除 ---
# m.update(memory_id="xxx", data="更新後の内容")
# m.delete(memory_id="xxx")
# m.delete_all(user_id="user_001")  # ユーザーの全記憶を削除
#
# # --- 全記憶の一覧 ---
# all_memories = m.get_all(user_id="user_001")


# =============================================================
# SQLiteを使った簡易長期記憶（API不要版）
# =============================================================
import sqlite3
import json
from datetime import datetime


class SimpleMemory:
    """SQLiteベースの簡易長期記憶"""

    def __init__(self, db_path: str = ":memory:"):
        self.conn = sqlite3.connect(db_path)
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS memories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                category TEXT,
                content TEXT,
                created_at TEXT
            )
        """)
        self.conn.commit()

    def add(self, user_id: str, content: str, category: str = "general") -> None:
        self.conn.execute(
            "INSERT INTO memories (user_id, category, content, created_at) VALUES (?, ?, ?, ?)",
            (user_id, category, content, datetime.now().isoformat()),
        )
        self.conn.commit()

    def search(self, user_id: str, keyword: str = "") -> list[dict]:
        if keyword:
            cursor = self.conn.execute(
                "SELECT category, content, created_at FROM memories WHERE user_id = ? AND content LIKE ?",
                (user_id, f"%{keyword}%"),
            )
        else:
            cursor = self.conn.execute(
                "SELECT category, content, created_at FROM memories WHERE user_id = ?",
                (user_id,),
            )
        return [{"category": row[0], "content": row[1], "created_at": row[2]} for row in cursor]

    def get_all(self, user_id: str) -> list[dict]:
        return self.search(user_id)


# デモ
print("\n" + "=" * 60)
print(" SQLite簡易長期記憶のデモ")
print("=" * 60)

mem = SimpleMemory()
mem.add("user_001", "Pythonを主要言語として使っている", "preference")
mem.add("user_001", "FastAPIでバックエンドを構築中", "project")
mem.add("user_001", "コード例は型ヒント付きで欲しい", "preference")

# 全記憶を表示
print("\n  全記憶:")
for m_item in mem.get_all("user_001"):
    print(f"    [{m_item['category']}] {m_item['content']}")

# キーワード検索
print("\n  「Python」で検索:")
for m_item in mem.search("user_001", "Python"):
    print(f"    [{m_item['category']}] {m_item['content']}")

print(f"""
  簡易版 vs Mem0:
  ┌──────────┬─────────────────┬─────────────────┐
  │          │ SimpleMemory     │ Mem0             │
  │ 検索     │ キーワード(LIKE)  │ ベクトル検索      │
  │ 抽出     │ 手動で追加       │ LLMが自動抽出     │
  │ 更新     │ 手動            │ 自動で統合・更新   │
  │ コスト   │ 無料            │ LLM API必要       │
  └──────────┴─────────────────┴─────────────────┘

  本番ではMem0のベクトル検索 + LLM自動抽出が圧倒的に便利。
  しかし概念理解にはSimpleMemoryで十分。
""")
