from dotenv import load_dotenv
load_dotenv()
import csv
import requests
import os
import json
import time

SHOP_NAME = os.environ.get('SHOP_NAME')
ACCESS_TOKEN = os.environ.get('SHOPIFY_ACCESS_TOKEN')
API_VERSION = os.environ.get('SHOPIFY_API_VERSION', '2024-01')
BASE_URL = f"https://{SHOP_NAME}.myshopify.com/admin/api/{API_VERSION}/"
HEADERS = {
    "X-Shopify-Access-Token": ACCESS_TOKEN,
    "Content-Type": "application/json"
}

def make_shopify_request(url, method='GET', json_data=None, max_retries=3):
    """Helper function to handle Shopify API requests with retry logic"""
    for attempt in range(max_retries):
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=HEADERS)
            elif method.upper() == 'POST':
                response = requests.post(url, headers=HEADERS, json=json_data)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            if response.status_code == 429:  # Rate limited
                retry_after = int(response.headers.get('Retry-After', 10))
                print(f"Rate limited. Retrying after {retry_after} seconds...")
                time.sleep(retry_after)
                continue
                
            return response
            
        except requests.exceptions.RequestException as e:
            print(f"Request failed (attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
            else:
                raise e
    return None

def get_all_orders_mapping():
    """Fetch all orders and create a mapping from order number to order ID"""
    print("Building order number to ID mapping...")
    order_mapping = {}
    url = f"{BASE_URL}orders.json?status=any&limit=250"
    resp = make_shopify_request(url)
    
    if resp and resp.status_code == 200:
        orders = resp.json().get('orders', [])
        for order in orders:
            # Use order number without '#' as key
            order_number_clean = order['name'].lstrip('#').strip()
            order_mapping[order_number_clean] = order['id']
        print(f"Created mapping for {len(orders)} orders")
    else:
        print("Failed to fetch orders for mapping")
    
    return order_mapping

def update_tracking(order_number, tracking_number, tracking_company, order_id=None):
    """Update tracking information for an order"""
    print(f"\n=== Processing Order: {order_number} ===")
    
    # Fetch the full order data by ID
    order_url = f"{BASE_URL}orders/{order_id}.json?status=any"
    order_resp = make_shopify_request(order_url)
    if not order_resp or order_resp.status_code != 200:
        print(f"Failed to fetch order {order_id}: {order_resp.status_code if order_resp else 'No response'}")
        return False
        
    order = order_resp.json().get('order')
    if not order:
        print(f"No order data found for order {order_id}")
        return False

    print(f"Order: {order.get('name')} (ID: {order_id})")
    print(f"Financial Status: {order.get('financial_status')}")
    print(f"Fulfillment Status: {order.get('fulfillment_status')}")

    # Check for existing fulfillments
    fulfillment_url = f"{BASE_URL}orders/{order_id}/fulfillments.json"
    resp = make_shopify_request(fulfillment_url)
    if not resp:
        print("Failed to fetch fulfillments")
        return False
        
    fulfillments = resp.json().get('fulfillments', [])
    print(f"Found {len(fulfillments)} existing fulfillment(s)")

    # If fulfillments exist, try to update them
    if fulfillments:
        for fulfillment in fulfillments:
            fulfillment_id = fulfillment['id']
            print(f"Attempting to update fulfillment ID: {fulfillment_id}")
            print(f"Fulfillment Status: {fulfillment.get('status')}")
            
            update_url = f"{BASE_URL}fulfillments/{fulfillment_id}/update_tracking.json"
            payload = {
                "fulfillment": {
                    "tracking_info": {
                        "number": tracking_number,
                        "company": tracking_company
                    },
                    "notify_customer": True
                }
            }
            
            update_resp = make_shopify_request(update_url, 'POST', payload)
            if update_resp and update_resp.status_code == 200:
                print(f"Successfully updated tracking for order {order_number}")
                return True
            else:
                error_msg = update_resp.text if update_resp else "No response"
                print(f"Failed to update fulfillment {fulfillment_id}: {error_msg}")
        
        print(f"All attempts to update fulfillments for order {order_number} failed")
        return False

    # If no fulfillments exist, create a new one
    print(f"No fulfillments found, creating new fulfillment...")
    success = create_fulfillment_v2(order_id, tracking_number, tracking_company)
    if success:
        print(f"Successfully created fulfillment and added tracking")
        return True
    else:
        print(f"Failed to create fulfillment")
        return False

def create_fulfillment_v2(order_id, tracking_number, tracking_company):
    """Create fulfillment using fulfillment_orders endpoint"""
    # Get fulfillment orders
    fulfillment_orders_url = f"{BASE_URL}orders/{order_id}/fulfillment_orders.json"
    fo_resp = make_shopify_request(fulfillment_orders_url)
    
    if not fo_resp or fo_resp.status_code != 200:
        print(f"Failed to get fulfillment orders: {fo_resp.status_code if fo_resp else 'No response'}")
        return False
        
    fulfillment_orders = fo_resp.json().get('fulfillment_orders', [])
    if not fulfillment_orders:
        print("No fulfillment orders found")
        return False
    
    fulfillment_order_id = fulfillment_orders[0]['id']
    print(f"Using fulfillment order ID: {fulfillment_order_id}")
    
    # Create the fulfillment
    fulfillment_url = f"{BASE_URL}fulfillments.json"
    payload = {
        "fulfillment": {
            "line_items_by_fulfillment_order": [
                {
                    "fulfillment_order_id": fulfillment_order_id
                }
            ],
            "notify_customer": False
        }
    }
    
    fulfillment_resp = make_shopify_request(fulfillment_url, 'POST', payload)
    if not fulfillment_resp or fulfillment_resp.status_code not in [200, 201]:
        error_msg = fulfillment_resp.text if fulfillment_resp else "No response"
        print(f"Failed to create fulfillment: {error_msg}")
        return False
        
    new_fulfillment = fulfillment_resp.json().get('fulfillment')
    if not new_fulfillment:
        print("No fulfillment data in response")
        return False
        
    fulfillment_id = new_fulfillment['id']
    print(f"Created fulfillment ID: {fulfillment_id}")
    
    # Update tracking on the new fulfillment
    update_url = f"{BASE_URL}fulfillments/{fulfillment_id}/update_tracking.json"
    tracking_payload = {
        "fulfillment": {
            "tracking_info": {
                "number": tracking_number,
                "company": tracking_company
            },
            "notify_customer": True
        }
    }
    
    update_resp = make_shopify_request(update_url, 'POST', tracking_payload)
    if update_resp and update_resp.status_code == 200:
        print("Tracking added to new fulfillment")
        return True
    else:
        error_msg = update_resp.text if update_resp else "No response"
        print(f"Failed to add tracking: {error_msg}")
        return False

def process_csv(file_path):
    total = 0
    success = 0
    log_lines = []
    order_mapping = get_all_orders_mapping()
    if not order_mapping:
        log_lines.append("No orders found in mapping")
        with open("tracking_update.log", "w", encoding="utf-8") as logf:
            logf.write("\n".join(log_lines))
        print("Tracking updated 0/0")
        return

    with open(file_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            total += 1
            order_number_clean = row['order_number'].lstrip('#').strip()
            if order_number_clean in order_mapping:
                order_id = order_mapping[order_number_clean]
                log_lines.append(f"Processing {row['order_number']} -> ID: {order_id}")
                result = update_tracking(
                    row['order_number'],
                    row['tracking_number'],
                    row['tracking_company'],
                    order_id
                )
                if result:
                    success += 1
                    log_lines.append(f"Success: {row['order_number']}")
                else:
                    log_lines.append(f"Failed: {row['order_number']}")
            else:
                log_lines.append(f"Order {row['order_number']} not found in order mapping")
            time.sleep(1)
    # Write details to log file
    with open("tracking_update.log", "w", encoding="utf-8") as logf:
        logf.write("\n".join(log_lines))
    # Print only the summary for dashboard
    print(f"Tracking updated {success}/{total}")

def check_api_connection():
    """Test if API connection is working"""
    print("\n=== Testing API Connection ===")
    url = f"{BASE_URL}shop.json"
    resp = make_shopify_request(url)
    if resp and resp.status_code == 200:
        shop_data = resp.json().get('shop', {})
        print(f"Connected to: {shop_data.get('name')}")
        print(f"Shop domain: {shop_data.get('domain')}")
        print(f"Shop email: {shop_data.get('email')}")
        return True
    else:
        print("API connection failed")
        return False

def print_recent_orders(limit=20):
    """Print recent orders to see what's available"""
    print(f"\n=== Recent Orders (last {limit}) ===")
    url = f"{BASE_URL}orders.json?limit={limit}&status=any"
    resp = make_shopify_request(url)
    if resp and resp.status_code == 200:
        orders = resp.json().get('orders', [])
        print(f"Found {len(orders)} orders:")
        for order in orders:
            print(f"  - {order['name']} (ID: {order['id']}) - {order['financial_status']} - {order['fulfillment_status']}")
    else:
        print("Failed to fetch orders")

if __name__ == "__main__":
    import sys

    # Test API connection first
    check_api_connection()
    
    # Show recent orders for debugging
    print_recent_orders()

    if len(sys.argv) < 2:
        print("Usage: python update_tracking.py path/to/your.csv")
        print("CSV format should have: order_number, tracking_number, tracking_company")
        print("Example CSV content:")
        print("order_number,tracking_number,tracking_company")
        print("#1030,1Z999AA10123456784,UPS")
        print("#1031,1Z999AA10123456785,UPS")
        exit(1)

    process_csv(sys.argv[1])