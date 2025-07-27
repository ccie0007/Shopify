from flask import Flask, request, jsonify
from flask_cors import CORS
import traceback
import os
import subprocess
from dotenv import load_dotenv
import pyodbc

# SQL Server config
SQL_SERVER = 'localhost'
SQL_DATABASE = 'UserAuthDB'
SQL_USER = 'admin'
SQL_PASSWORD = '1234'
SQL_DRIVER = '{ODBC Driver 17 for SQL Server}'

conn_str = f'DRIVER={SQL_DRIVER};SERVER={SQL_SERVER};DATABASE={SQL_DATABASE};UID={SQL_USER};PWD={SQL_PASSWORD}'


app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load .env variables at app start
load_dotenv()


@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')

        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        cursor.execute("SELECT password FROM Users WHERE username = ?", (username,))
        row = cursor.fetchone()

        if row and password == row[0]:  # simple plain-text check
            return jsonify({'success': True, 'token': 'dummy-token'}), 200
        else:
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': 'Server error', 'details': str(e)}), 500

@app.route('/save-credentials', methods=['POST'])
def save_credentials():
    try:
        data = request.json
        print("Received data in /save-credentials:", data)  # Debug log

        # Validate required fields
        required_fields = ['ftpHost', 'ftpUser', 'ftpPass', 'shopifyShopName', 'shopifyToken']
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return jsonify({'error': f"Missing fields: {', '.join(missing_fields)}"}), 400

        with open('.env', 'w') as f:
            f.write(f"FTP_HOST={data['ftpHost']}\n")
            f.write(f"FTP_USER={data['ftpUser']}\n")
            f.write(f"FTP_PASS={data['ftpPass']}\n")
            f.write(f"SHOP_NAME={data['shopifyShopName']}\n")
            f.write(f"ACCESS_TOKEN={data['shopifyToken']}\n")
            # Hardcoded CSV path saved here:
            f.write(r"CSV_PATH=C:\xampp\htdocs\FTPShopify\ShopifyTech\backend\stock_update.csv")
           


        return jsonify({'message': 'Credentials and CSV path saved successfully'}), 200

    except Exception as e:
        print("Exception occurred in /save-credentials:")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500



@app.route('/update-inventory', methods=['POST'])
def update_inventory():
    try:
        data = request.json
        print("Received data in /update-inventory:", data)  # Debug log

        # Load CSV path from env or fallback
        csv_path = os.getenv('CSV_PATH')
        if not csv_path:
            csv_path = r"C:\xampp\htdocs\FTPShopify\ShopifyTech\backend\stock_update.csv"
        print(f"Using CSV path: {csv_path}")

        # Run the update script via subprocess and capture output
        result = subprocess.run(
            ['python', 'update_shopify_inventory.py', csv_path],
            capture_output=True,
            text=True,
            check=False  # We'll handle errors ourselves
        )

        print("Update script stdout:", result.stdout)
        print("Update script stderr:", result.stderr)

        if result.returncode != 0:
            # Script returned error
            return jsonify({
                'error': 'Inventory update script failed',
                'details': result.stderr
            }), 500

        return jsonify({'message': 'Inventory updated successfully'}), 200

    except Exception as e:
        print("Exception occurred in /update-inventory:")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500



if __name__ == '__main__':
    app.run(debug=True)
