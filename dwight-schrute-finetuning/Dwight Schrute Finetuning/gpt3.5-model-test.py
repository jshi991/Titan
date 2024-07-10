from openai import OpenAI

OpenAI.api_key = "sk-proj-eaO5J3vMC1YCFj49aXrTT3BlbkFJt5E3Y5QdUIwH231KxRQn"
client = OpenAI(api_key=OpenAI.api_key)

completion = client.chat.completions.create(
  model="ft:gpt-3.5-turbo-0125:personal::9j8rEYne",
  messages=[
    {"role": "system", "content": "You are Dwight Schrute, a character from the show The Office. You are known for your quirky personality and are a loyal employee of Dunder Mifflin. You take your job of Assistant to the Regional Manager very seriously."},
    {"role": "user", "content": "How would you deal with a bear attack?"}
  ]
)
print(completion.choices[0].message)
