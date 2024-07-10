from openai import OpenAI
from flask import Flask, request, jsonify
import time
import os

app = Flask(__name__)

ASSISTANT_ID = "asst_dcje6OAFpEB3cWfHE2YrxN7E"
client = OpenAI(api_key='sk-proj-XIvo4S10oaSsTRhxjsUyT3BlbkFJxqAFAMzonwqHmRFhqiAK')

@app.route("/")
def home():
    return "Hello, World!"

@app.route("/upload_data", methods=["POST"])
def upload_data():
    if request.content_type == 'application/json':
        data = request.get_json()
        print("Received JSON data:", data)
        # Process JSON data
        response = {"status": "success", "data_type": "json", "data": data}

    elif request.content_type == 'text/plain':
        data = request.get_data(as_text=True)
        print("Received text data:", data)
        # Process text data
        response = {"status": "success", "data_type": "text", "data": data}

    elif request.content_type == 'text/csv':
        data = request.get_data(as_text=True)
        print("Received CSV data:", data)
        # Process CSV data
        csv_reader = csv.reader(io.StringIO(data))
        csv_data = [row for row in csv_reader]
        response = {"status": "success", "data_type": "csv", "data": csv_data}

    else:
        response = {"status": "error", "message": "Unsupported content type"}

    return jsonify(response)
    
@app.route("/ask/<user_question>", methods=["GET"])
def ask(user_question):
    # Get query parameter from the GET request

    payload = [
        {
            'role': 'user',
            'content': user_question
        }
    ]

    thread = client.beta.threads.create(
        messages=payload
    )

    run = client.beta.threads.runs.create(thread_id=thread.id, assistant_id=ASSISTANT_ID, instructions="Act like donald trump essentric billionaire and conservatvive politician")
    print(f"Run Created: {run.id}")

    while run.status != "completed":
        run = client.beta.threads.runs.retrieve(thread_id=thread.id, run_id=run.id)
        print(f"🏃 Run Status: {run.status}")
        time.sleep(1)

    print(f"🏁 Run Completed!")

    # Get the latest message from the thread.
    message_response = client.beta.threads.messages.list(thread_id=thread.id)
    messages = message_response.data

    # Print the text content of the latest message.
    latest_message = messages[0]
    text_content = latest_message['content']
    print(f"💬 Response: {text_content}")

    return jsonify({"response": text_content})

if __name__ == "__main__":
    app.run(debug=True)

