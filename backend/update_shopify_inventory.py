import csv
import sys
import requests
from collections import defaultdict
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(dotenv_path="C:\\xampp\\htdocs\\FTPShopify\\ShopifyTech\\backend\\.env")

# --- SHOPIFY CONFIG ---
SHOP_NAME = os.environ.get('SHOP_NAME')
ACCESS_TOKEN = os.environ.get('SHOPIFY_ACCESS_TOKEN')
API_VERSION = os.environ.get('SHOPIFY_API_VERSION', '2024-04')
BASE_URL = f"https://{SHOP_NAME}.myshopify.com/admin/api/{API_VERSION}/"
HEADERS = {
    "X-Shopify-Access-Token": ACCESS_TOKEN,
    "Content-Type": "application/json"
}

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
        if hasattr(e, 'response') and e.response is not None:
            print(f"[ERROR] Shopify response: {e.response.text}", file=sys.stderr)
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
    """Processes aggregated quantities and updates inventory for ALL variants with the same SKU"""
    success = errors = 0

    for sku, total_qty in sku_quantities.items():
        print(f"\nProcessing SKU: {sku} (Total Qty: {total_qty})")

        # Find ALL inventory_item_ids for this SKU across all products/pages
        inventory_item_ids = []
        endpoint = 'products.json?limit=250'
        while endpoint:
            data = shopify_request('GET', endpoint)
            if not data or not data.get('products'):
                break

            for product in data.get('products', []):
                for variant in product.get('variants', []):
                    print(f"[DEBUG] Checking variant SKU: {variant.get('sku')}")
                    if variant.get('sku') == sku:
                        inventory_item_ids.append(variant.get('inventory_item_id'))

            # Handle cursor-based pagination
            link = None
            try:
                link = requests.get(BASE_URL + endpoint, headers=HEADERS).headers.get('Link')
            except Exception:
                pass
            if link and 'rel="next"' in link:
                import re
                match = re.search(r'<[^>]+page_info=([^&>]+)[^>]*>; rel="next"', link)
                if match:
                    page_info = match.group(1)
                    endpoint = f'products.json?limit=250&page_info={page_info}'
                else:
                    endpoint = None
            else:
                endpoint = None

        if not inventory_item_ids:
            print(f"[ERROR] SKU not found: {sku}")
            errors += 1
            continue

        # For each inventory_item_id, update all locations
        for item_id in inventory_item_ids:
            locations = shopify_request('GET', f'inventory_levels.json?inventory_item_ids={item_id}')
            if not locations or not locations.get('inventory_levels'):
                print(f"[ERROR] No locations found for SKU: {sku} (item_id: {item_id})")
                errors += 1
                continue

            for loc in locations['inventory_levels']:
                payload = {
                    'location_id': loc['location_id'],
                    'inventory_item_id': item_id,
                    'available': total_qty
                }
                print("Payload:", payload)
                result = shopify_request('POST', 'inventory_levels/set.json', payload)
                if result:
                    print(f"[SUCCESS] Updated {sku} (item_id: {item_id}) to {total_qty} at location {loc['location_id']}")
                    success += 1
                else:
                    errors += 1

    return success, errors

def main():
    # Prefer command-line argument if provided
    csv_path = sys.argv[1] if len(sys.argv) > 1 else os.getenv("CSV_PATH")
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
    try:
        os.remove(csv_path)
    except Exception:
        pass

    return 0 if errors == 0 else 1

if __name__ == "__main__":
    sys.exit(main())

