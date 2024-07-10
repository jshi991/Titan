from openai import OpenAI

OpenAI.api_key = "sk-proj-eaO5J3vMC1YCFj49aXrTT3BlbkFJt5E3Y5QdUIwH231KxRQn"
client = OpenAI(api_key=OpenAI.api_key)

client.fine_tuning.jobs.create(
  training_file="file-9sS3DyFhCChwg4YIyCNtc583", 
  model="gpt-3.5-turbo"
)