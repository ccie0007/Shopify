import csv
import sys
import requests
from collections import defaultdict
from ftplib import FTP
import os
from dotenv import load_dotenv
# Load environment variables from .env file
load_dotenv(dotenv_path="C:\\xampp\\htdocs\\FTPShopify\\ShopifyTech\\.env")

# --- FTP CONFIG ---
FTP_HOST = os.getenv("FTP_HOST")
FTP_USER = os.getenv("FTP_USER")
FTP_PASS = os.getenv("FTP_PASS")
FTP_CSV_PATH = os.getenv("FTP_CSV_PATH", "/stock_update.csv")
LOCAL_CSV_PATH = os.getenv("CSV_PATH", "C:\\xampp\\htdocs\\FTPShopify\\ShopifyTech\\backend\\stock_update.csv")  # Local temp file

# --- SHOPIFY CONFIG ---
SHOP_NAME = "techguru2025"
ACCESS_TOKEN = os.getenv("SHOPIFY_ACCESS_TOKEN")
if not ACCESS_TOKEN:
    print("[ERROR] SHOPIFY_ACCESS_TOKEN not set in environment.", file=sys.stderr)
    sys.exit(1)
API_VERSION = "2025-07"
BASE_URL = f"https://{SHOP_NAME}.myshopify.com/admin/api/{API_VERSION}/"
HEADERS = {
    "X-Shopify-Access-Token": ACCESS_TOKEN,
    "Content-Type": "application/json"
}

def download_csv_from_ftp():
    try:
        print("Connecting to FTP:", FTP_HOST)
        with FTP(FTP_HOST) as ftp:
            ftp.login(FTP_USER, FTP_PASS)
            print("Downloading:", FTP_CSV_PATH, "to", LOCAL_CSV_PATH)
            with open(LOCAL_CSV_PATH, "wb") as f:
                ftp.retrbinary(f"RETR {FTP_CSV_PATH}", f.write)
        print(f"[INFO] Downloaded CSV from FTP to {LOCAL_CSV_PATH}")
        return LOCAL_CSV_PATH
    except Exception as e:
        print(f"[ERROR] FTP download failed: {e}", file=sys.stderr)
        return None

def shopify_request(method, endpoint, data=None):
    try:
        response = requests.request(
            method,
            BASE_URL + endpoint,
            headers=HEADERS,
            json=data,
            timeout=30
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"[ERROR] API request failed: {str(e)}", file=sys.stderr)
        return None

def aggregate_quantities(csv_path):
    """Aggregates quantities by SKU from CSV"""
    quantities = defaultdict(int)
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    sku = row['SKU'].strip()
                    qty = int(row['Quantity'])
                    quantities[sku] += qty
                except (KeyError, ValueError):
                    continue
        return quantities
    except Exception as e:
        print(f"[ERROR] CSV processing failed: {str(e)}", file=sys.stderr)
        return None

def update_inventory(sku_quantities):
    """Processes aggregated quantities and updates inventory"""
    success = errors = 0
    
    for sku, total_qty in sku_quantities.items():
        print(f"\nProcessing SKU: {sku} (Total Qty: {total_qty})")
        
        # Get inventory item ID
        item_ids = []
        cursor = None
        while True:
            endpoint = 'products.json?limit=250' + (f'&page_info={cursor}' if cursor else '')
            data = shopify_request('GET', endpoint)
            if not data:
                break

            for product in data.get('products', []):
                for variant in product.get('variants', []):
                    if variant.get('sku') == sku:
                        item_ids.append(variant.get('inventory_item_id'))

            # Pagination handling
            link = data.get('link', {}).get('headers', {}).get('link', '')
            cursor = link.split('page_info=')[1].split('>')[0] if 'rel="next"' in link else None
            if not cursor:
                break

        if not item_ids:
            print(f"[ERROR] SKU not found: {sku}")
            errors += 1
            continue

        # For each matching inventory item, update all locations
        for item_id in item_ids:
            locations = shopify_request('GET', f'inventory_levels.json?inventory_item_ids={item_id}')
            if not locations or not locations.get('inventory_levels'):
                print(f"[ERROR] No locations found for SKU: {sku}")
                errors += 1
                continue

            for loc in locations['inventory_levels']:
                if shopify_request('POST', 'inventory_levels/set.json', {
                    'location_id': loc['location_id'],
                    'inventory_item_id': item_id,
                    'available': total_qty
                }):
                    print(f"[SUCCESS] Updated {sku} to {total_qty} at location {loc['location_id']}")
                    success += 1
                else:
                    errors += 1
    
    return success, errors

def main():
    csv_path = os.getenv("CSV_PATH")
    if not csv_path or not os.path.exists(csv_path):
        print("[ERROR] No uploaded CSV file found.", file=sys.stderr)
        return 1
    print(f"[INFO] Using uploaded CSV: {csv_path}")

    # Step 2: Aggregate quantities
    sku_quantities = aggregate_quantities(csv_path)
    if not sku_quantities:
        return 1

    # Step 3: Update inventory
    success, errors = update_inventory(sku_quantities)
    print(f"\nFinal Result: {success} successful updates, {errors} errors")

    # Optional: Clean up local file
    # Comment out the next lines if you do not want to delete the source file
    # try:
    #     os.remove(csv_path)
    # except Exception:
    #     pass

    return 0 if errors == 0 else 1

if __name__ == "__main__":
    sys.exit(main())

