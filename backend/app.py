from flask import Flask, request, jsonify
from flask_cors import CORS
import traceback

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

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

        return jsonify({'message': 'Credentials saved successfully'}), 200

    except Exception as e:
        print("Exception occurred in /save-credentials:")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@app.route('/update-inventory', methods=['POST'])
def update_inventory():
    try:
        data = request.json
        print("Received data in /update-inventory:", data)  # Debug log

        # Your inventory update logic here

        return jsonify({'message': 'Inventory updated successfully'}), 200
    except Exception as e:
        print("Exception occurred in /update-inventory:")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        print("Received data in /login:", data)  # Debug log

        username = data.get('username')
        password = data.get('password')

        # Dummy auth example
        if username == 'admin' and password == 'password':
            return jsonify({'message': 'Login successful'}), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401

    except Exception as e:
        print("Exception occurred in /login:")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
