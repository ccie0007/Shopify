from dotenv import load_dotenv
import os

load_dotenv()

print("Shop:", os.getenv('SHOP_NAME'))
print("API Key:", os.getenv('API_KEY'))
print("API Password:", os.getenv('API_PASSWORD'))
print("API Version:", os.getenv('API_VERSION'))
