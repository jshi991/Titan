from openai import OpenAI
import time

ASSISTANT_ID = "asst_dcje6OAFpEB3cWfHE2YrxN7E"
client = OpenAI(api_key='sk-proj-XIvo4S10oaSsTRhxjsUyT3BlbkFJxqAFAMzonwqHmRFhqiAK')

thread = client.beta.threads.create(
    messages=[
        {
            'role': 'user',
            'content': 'What is your current thoughts on the state of the economy?'
        }
    ]
)

run = client.beta.threads.runs.create(thread_id=thread.id, assistant_id = ASSISTANT_ID)
print(f" Run Created: {run.id}")

while run.status != "completed":
    run = client.beta.threads.runs.retrieve(thread_id=thread.id, run_id=run.id)
    print(f"🏃 Run Status: {run.status}")
    time.sleep(1)
else:
    print(f"🏁 Run Completed!")

# Get the latest message from the thread.
message_response = client.beta.threads.messages.list(thread_id=thread.id)
messages = message_response.data

# Print the latest message.
latest_message = messages[0]
print(f"💬 Response: {latest_message.content[0].text.value}")