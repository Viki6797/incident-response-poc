# create_env.py
import json

# Read your Firebase key
with open('firebase-key.json', 'r') as f:
    firebase_data = json.load(f)

# Convert to single-line JSON string
single_line_json = json.dumps(firebase_data)
print("\n=== COPY THIS STRING FOR RENDER.COM ===\n")
print(single_line_json)
print("\n=======================================\n")

# Also create a .env.example file
with open('.env.example', 'w') as f:
    f.write(f'FIREBASE_CREDENTIALS_JSON={single_line_json}\n')

print("✅ Created .env.example file (for reference only)")