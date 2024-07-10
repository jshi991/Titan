from datasets import load_dataset, DatasetDict
from transformers import GPT2LMHeadModel, GPT2Tokenizer, Trainer, TrainingArguments
import numpy as np

# Load your dataset
dataset_dict = load_dataset('huggingartists/taylor-swift')

# Check available splits
print("Available splits:", dataset_dict.keys())

# If all data is in 'train', split it into train and test
if 'train' in dataset_dict:
    dataset = dataset_dict['train']
    train_test_split = dataset.train_test_split(test_size=0.2)  # 20% for testing
    dataset_dict = DatasetDict({
        'train': train_test_split['train'],
        'test': train_test_split['test']
    })

# Verify the new splits
print("New splits:", dataset_dict.keys())

# Load the tokenizer
tokenizer = GPT2Tokenizer.from_pretrained('gpt2')

# Set the pad_token to eos_token
tokenizer.pad_token = tokenizer.eos_token

# Tokenize the dataset
def tokenize_function(examples):
    return tokenizer(examples['text'], truncation=True, padding='max_length', max_length=512)

tokenized_datasets = dataset_dict.map(tokenize_function, batched=True, remove_columns=["text"])

# Add labels for computing loss
def add_labels(examples):
    examples['labels'] = examples['input_ids'].copy()
    return examples

tokenized_datasets = tokenized_datasets.map(add_labels, batched=True)

# Set the format to PyTorch tensors
tokenized_datasets.set_format(type='torch', columns=['input_ids', 'attention_mask', 'labels'])

# Load the GPT-2 model
model = GPT2LMHeadModel.from_pretrained('gpt2')

# Define the training arguments
training_args = TrainingArguments(
    output_dir='./results',
    num_train_epochs=3,              # Change this depending on the size of your dataset and overfitting risk
    per_device_train_batch_size=2,   # Adjust based on your GPU memory
    per_device_eval_batch_size=2,    # Adjust based on your GPU memory
    warmup_steps=500,                # Number of warmup steps for learning rate scheduler
    weight_decay=0.01,               # Strength of weight decay
    logging_dir='./logs',            # Directory for storing logs
    logging_steps=10,
)

# Initialize the Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_datasets['train'],
    eval_dataset=tokenized_datasets['test']
)

# Fine-tune the model
trainer.train()

# Save the fine-tuned model
model.save_pretrained('./fine-tuned-gpt2-taylor-swift')
tokenizer.save_pretrained('./fine-tuned-gpt2-taylor-swift')
