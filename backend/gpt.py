from datasets import load_dataset
import os
from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments, Trainer, pipeline

base_dir = os.path.dirname(__file__)
data_file_path = os.path.join(base_dir, 'BattleCreekDec19_2019.txt')

# Check if the file exists
if not os.path.isfile(data_file_path):
    raise FileNotFoundError(f"The file {data_file_path} does not exist.")

# Load dataset
dataset = load_dataset('text', data_files={'train': data_file_path})
tokenizer = AutoTokenizer.from_pretrained("microsoft/CodeGPT-small-py")
max_length = 1024
def tokenize_function(examples):
    # Adjust tokenization to ensure truncation to max_length
    return tokenizer(examples['text'], padding="max_length", truncation=True, max_length=max_length)

tokenized_datasets = dataset.map(tokenize_function, batched=True)

def add_labels(examples):
    examples['labels'] = examples['input_ids'].copy()
    return examples

tokenized_datasets = tokenized_datasets.map(add_labels, batched=True)

model = AutoModelForCausalLM.from_pretrained("microsoft/CodeGPT-small-py")

training_args = TrainingArguments(
    output_dir="./results",
    overwrite_output_dir=True,
    num_train_epochs=3,
    per_device_train_batch_size=8,
    save_steps=10_000,
    save_total_limit=2,
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_datasets['train'],
    
)

trainer.train()

text_generator = pipeline('text-generation', model=model, tokenizer=tokenizer)

def generate_response(prompt, max_length=100):
    # Add context to the prompt
    context_prompt = f"{prompt}\n# You are supposed to act like the person in the given dataset, in this case it is Donald trump, a republican politicial, very successful buisnessman, and very conservative\n"
    
    # Generate response using the pipeline
    response = text_generator(context_prompt, max_length=max_length, num_return_sequences=1, no_repeat_ngram_size=2, early_stopping=True)
    
    return response[0]['generated_text']

# Example usage
prompt = "### What are your thoughts on the current state of the economy?"
response = generate_response(prompt)

print(f"Prompt: {prompt}")
print(f"Generated Response: {response}")