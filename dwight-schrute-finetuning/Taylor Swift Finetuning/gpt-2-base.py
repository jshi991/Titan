from transformers import GPT2LMHeadModel, GPT2Tokenizer

# Load the fine-tuned model and tokenizer
model = GPT2LMHeadModel.from_pretrained('gpt2')
tokenizer = GPT2Tokenizer.from_pretrained('gpt2')

# Function to generate text
def generate_text(prompt, max_length=50, num_return_sequences=1):
    # Tokenize the input prompt
    inputs = tokenizer(prompt, return_tensors='pt')

    # Generate text
    outputs = model.generate(
        inputs['input_ids'],
        max_length=max_length,
        num_return_sequences=num_return_sequences,
        no_repeat_ngram_size=2,
        num_beams=5,
        early_stopping=True
    )

    # Decode the generated sequences
    generated_texts = [tokenizer.decode(output, skip_special_tokens=True) for output in outputs]
    return generated_texts

# Example usage
prompt = "I love"
generated_texts = generate_text(prompt, max_length=100, num_return_sequences=1)

for i, text in enumerate(generated_texts):
    print(f"Generated Text {i+1}:\n{text}\n")
