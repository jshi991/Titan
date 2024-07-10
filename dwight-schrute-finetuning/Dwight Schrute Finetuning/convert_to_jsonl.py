import pandas as pd
import jsonlines
import json

with open('./dwight_quotes_new.json', 'r') as f:
    json_data = json.load(f)

with open('./dwight_quotes_new.jsonl', 'w') as jsonl_output:
    for entry in json_data:
        json.dump(entry, jsonl_output)
        jsonl_output.write('\n')
        