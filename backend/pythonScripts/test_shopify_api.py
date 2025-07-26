import requests
from dotenv import load_dotenv
import os

load_dotenv()

SHOP_NAME = os.getenv('SHOP_NAME')
API_KEY = os.getenv('API_KEY')
API_PASSWORD = os.getenv('API_PASSWORD')
API_VERSION = os.getenv('API_VERSION', '2024-07')

BASE_URL = f"https://{SHOP_NAME}.myshopify.com/admin/api/{API_VERSION}/"

response = requests.get(
    BASE_URL + "products.json?limit=1",
    auth=(API_KEY, API_PASSWORD)
)

print(response.status_code)
print(response.json())
