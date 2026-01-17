import os
import json
import time
import google.generativeai as genai
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
from google.api_core import exceptions

# 1. SETUP
load_dotenv()
app = Flask(__name__)
CORS(app)

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Connect to MongoDB
try:
    mongo_client = MongoClient(os.getenv("MONGO_URI"))
    db = mongo_client["FinFlowDB"]
    collection = db["transactions"]
    print("✅ Connected to MongoDB")
except Exception as e:
    print(f"❌ MongoDB Connection Error: {e}")

# ---------------------------------------------------------
# 2. HELPER: RETRY LOGIC (Fixes 503 Errors)
# ---------------------------------------------------------
def generate_with_retry(model, prompt, retries=5):
    """Tries to call Gemini up to 5 times if it says 'Service Unavailable'"""
    for attempt in range(retries):
        try:
            return model.generate_content(prompt)
        except exceptions.ServiceUnavailable:
            wait_time = (attempt + 1) * 2  # Wait 2s, 4s, 6s...
            print(f"⚠️ Google AI Busy (503). Retrying in {wait_time}s...")
            time.sleep(wait_time)
        except Exception as e:
            print(f"❌ Critical AI Error: {e}")
            raise e
    raise Exception("Google AI is too busy. Please try again later.")

# ---------------------------------------------------------
# 3. TAX LOGIC
# ---------------------------------------------------------
def calculate_new_regime(income):
    taxable = max(0, income - 75000)
    if taxable <= 400000: return 0
    elif taxable <= 800000: return (taxable - 400000) * 0.05
    elif taxable <= 1200000: return 20000 + (taxable - 800000) * 0.10
    elif taxable <= 1600000: return 60000 + (taxable - 1200000) * 0.15
    elif taxable <= 2000000: return 120000 + (taxable - 1600000) * 0.20
    elif taxable <= 2400000: return 200000 + (taxable - 2000000) * 0.25
    else: return 300000 + (taxable - 2400000) * 0.30

def calculate_old_regime(income, ded_80c, ded_80d):
    capped_80c = min(ded_80c, 150000)
    taxable = max(0, income - 50000 - capped_80c - ded_80d)
    if taxable <= 250000: return 0
    elif taxable <= 500000: return (taxable - 250000) * 0.05
    elif taxable <= 1000000: return 12500 + (taxable - 500000) * 0.20
    else: return 112500 + (taxable - 1000000) * 0.30

# ---------------------------------------------------------
# 4. API ENDPOINT
# ---------------------------------------------------------
@app.route('/analyze-tax', methods=['POST'])
def analyze_tax():
    try:
        data = request.json
        user_id = data.get('userId')
        
        # Fetch Data
        raw_txns = list(collection.find(
            {"userId": user_id}, 
            {"_id": 0, "description": 1, "amount": 1}
        ).limit(50)) # Limit to 50 to avoid token limits

        if not raw_txns:
            return jsonify({"error": "No transactions found"}), 404

        summary_text = "\n".join([f"{t['description']}: {t['amount']}" for t in raw_txns])

        prompt = f"""
        Act as an Indian Chartered Accountant. Analyze these bank transactions:
        {summary_text}

        Return ONLY valid JSON with this format:
        {{ "total_income": 0, "deductions_80c": 0, "deductions_80d": 0, "findings": ["list names"] }}
        """

        # 🟢 USE GEMINI-1.5-FLASH (It works for you, just needs retry)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # 🟢 CALL WITH RETRY
        response = generate_with_retry(model, prompt)
        
        clean_json = response.text.replace('```json', '').replace('```', '').strip()
        ai_result = json.loads(clean_json)

        income = ai_result.get('total_income', 0)
        inv_80c = ai_result.get('deductions_80c', 0)
        med_80d = ai_result.get('deductions_80d', 0)

        tax_new = int(calculate_new_regime(income))
        tax_old = int(calculate_old_regime(income, inv_80c, med_80d))
        
        savings = abs(tax_new - tax_old)
        rec = "New Regime" if tax_new <= tax_old else "Old Regime"

        return jsonify({
            "analysis": {
                "total_income": income,
                "detected_deductions": {
                    "80c": inv_80c,
                    "80d": med_80d,
                    "sources": ai_result.get('findings', [])
                }
            },
            "tax_comparison": {
                "old_regime_tax": tax_old,
                "new_regime_tax": tax_new,
                "savings": savings,
                "recommendation": rec
            }
        })

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🧠 AI Tax Engine running on Port 8000")
    app.run(port=8000, debug=True)