from dotenv import load_dotenv
load_dotenv()
import csv
import requests
import sys
import os

SHOP = os.environ.get('SHOP_NAME')
ACCESS_TOKEN = os.environ.get('SHOPIFY_ACCESS_TOKEN') 

print("SHOP_NAME from env:", SHOP)
print("SHOPIFY_ACCESS_TOKEN from env:", ACCESS_TOKEN[:6] + "..." if ACCESS_TOKEN else "None")

def create_order(order):
    url = f"https://{SHOP}.myshopify.com/admin/api/2023-10/orders.json"
    headers = {"X-Shopify-Access-Token": ACCESS_TOKEN, "Content-Type": "application/json"}
    resp = requests.post(url, json={"order": order}, headers=headers)
    print("Request payload:", {"order": order})
    print("Status code:", resp.status_code)
    print("Response:", resp.text)
    return resp.ok, resp.text

# Add this function to look up variant_id by SKU
def get_variant_id_by_sku(sku):
    url = f"https://{SHOP}.myshopify.com/admin/api/2023-10/variants.json?sku={sku}"
    headers = {"X-Shopify-Access-Token": ACCESS_TOKEN}
    resp = requests.get(url, headers=headers)
    if resp.ok:
        variants = resp.json().get('variants', [])
        if variants:
            return variants[0]['id']
    return None

def print_locations():
    url = f"https://{SHOP}.myshopify.com/admin/api/2023-10/locations.json"
    headers = {"X-Shopify-Access-Token": ACCESS_TOKEN}
    resp = requests.get(url, headers=headers)
    if resp.ok:
        for loc in resp.json().get('locations', []):
            print(f"Location name: {loc['name']}, ID: {loc['id']}")
    else:
        print("Failed to fetch locations:", resp.text)

def main(csv_path):
    print_locations()  # Only print locations once at the start
    with open(csv_path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # In your main() function, before building line_items:
            variant_id = get_variant_id_by_sku(row['Lineitem sku'])
            if not variant_id:
                print(f"[ERROR] SKU {row['Lineitem sku']} not found in Shopify. Skipping order.")
                continue

            # Build line items (for simplicity, only one line item per row)
            line_items = [{
                "title": row['Lineitem name'],
                "quantity": int(row['Lineitem quantity']),
                "price": row['Lineitem price'],
                "sku": row['Lineitem sku'],
                "variant_id": variant_id,
                "requires_shipping": row['Lineitem requires shipping'].lower() == 'true',
                "taxable": row['Lineitem taxable'].lower() == 'true'
            }]
            # Build order payload
            order = {
                "email": row['Email'],
                "line_items": line_items,
                "financial_status": row['Financial Status'],
                # REMOVE or comment out the next line:
                # "fulfillment_status": row['Fulfillment Status'],
                # Add customer ID if present
                **({"customer": {"id": row['Customer ID']}} if row.get('Customer ID') else {}),
                "billing_address": {
                    "name": row['Billing Name'],
                    "address1": row['Billing Address1'],
                    "address2": row['Billing Address2'],
                    "company": row['Billing Company'],
                    "city": row['Billing City'],
                    "province": row['Billing Province'],
                    "country": row['Billing Country'],
                    "zip": row['Billing Zip'],
                    "phone": row['Billing Phone']
                },
                "shipping_address": {
                    "name": row['Shipping Name'],
                    "address1": row['Shipping Address1'],
                    "address2": row['Shipping Address2'],
                    "company": row['Shipping Company'],
                    "city": row['Shipping City'],
                    "province": row['Shipping Province'],
                    "country": row['Shipping Country'],
                    "zip": row['Shipping Zip'],
                    "phone": row['Shipping Phone']
                },
                "shipping_lines": [],
                "note": row.get('Notes', ''),
                "tags": row.get('Tags', '')
            }
            shipping_lines = []
            if row.get('Shipping Line Title') and row.get('Shipping Line Price'):
                shipping_lines.append({
                    "title": row['Shipping Line Title'],
                    "price": row['Shipping Line Price']
                })
            order['shipping_lines'] = shipping_lines
            print(f"Creating order for: {row['Email']}")
            ok, resp_text = create_order(order)
            if not ok:
                print(f"[ERROR] Failed to create order for '{row['Email']}'")
                print(resp_text)
            else:
                print("Order created successfully")

if __name__ == "__main__":
    csv_path = sys.argv[1] if len(sys.argv) > 1 else "orders_template.csv"
    main(csv_path)