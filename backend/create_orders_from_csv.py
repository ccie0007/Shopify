import csv
import requests
import sys
import os

SHOP = os.environ.get('SHOP_NAME') or 'techguru2025'
ACCESS_TOKEN = os.environ.get('SHOPIFY_ACCESS_TOKEN') or os.environ.get('ACCESS_TOKEN')

def create_order(order):
    url = f"https://{SHOP}.myshopify.com/admin/api/2023-10/orders.json"
    headers = {"X-Shopify-Access-Token": ACCESS_TOKEN, "Content-Type": "application/json"}
    resp = requests.post(url, json={"order": order}, headers=headers)
    print("Request payload:", {"order": order})
    print("Status code:", resp.status_code)
    print("Response:", resp.text)
    return resp.ok, resp.text

def main(csv_path):
    with open(csv_path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Build line items (for simplicity, only one line item per row)
            line_items = [{
                "title": row['Lineitem name'],
                "quantity": int(row['Lineitem quantity']),
                "price": row['Lineitem price'],
                "sku": row['Lineitem sku'],
                "requires_shipping": row['Lineitem requires shipping'].lower() == 'true',
                "taxable": row['Lineitem taxable'].lower() == 'true'
            }]
            # Build order payload
            order = {
                "email": row['Email'],
                "line_items": line_items,
                "financial_status": row['Financial Status'],
                "fulfillment_status": row['Fulfillment Status'],
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
                "note": row.get('Notes', ''),
                "tags": row.get('Tags', '')
            }
            print(f"Creating order for: {row['Email']}")
            ok, resp_text = create_order(order)
            if not ok:
                print(f"[ERROR] Failed to create order for '{row['Email']}'")
                print(resp_text)

if __name__ == "__main__":
    csv_path = sys.argv[1] if len(sys.argv) > 1 else "orders_template.csv"
    main(csv_path)