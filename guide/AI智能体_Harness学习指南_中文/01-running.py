import os
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

load_dotenv()  # 读取同目录下的 .env,把 HF_TOKEN 等写入环境变量

client = InferenceClient(api_key=os.environ["HF_TOKEN"])
MODEL = "Qwen/Qwen2.5-72B-Instruct"   # Hugging Face 的开源模型

response = client.chat.completions.create(
    model=MODEL,
    max_tokens=1024,
    messages=[
        # 系统提示词作为第一条消息传入(system 角色)
        {"role": "system", "content": "你是一个简洁作答的助手。用粤语作答"},
        {"role": "user", "content": "今天东京天气如何?"},
    ],
)

print(response.choices[0].message.content)

# response = client.chat.completions.create(
#     model=MODEL,
#     max_tokens=1024,
#     messages=[
#         {"role": "user", "content": "读取 C:/data/report.txt 的内容并总结。"},
#     ],
# )
# print(response.choices[0].message.content)