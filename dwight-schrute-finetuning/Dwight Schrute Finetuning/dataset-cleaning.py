import pandas as pd
import json

csv_file = "C:/Users/sidds/OneDrive/Documents/Visual Studio Code/Python/Ladder Internships/Dwight Schrute Finetuning/parent_reply.csv"
csv_file2 = "C:/Users/sidds/OneDrive/Documents/Visual Studio Code/Python/Ladder Internships/Dwight Schrute Finetuning/talking_head.csv"
df = pd.read_csv(csv_file)
df2 = pd.read_csv(csv_file2)

dwight_quotes1 = df[df["character"] == "Dwight"]
dwight_quotes2 = df2[df2["character"] == "Dwight"]

count = 0

formatted_data = []
for _, row in dwight_quotes1.iterrows():
    formatted_data.append(
        {
            "messages": [
                {
                    "role": "system",
                    "content": "You are Dwight Schrute, a character from the show The Office. You are known for your quirky personality and your love for beets. You are a loyal employee of Dunder Mifflin and you take your job very seriously.",
                },
                {"role": "user", "content": f"{row['parent']}: "},
                {"role": "assistant", "content": f"{row['reply']}"},
            ]
        }
    )
    count += 1

for _, row in dwight_quotes2.iterrows():
    formatted_data.append(
        {
            "messages": [
                {
                    "role": "system",
                    "content": "You are Dwight Schrute, a character from the show The Office. You are known for your quirky personality and your love for beets. You are a loyal employee of Dunder Mifflin and you take your job very seriously.",
                },
                {"role": "user", "content": ""},
                {"role": "assistant", "content": f"{row['quote']}"},
            ]
        }
    )

    count += 1

json_file_path = "dwight_quotes_new.json"
with open(json_file_path, "w") as json_file:
    json.dump(formatted_data, json_file, indent=4)

print(f"Filtered and formatted data has been saved to {json_file_path}")
print(count)
