from flask import Flask, request, jsonify
from flask_cors import CORS
import traceback
import os
import subprocess
from dotenv import load_dotenv
import pyodbc
import bcrypt

load_dotenv()

SQL_SERVER = os.getenv('SQL_SERVER', 'localhost')
SQL_DATABASE = os.getenv('SQL_DATABASE', 'UserAuthDB')
SQL_USER = os.getenv('SQL_USER', 'admin')
SQL_PASSWORD = os.getenv('SQL_PASSWORD', '1234')
SQL_DRIVER = os.getenv('SQL_DRIVER', '{ODBC Driver 17 for SQL Server}')

conn_str = f'DRIVER={SQL_DRIVER};SERVER={SQL_SERVER};DATABASE={SQL_DATABASE};UID={SQL_USER};PWD={SQL_PASSWORD}'

app = Flask(__name__)
CORS(app)

@app.route('/save-credentials', methods=['POST'])
def save_credentials():
    try:
        data = request.json
        print("Received data in /save-credentials:", data)

        required_fields = ['ftpHost', 'ftpUser', 'ftpPass', 'shopifyShopName', 'shopifyToken']
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return jsonify({'error': f"Missing fields: {', '.join(missing_fields)}"}), 400

        csv_path = data.get('csvPath', r"C:\xampp\htdocs\FTPShopify\ShopifyTech\backend\stock_update.csv")
        with open('.env', 'w') as f:
            f.write(f"FTP_HOST={data['ftpHost']}\n")
            f.write(f"FTP_USER={data['ftpUser']}\n")
            f.write(f"FTP_PASS={data['ftpPass']}\n")
            f.write(f"SHOP_NAME={data['shopifyShopName']}\n")
            f.write(f"ACCESS_TOKEN={data['shopifyToken']}\n")
            f.write(f"CSV_PATH={csv_path}\n")

        return jsonify({'message': 'Credentials and CSV path saved successfully'}), 200

    except Exception as e:
        print("Exception occurred in /save-credentials:")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@app.route('/update-inventory', methods=['POST'])
def update_inventory():
    try:
        data = request.json
        print("Received data in /update-inventory:", data)

        csv_path = os.getenv('CSV_PATH', r"C:\xampp\htdocs\FTPShopify\ShopifyTech\backend\stock_update.csv")
        print(f"Using CSV path: {csv_path}")

        result = subprocess.run(
            ['python', 'update_shopify_inventory.py'],
            capture_output=True,
            text=True,
            check=False
        )

        print("Update script stdout:", result.stdout)
        print("Update script stderr:", result.stderr)

        if result.returncode != 0:
            return jsonify({
                'error': 'Inventory update script failed',
                'details': result.stderr
            }), 500

        return jsonify({'message': 'Inventory updated successfully'}), 200

    except Exception as e:
        print("Exception occurred in /update-inventory:")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500
