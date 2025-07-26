import requests
import os
from dotenv import load_dotenv

load_dotenv()

SHOP_NAME = os.getenv('SHOP_NAME')
ACCESS_TOKEN = os.getenv('ACCESS_TOKEN')
API_VERSION = os.getenv('API_VERSION', '2025-07')

BASE_URL = f"https://{SHOP_NAME}.myshopify.com/admin/api/{API_VERSION}/locations.json"

headers = {
    "X-Shopify-Access-Token": ACCESS_TOKEN,
    "Content-Type": "application/json"
}

response = requests.get(BASE_URL, headers=headers)

# Debug output
print("Status code:", response.status_code)
print("Raw response:", response.text)

# Try parsing locations if response looks okay
try:
    locations = response.json().get("locations", [])
    if not locations:
        print("No locations found.")
    else:
        for loc in locations:
            print(f"ID: {loc['id']} | Name: {loc['name']} | Address: {loc.get('address1', 'N/A')}, {loc.get('city', '')}, {loc.get('country', '')}")
except Exception as e:
    print("Error parsing response:", e)
