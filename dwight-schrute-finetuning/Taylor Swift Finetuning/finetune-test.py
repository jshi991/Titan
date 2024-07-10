import torch
from transformers import  GPT2LMHeadModel

# AutoModelForCausalLM in your case
base_model = GPT2LMHeadModel.from_pretrained('gpt2')
# PeftModel.merge_and_unload() in your case
finetuned_model = GPT2LMHeadModel.from_pretrained('./fine-tuned-gpt2-taylor-swift')

for base_param, finetuned_param in zip(base_model.named_parameters(), finetuned_model.named_parameters()):
  if not torch.allclose(base_param[1], finetuned_param[1]):
    print(base_param[0])