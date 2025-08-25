import csv
import sys
import requests
from collections import defaultdict
import os
from dotenv import load_dotenv
from ftplib import FTP

# ✅ Always load the .env from this script's directory
script_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(script_dir, '.env')
load_dotenv(dotenv_path=env_path)

print(" Working directory:", os.getcwd())
print(" .env path:", env_path)

# ✅ Environment variables
SHOP_NAME = os.getenv('SHOP_NAME')
ACCESS_TOKEN = os.getenv('ACCESS_TOKEN')
API_VERSION = os.getenv('API_VERSION', '2025-07')
ACTIVE_LOCATION_ID = int(os.getenv('ACTIVE_LOCATION_ID', '111007859026'))
CSV_PATH = os.getenv('CSV_PATH', '').strip()

FTP_HOST = os.getenv("FTP_HOST")
FTP_USER = os.getenv("FTP_USER")
FTP_PASS = os.getenv("FTP_PASS")
FTP_CSV_PATH = os.getenv("FTP_CSV_PATH", "/stock_update.csv")


# ✅ Debug: Print Access Token (partially)
print("ACCESS_TOKEN Loaded:", ACCESS_TOKEN[:8] + "..." if ACCESS_TOKEN else "None")
print("Length of token:", len(ACCESS_TOKEN) if ACCESS_TOKEN else "None")

# ✅ Exit early if missing creds
if not SHOP_NAME or not ACCESS_TOKEN:
    print("[❌ ERROR] SHOP_NAME or ACCESS_TOKEN missing in .env file.", file=sys.stderr)
    sys.exit(1)

# ✅ Shopify API setup
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


def aggregate_quantities_and_prices(csv_path):
    sku_data = {}
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    sku = row['SKU'].strip()
                    qty = int(row['Quantity'])
                    price = row.get('Price')
                    if price is not None and price != '':
                        price = float(price)
                    else:
                        price = None
                    if sku in sku_data:
                        sku_data[sku]['quantity'] += qty
                        # If price is present, overwrite (or keep first, your choice)
                        if price is not None:
                            sku_data[sku]['price'] = price
                    else:
                        sku_data[sku] = {'quantity': qty, 'price': price}
                    print(f"[CSV] Read SKU: {sku}, Quantity: {qty}, Price: {price}")
                except (KeyError, ValueError) as e:
                    print(f"[CSV WARNING] Skipped row due to error: {e}")
                    continue
        return sku_data
    except Exception as e:
        print(f"[ERROR] Failed to process CSV: {e}", file=sys.stderr)
        return None


def update_inventory_and_price(sku_data):
    success, errors = 0, 0

    for sku, data in sku_data.items():
        total_qty = data['quantity']
        price = data['price']
        print(f"\n Processing SKU: {sku} (Total Qty: {total_qty}, Price: {price})")
        item_id = None
        variant_id = None

        # Search for variant by SKU
        page = 1
        while True:
            params = {'limit': 250}
            response = shopify_request('GET', 'products.json', params=params)
            if not response:
                break

            for product in response.get('products', []):
                for variant in product.get('variants', []):
                    if variant.get('sku') == sku:
                        item_id = variant.get('inventory_item_id')
                        variant_id = variant.get('id')
                        break
                if item_id:
                    break

            if item_id or len(response.get('products', [])) < 250:
                break
            page += 1

        if not item_id or not variant_id:
            print(f"[ERROR] SKU not found in Shopify: {sku}")
            errors += 1
            continue

        # Update inventory
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
                print(f"[ SUCCESS] Updated {sku} to {total_qty} at location {loc['location_id']}")
                updated = True
            else:
                print(f"[ERROR] Failed to update {sku} at location {loc['location_id']}")
                errors += 1

        # Update price if provided
        if price is not None:
            price_payload = {
                "variant": {
                    "id": variant_id,
                    "price": price
                }
            }
            price_result = shopify_request('PUT', f'variants/{variant_id}.json', data=price_payload)
            if price_result:
                print(f"[ SUCCESS] Updated price for {sku} to {price}")
            else:
                print(f"[ERROR] Failed to update price for {sku}")
                errors += 1

        if updated:
            success += 1
        else:
            print(f"[WARNING] SKU {sku} not updated at active location {ACTIVE_LOCATION_ID}")
            errors += 1

    return success, errors


def download_csv_from_ftp():
    try:
        with FTP(FTP_HOST) as ftp:
            ftp.login(user=FTP_USER, passwd=FTP_PASS)
            local_file = os.path.join(script_dir, 'stock_update.csv')
            with open(local_file, 'wb') as lf:
                ftp.retrbinary('RETR ' + FTP_CSV_PATH, lf.write)
            print(f"[FTP] Downloaded latest CSV to {local_file}")
            return local_file
    except Exception as e:
        print(f"[ERROR] FTP download failed: {e}", file=sys.stderr)
        return None


def update_tracking(shop, access_token, order_number, tracking_number, carrier):
    # 1. Find the order by name (order_number)
    orders = requests.get(
        f"https://{shop}/admin/api/2023-10/orders.json?name={order_number}",
        headers={"X-Shopify-Access-Token": access_token}
    ).json().get("orders", [])
    if not orders:
        print(f"Order {order_number} not found")
        return

    order_id = orders[0]["id"]

    # 2. Create fulfillment with tracking info
    payload = {
        "fulfillment": {
            "tracking_number": tracking_number,
            "tracking_company": carrier,
            "notify_customer": True
        }
    }
    resp = requests.post(
        f"https://{shop}/admin/api/2023-10/orders/{order_id}/fulfillments.json",
        json=payload,
        headers={"X-Shopify-Access-Token": access_token}
    )
    if resp.ok:
        print(f"Tracking updated for order {order_number}")
    else:
        print(f"Failed to update tracking for order {order_number}: {resp.text}")


def main():
    # Use CSV_PATH from environment if provided (set by backend), otherwise fallback to FTP
    csv_path = os.getenv('CSV_PATH', '').strip()
    if csv_path and os.path.isfile(csv_path):
        print(f"[INFO] Using uploaded CSV: {csv_path}")
    else:
        print("[INFO] No uploaded CSV provided, downloading from FTP...")
        csv_path = download_csv_from_ftp()
        if not csv_path:
            print("[❌ ERROR] Could not download CSV from FTP.", file=sys.stderr)
            return 1

    print(f"\n Running with CSV path: {csv_path}")

    sku_data = aggregate_quantities_and_prices(csv_path)
    if not sku_data:
        return 1

    print(f"\n Aggregated {len(sku_data)} unique SKUs from CSV")

    success, errors = update_inventory_and_price(sku_data)
    print(f"\n Final Result: {success} successful updates, {errors} errors")
    return 0 if errors == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
