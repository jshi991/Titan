import os
import torch
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from torch.utils.data import DataLoader, Dataset
from transformers import GPT2Tokenizer, GPT2LMHeadModel, AdamW, get_linear_schedule_with_warmup
import shutil

app = Flask(__name__)
CORS(app)

# Define a simple custom dataset
class TextDataset(Dataset):
    def __init__(self, texts, tokenizer, max_length):
        self.tokenizer = tokenizer
        self.texts = texts
        self.max_length = max_length

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        encoding = self.tokenizer(
            self.texts[idx],
            truncation=True,
            padding='max_length',
            max_length=self.max_length,
            return_tensors="pt"
        )
        return {key: val.squeeze(0) for key, val in encoding.items()}

# Fine-tuning function
def fine_tune(model, tokenizer, train_texts, epochs=3, batch_size=8, lr=5e-5):
    train_dataset = TextDataset(train_texts, tokenizer, max_length=512)
    train_dataloader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    
    optimizer = AdamW(model.parameters(), lr=lr)
    num_training_steps = epochs * len(train_dataloader)
    lr_scheduler = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=0,
        num_training_steps=num_training_steps
    )
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    model.train()
    
    for epoch in range(epochs):
        for batch in train_dataloader:
            batch = {key: val.to(device) for key, val in batch.items()}
            outputs = model(**batch, labels=batch["input_ids"])
            loss = outputs.loss
            loss.backward()

            optimizer.step()
            lr_scheduler.step()
            optimizer.zero_grad()
        
        print(f"Epoch {epoch + 1} completed with loss: {loss.item()}")
    
    return model

# Load pre-trained model and tokenizer
model_name = "gpt2"  # Replace with 'gpt-3.5' once available
tokenizer = GPT2Tokenizer.from_pretrained(model_name)
model = GPT2LMHeadModel.from_pretrained(model_name)

# Set pad token
tokenizer.pad_token = tokenizer.eos_token

# Directory to save the fine-tuned model
model_dir = './fine-tuned-gpt'

@app.route('/upload_data', methods=['POST'])
def upload_data():
    data = request.json
    train_texts = data.get('texts', [])
    
    if not train_texts:
        return jsonify({"error": "No texts provided for training"}), 400
    
    # Fine-tune the model
    fine_tuned_model = fine_tune(model, tokenizer, train_texts)
    
    # Save the model and tokenizer
    fine_tuned_model.save_pretrained(model_dir)
    tokenizer.save_pretrained(model_dir)
    
    return jsonify({"message": "Model fine-tuned and saved successfully"}), 200

@app.route('/download_model', methods=['GET'])
def download_model():
    # Ensure the model directory exists
    if not os.path.exists(model_dir):
        return jsonify({"error": "Model not found"}), 404

    # Zip the model directory
    zip_path = shutil.make_archive(model_dir, 'zip', model_dir)
    
    # Send the zip file to the client
    return send_from_directory(directory=os.path.dirname(zip_path), filename=os.path.basename(zip_path), as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)
