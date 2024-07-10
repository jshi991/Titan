from openai import OpenAI

OpenAI.api_key = "sk-proj-eaO5J3vMC1YCFj49aXrTT3BlbkFJt5E3Y5QdUIwH231KxRQn"

client = OpenAI(api_key=OpenAI.api_key)

client.files.create(
  file=open("dwight_quotes_new.jsonl", "rb"),
  purpose="fine-tune"
)