from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app)

DB_PATH = 'finance.db'

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    # Create categories table
    c.execute('''
        CREATE TABLE IF NOT EXISTS categories (
            name TEXT PRIMARY KEY
        )
    ''')
    # Create expenses table
    c.execute('''
        CREATE TABLE IF NOT EXISTS expenses (
            _id TEXT PRIMARY KEY,
            rowId TEXT,
            amount REAL,
            category TEXT,
            date TEXT,
            monthTag TEXT,
            created_at TEXT
        )
    ''')
    
    # Check if categories exist, if not add defaults
    c.execute('SELECT COUNT(*) FROM categories')
    if c.fetchone()[0] == 0:
        default_categories = [
            ("Lifestyle",), ("Snacks",), ("Celebration",), ("Personal",), ("Misc",)
        ]
        c.executemany('INSERT INTO categories (name) VALUES (?)', default_categories)
        
    conn.commit()
    conn.close()

# Initialize DB on startup
init_db()

# --- Category Management ---
@app.route('/api/categories', methods=['GET'])
def get_categories():
    conn = get_db_connection()
    categories = conn.execute('SELECT name FROM categories').fetchall()
    conn.close()
    return jsonify([c['name'] for c in categories]), 200

@app.route('/api/categories', methods=['POST'])
def add_category():
    data = request.json
    name = data.get('name')
    if name:
        conn = get_db_connection()
        conn.execute('INSERT OR IGNORE INTO categories (name) VALUES (?)', (name,))
        conn.commit()
        conn.close()
        return jsonify({"message": "Category added"}), 201
    return jsonify({"error": "Name required"}), 400

@app.route('/api/categories/<name>', methods=['DELETE'])
def delete_category(name):
    conn = get_db_connection()
    conn.execute('DELETE FROM categories WHERE name = ?', (name,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Category deleted"}), 200

@app.route('/api/categories/<old_name>', methods=['PUT'])
def rename_category(old_name):
    data = request.json
    new_name = data.get('name')
    if new_name:
        conn = get_db_connection()
        conn.execute('UPDATE categories SET name = ? WHERE name = ?', (new_name, old_name))
        conn.execute('UPDATE expenses SET category = ? WHERE category = ?', (new_name, old_name))
        conn.commit()
        conn.close()
        return jsonify({"message": "Category renamed"}), 200
    return jsonify({"error": "New name required"}), 400


# --- Expense Management ---
@app.route('/api/expenses', methods=['POST'])
def add_expense():
    data = request.json
    try:
        amount = float(data.get('amount'))
        category = data.get('category')
        date_str = data.get('date') # Expected format YYYY-MM-DD
        row_id = data.get('rowId', str(uuid.uuid4()))

        if not amount or not category or not date_str:
            return jsonify({"error": "Missing required fields"}), 400

        date_obj = datetime.strptime(date_str, "%Y-%m-%d")
        month_tag = date_obj.strftime("%Y-%m")
        expense_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()

        conn = get_db_connection()
        conn.execute('''
            INSERT INTO expenses (_id, rowId, amount, category, date, monthTag, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (expense_id, row_id, amount, category, date_str, month_tag, created_at))
        conn.commit()
        conn.close()

        expense = {
            "_id": expense_id,
            "rowId": row_id,
            "amount": amount,
            "category": category,
            "date": date_str,
            "monthTag": month_tag,
            "created_at": created_at
        }
        return jsonify({"message": "Expense added successfully", "expense": expense}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/expenses/batch', methods=['POST'])
def batch_save_expenses():
    data = request.json
    month_tag = data.get('monthTag')
    expenses = data.get('expenses', [])

    if not month_tag:
        return jsonify({"error": "monthTag is required"}), 400

    try:
        conn = get_db_connection()
        # Delete existing expenses for this month
        conn.execute('DELETE FROM expenses WHERE monthTag = ?', (month_tag,))

        # Insert new expenses if there are any
        if expenses:
            for exp in expenses:
                _id = exp.get('_id', str(uuid.uuid4()))
                rowId = exp.get('rowId', str(uuid.uuid4()))
                amount = float(exp.get('amount', 0))
                category = exp.get('category', '')
                date_str = exp.get('date', '')
                created_at = exp.get('created_at', datetime.utcnow().isoformat())
                
                conn.execute('''
                    INSERT INTO expenses (_id, rowId, amount, category, date, monthTag, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (_id, rowId, amount, category, date_str, month_tag, created_at))
                
        conn.commit()
        conn.close()
        return jsonify({"message": f"Successfully saved {len(expenses)} expenses for {month_tag}"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    month_tag = request.args.get('monthTag')
    conn = get_db_connection()
    
    if month_tag:
        expenses = conn.execute('SELECT * FROM expenses WHERE monthTag = ? ORDER BY date DESC', (month_tag,)).fetchall()
    else:
        expenses = conn.execute('SELECT * FROM expenses ORDER BY date DESC').fetchall()
        
    conn.close()
    
    # Convert rows to dicts
    expense_list = [dict(row) for row in expenses]
    return jsonify(expense_list), 200

@app.route('/api/expenses/<expense_id>', methods=['PUT'])
def update_expense(expense_id):
    data = request.json
    try:
        update_fields = []
        params = []
        
        if 'amount' in data:
            update_fields.append("amount = ?")
            params.append(float(data['amount']))
        if 'category' in data:
            update_fields.append("category = ?")
            params.append(data['category'])
        if 'date' in data:
            update_fields.append("date = ?")
            params.append(data['date'])
            date_obj = datetime.strptime(data['date'], "%Y-%m-%d")
            update_fields.append("monthTag = ?")
            params.append(date_obj.strftime("%Y-%m"))

        if update_fields:
            query = f"UPDATE expenses SET {', '.join(update_fields)} WHERE _id = ?"
            params.append(expense_id)
            
            conn = get_db_connection()
            conn.execute(query, tuple(params))
            conn.commit()
            
            updated = conn.execute('SELECT * FROM expenses WHERE _id = ?', (expense_id,)).fetchone()
            conn.close()
            
            return jsonify({"message": "Expense updated", "expense": dict(updated)}), 200
            
        return jsonify({"error": "No valid fields to update"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/expenses/<expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM expenses WHERE _id = ?', (expense_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Expense deleted"}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5001)
