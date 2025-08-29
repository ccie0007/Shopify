import csv
import requests
import sys
import os

SHOP = os.environ.get('SHOP_NAME')
ACCESS_TOKEN = os.environ.get('SHOPIFY_ACCESS_TOKEN')

print("SHOP_NAME from env:", SHOP)
print("SHOPIFY_ACCESS_TOKEN from env:", ACCESS_TOKEN[:6] + "..." if ACCESS_TOKEN else "None")

def create_product(product):
    url = f"https://{SHOP}.myshopify.com/admin/api/2023-10/products.json"
    headers = {"X-Shopify-Access-Token": ACCESS_TOKEN, "Content-Type": "application/json"}
    resp = requests.post(url, json={"product": product}, headers=headers)
    print("Request payload:", {"product": product})
    print("Status code:", resp.status_code)
    print("Response:", resp.text)
    return resp.ok, resp.text

def main(csv_path):
    with open(csv_path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Build product payload
            product = {
                "title": row.get('Title', ''),
                "body_html": row.get('Body (HTML)', ''),
                "vendor": row.get('Vendor', ''),
                "product_type": row.get('Type', ''),
                "tags": row.get('Tags', ''),
                "variants": [{
                    "option1": row.get('Option1 Value', 'Default Title'),
                    "price": row.get('Variant Price', '0.00'),
                    "sku": row.get('Variant SKU', ''),
                    "inventory_quantity": int(row.get('Variant Inventory Qty', 0)),
                    "inventory_management": "shopify",  # <-- enables inventory tracking
                    "inventory_policy": "deny",
                    "requires_shipping": row.get('Variant Requires Shipping', 'TRUE').lower() == 'true'
                }]
            }
            print(f"Creating product: {product['title']}")
            ok, resp_text = create_product(product)
            if not ok:
                print(f"[ERROR] Failed to create product '{product['title']}'")
                print(resp_text)

if __name__ == "__main__":
    csv_path = sys.argv[1] if len(sys.argv) > 1 else "products_template.csv"
    main(csv_path)