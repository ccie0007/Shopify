import csv
import sys
import requests
from collections import defaultdict
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

SHOP_NAME = os.getenv('SHOP_NAME')
ACCESS_TOKEN = os.getenv('ACCESS_TOKEN')
API_VERSION = os.getenv('API_VERSION', '2025-07')
ACTIVE_LOCATION_ID = int(os.getenv('ACTIVE_LOCATION_ID', '111007859026'))

BASE_URL = f"https://{SHOP_NAME}.myshopify.com/admin/api/{API_VERSION}/"
HEADERS = {
    "X-Shopify-Access-Token": ACCESS_TOKEN,
    "Content-Type": "application/json"
}

def shopify_request(method, endpoint, data=None, params=None):
    try:
        response = requests.request(
            method=method,
            url=BASE_URL + endpoint,
            headers=HEADERS,
            json=data,
            params=params,
            timeout=30
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"[ERROR] API request failed: {e}", file=sys.stderr)
        return None

def aggregate_quantities(csv_path):
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
        print(f"[ERROR] Failed to process CSV: {e}", file=sys.stderr)
        return None

def update_inventory(sku_quantities):
    success, errors = 0, 0

    for sku, total_qty in sku_quantities.items():
        print(f"\nProcessing SKU: {sku} (Total Qty: {total_qty})")
        item_id = None

        # Search for variant by SKU
        page = 1
        while True:
            params = {'limit': 250, 'page': page}
            response = shopify_request('GET', 'products.json', params=params)
            if not response:
                break

            for product in response.get('products', []):
                for variant in product.get('variants', []):
                    if variant.get('sku') == sku:
                        item_id = variant.get('inventory_item_id')
                        break
                if item_id:
                    break

            if item_id or len(response.get('products', [])) < 250:
                break  # Found or end of pagination
            page += 1

        if not item_id:
            print(f"[ERROR] SKU not found: {sku}")
            errors += 1
            continue

        # Fetch inventory levels
        locations = shopify_request('GET', 'inventory_levels.json', params={'inventory_item_ids': item_id})
        if not locations or not locations.get('inventory_levels'):
            print(f"[ERROR] No inventory locations found for {sku}")
            errors += 1
            continue

        updated = False
        for loc in locations['inventory_levels']:
            if loc['location_id'] != ACTIVE_LOCATION_ID:
                continue

            payload = {
                'location_id': loc['location_id'],
                'inventory_item_id': item_id,
                'available': total_qty
            }

            result = shopify_request('POST', 'inventory_levels/set.json', data=payload)
            if result:
                print(f"[SUCCESS] Updated {sku} to {total_qty} at location {loc['location_id']}")
                success += 1
                updated = True
            else:
                print(f"[ERROR] Failed to update {sku} at location {loc['location_id']}")
                errors += 1

        if not updated:
            print(f"[ERROR] SKU {sku} has no inventory at active location {ACTIVE_LOCATION_ID}")
            errors += 1

    return success, errors

def main():
    if len(sys.argv) != 2:
        print("Usage: python update_shopify_inventory.py <csv_file_path>", file=sys.stderr)
        return 1

    csv_path = sys.argv[1]
    sku_quantities = aggregate_quantities(csv_path)
    if not sku_quantities:
        return 1

    success, errors = update_inventory(sku_quantities)
    print(f"\nFinal Result: {success} successful updates, {errors} errors")
    return 0 if errors == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
