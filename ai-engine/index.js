const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios'); // 🟢 Using Axios for direct API calls
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. CONFIGURATION
const PORT = 5000;
const API_KEY = process.env.GEMINI_API_KEY;

// 2. MONGODB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Node.js Engine: Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB Error:", err));

const TransactionSchema = new mongoose.Schema({}, { strict: false });
const Transaction = mongoose.model('transactions', TransactionSchema, 'transactions');

// 3. TAX LOGIC (Math)
const calculateNewRegime = (income) => {
    let taxable = Math.max(0, income - 75000);
    if (taxable <= 400000) return 0;
    if (taxable <= 800000) return (taxable - 400000) * 0.05;
    if (taxable <= 1200000) return 20000 + (taxable - 800000) * 0.10;
    if (taxable <= 1600000) return 60000 + (taxable - 1200000) * 0.15;
    if (taxable <= 2000000) return 120000 + (taxable - 1600000) * 0.20;
    if (taxable <= 2400000) return 200000 + (taxable - 2000000) * 0.25;
    return 300000 + (taxable - 2400000) * 0.30;
};

const calculateOldRegime = (income, ded80c, ded80d) => {
    let capped80c = Math.min(ded80c, 150000);
    let taxable = Math.max(0, income - 50000 - capped80c - ded80d);
    if (taxable <= 250000) return 0;
    if (taxable <= 500000) return (taxable - 250000) * 0.05;
    if (taxable <= 1000000) return 12500 + (taxable - 500000) * 0.20;
    return 112500 + (taxable - 1000000) * 0.30;
};

// 🟢 NEW: Direct API Call Function (No SDK)
async function callGeminiDirect(prompt) {
    // 🔴 OLD ERROR WAS HERE: gemini-2.5-flash
    // ✅ CORRECT: gemini-1.5-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    
    const payload = {
        contents: [{
            parts: [{ text: prompt }]
        }]
    };

    try {
        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' }
        });

        // Extract text safely
        const candidates = response.data.candidates;
        if (candidates && candidates.length > 0) {
            return candidates[0].content.parts[0].text;
        } else {
            throw new Error("Empty response from Gemini");
        }
    } catch (error) {
        console.error("⚠️ API Error:", error.response ? error.response.data : error.message);
        throw error;
    }
}

// 4. API ENDPOINT
app.post('/analyze-tax', async (req, res) => {
    try {
        const { userId } = req.body;
        console.log(`🔍 Analyzing Tax for: ${userId}`);

        if (!userId) return res.status(400).json({ error: "User ID required" });

        const rawTxns = await Transaction.find({ userId }).limit(60);
        
        if (rawTxns.length === 0) {
            return res.status(404).json({ error: "No transactions found" });
        }

        const summary = rawTxns.map(t => `${t.description}: ${t.amount}`).join("\n");
        const prompt = `
        Act as an Indian Tax Expert. Analyze these bank transactions:
        ${summary}

        Tasks:
        "1. Calculate 'total_income' (Sum of Salary, Credit, and any transaction starting with 'Received from')."
        2. Identify 'deductions_80c' (PPF, LIC, ELSS, EPF).
        3. Identify 'deductions_80d' (Medical Insurance).
        4. List the names of deduction sources found.

        Output strictly valid JSON:
        { "total_income": number, "deductions_80c": number, "deductions_80d": number, "findings": ["list of strings"] }
        `;

        // 🟢 Call the direct function
        let rawText;
        try {
            rawText = await callGeminiDirect(prompt);
        } catch (apiErr) {
            // Fallback: If Flash fails, try Pro
            console.log("⚠️ Flash failed, trying Pro...");
            const urlPro = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;
            const responsePro = await axios.post(urlPro, {
                contents: [{ parts: [{ text: prompt }] }]
            });
            rawText = responsePro.data.candidates[0].content.parts[0].text;
        }

        const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        let aiData;
        
        try {
            aiData = JSON.parse(cleanedText);
        } catch (e) {
            aiData = { total_income: 0, deductions_80c: 0, deductions_80d: 0, findings: [] };
        }

        const income = aiData.total_income || 0;
        const taxNew = Math.floor(calculateNewRegime(income));
        const taxOld = Math.floor(calculateOldRegime(income, aiData.deductions_80c, aiData.deductions_80d));

        res.json({
            analysis: {
                total_income: income,
                detected_deductions: {
                    "80c": aiData.deductions_80c,
                    "80d": aiData.deductions_80d,
                    "sources": aiData.findings
                }
            },
            tax_comparison: {
                old_regime_tax: taxOld,
                new_regime_tax: taxNew,
                savings: Math.abs(taxNew - taxOld),
                recommendation: taxNew <= taxOld ? "New Regime" : "Old Regime"
            }
        });

    } catch (error) {
        console.error("🔥 Final Server Error:", error.message);
        res.status(500).json({ error: "Service Error" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Node.js Tax Engine running on Port ${PORT}`);
});