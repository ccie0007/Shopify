from flask import Flask, request, jsonify
from flask_cors import CORS
from ftplib import FTP
import os
import subprocess
import pyodbc

app = Flask(__name__)
CORS(app)  # Allow all origins for development

# Folder to save downloaded CSVs
DOWNLOAD_FOLDER = './downloaded_csvs'
os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)

# SQL Server connection config - update with your info
SQL_SERVER = 'localhost'  # e.g. 'localhost\\SQLEXPRESS' or '192.168.1.100'
SQL_DATABASE = 'UserAuthDB'
SQL_USERNAME = 'admin'
SQL_PASSWORD = '1234'

CONN_STRING = (
    f"DRIVER={{ODBC Driver 17 for SQL Server}};"
    f"SERVER={SQL_SERVER};"
    f"DATABASE={SQL_DATABASE};"
    f"UID={SQL_USERNAME};"
    f"PWD={SQL_PASSWORD}"
)

def check_user_credentials(username, password):
    try:
        with pyodbc.connect(CONN_STRING) as conn:
            cursor = conn.cursor()
            # Adjust table and column names to match your DB schema
            cursor.execute(
                "SELECT COUNT(*) FROM users WHERE username = ? AND password = ?",
                (username, password)
            )
            result = cursor.fetchone()
            return result[0] == 1
    except Exception as e:
        print("Database error:", e)
        return False

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"success": False, "message": "Username and password required"}), 400

    if check_user_credentials(username, password):
        # In a real app, generate a token (JWT etc). Here just dummy token
        return jsonify({"success": True, "token": "dummy-token"})
    else:
        return jsonify({"success": False, "message": "Invalid credentials"}), 401

@app.route('/save-credentials', methods=['POST'])
def save_credentials():
    data = request.json
    ftp_host = data.get('ftpHost')
    ftp_user = data.get('ftpUser')
    ftp_pass = data.get('ftpPass')

    if not all([ftp_host, ftp_user, ftp_pass]):
        return jsonify({"error": "FTP credentials missing"}), 400

    try:
        ftp = FTP(ftp_host)
        ftp.login(user=ftp_user, passwd=ftp_pass)

        csv_filename = 'inventory.csv'  # Adjust if needed
        local_path = os.path.join(DOWNLOAD_FOLDER, csv_filename)

        with open(local_path, 'wb') as f:
            ftp.retrbinary(f'RETR {csv_filename}', f.write)

        ftp.quit()

        return jsonify({"message": "CSV downloaded", "csvPath": local_path})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/update-inventory', methods=['POST'])
def update_inventory():
    data = request.json
    csv_path = data.get('csvPath')

    if not csv_path or not os.path.exists(csv_path):
        return jsonify({"error": "Valid csvPath is required"}), 400

    try:
        # Call your existing inventory update script with csv_path argument
        result = subprocess.run(
            ['python', 'update_shopify_inventory.py', csv_path],
            capture_output=True,
            text=True,
            check=True
        )
        return jsonify({"message": "Inventory updated", "output": result.stdout})

    except subprocess.CalledProcessError as e:
        return jsonify({"error": "Update failed", "details": e.stderr}), 500

if __name__ == "__main__":
    app.run(debug=True)
