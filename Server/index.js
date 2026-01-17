require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');

if (!process.env.MONGO_URI || !process.env.GEMINI_API_KEY) {
    console.error("❌ MISSING ENV VARIABLES");
    process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); 

const PORT = 5000; 

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.error('❌ DB Error:', err));

// --- MODELS ---
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: String,
    picture: String,
    lastLogin: { type: Date, default: Date.now }
});
const User = mongoose.models.User || mongoose.model('User', UserSchema);

const TransactionSchema = new mongoose.Schema({}, { strict: false });
const Transaction = mongoose.models.transactions || mongoose.model('transactions', TransactionSchema, 'transactions');

const TaxSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    totalIncome: Number,
    oldRegimeTax: Number,
    newRegimeTax: Number,
    savings: Number,
    recommendation: String,
    detectedDeductions: Object,
    savingsSuggestion: String,
    taxTips: [String],
    timestamp: { type: Date, default: Date.now }
});
const TaxRecord = mongoose.models.TaxRecord || mongoose.model('TaxRecord', TaxSchema);

const LoanSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    lender: String,
    type: { type: String, enum: ['Personal', 'Home', 'Auto', 'Credit Card', 'Education'] },
    amount: Number,
    outstanding: Number,
    startDate: Date,
    status: { type: String, default: 'Active' }
});
const Loan = mongoose.models.Loan || mongoose.model('Loan', LoanSchema);

const CibilSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    score: Number,
    factors: Object,
    history: [{ date: Date, score: Number }],
    lastUpdated: { type: Date, default: Date.now }
});
const CibilRecord = mongoose.models.CibilRecord || mongoose.model('CibilRecord', CibilSchema);

const SavingsSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    monthlyIncome: Number,
    monthlyExpense: Number,
    currentSavings: Number,
    potentialSavings: Number,
    wastefulSpends: [String],
    aiAdvice: String,
    timestamp: { type: Date, default: Date.now }
});
const SavingsRecord = mongoose.models.SavingsRecord || mongoose.model('SavingsRecord', SavingsSchema);

// --- HELPER ---
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

const calculateOldRegime = (income, deductions) => {
    const sec80c = Math.min(deductions['80c'] || 0, 150000); 
    const sec80d = Math.min(deductions['80d'] || 0, 25000); 
    const sec24b = Math.min(deductions['24b'] || 0, 200000); 
    const totalDeductions = sec80c + sec80d + sec24b + (deductions['hra'] || 0);
    let taxable = Math.max(0, income - 50000 - totalDeductions); 
    if (taxable <= 250000) return 0;
    if (taxable <= 500000) return (taxable - 250000) * 0.05;
    if (taxable <= 1000000) return 12500 + (taxable - 500000) * 0.20;
    return 112500 + (taxable - 1000000) * 0.30;
};

// --- ENDPOINTS ---

// 1. Transactions
app.get('/api/transactions/:userId', async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.params.userId }).sort({ date: -1 }).limit(100);
        res.json(transactions);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// 2. Auth
app.post('/api/auth/google', async (req, res) => {
    try {
        const { email, name, picture } = req.body;
        const user = await User.findOneAndUpdate({ email }, { $set: { name, picture, lastLogin: new Date() } }, { upsert: true, new: true });
        res.json(user);
    } catch (error) { res.status(500).json({ error: "Auth failed" }); }
});

// 3. Savings AI
app.post('/api/analyze-savings', async (req, res) => {
    try {
        const { userId } = req.body;
        const rawTxns = await Transaction.find({ userId }).sort({ date: -1 }).limit(50);
        
        if (rawTxns.length === 0) return res.json({ aiAdvice: "No data available." });

        const summary = rawTxns.map(t => `${t.description}: ${t.amount}`).join("\n");
        const prompt = `Analyze finances. Return JSON: { "monthly_income": 0, "monthly_expense": 0, "current_savings": 0, "potential_savings": 0, "wasteful_spends": [], "ai_advice": "string" }. Data: ${summary}`;

        // 🟢 FIX: Correct Model & Error Handling
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            { contents: [{ parts: [{ text: prompt }] }] }
        );

        let rawText = response.data.candidates[0].content.parts[0].text;
        rawText = rawText.replace(/```json|```/g, '').trim(); // 🟢 FIX: Clean Markdown
        const aiData = JSON.parse(rawText);

        const record = new SavingsRecord({ userId, ...aiData });
        await record.save();
        res.json(record);

    } catch (error) {
        console.error("❌ Savings AI Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Savings Analysis Failed" });
    }
});

// 4. Tax AI
app.post('/api/analyze-tax', async (req, res) => { // 🟢 FIX: Added /api/
    try {
        const { userId } = req.body;
        const rawTxns = await Transaction.find({ userId }).limit(80);
        
        const summary = rawTxns.map(t => `${t.description}: ${t.amount}`).join("\n");
        const prompt = `Analyze tax deductions. Return JSON: { "total_income": 0, "deductions_80c": 0, "deductions_80d": 0, "deductions_24b": 0, "hra_exemption": 0, "findings": [], "savings_suggestion": "", "tax_tips": [] }. Data: ${summary}`;

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            { contents: [{ parts: [{ text: prompt }] }] }
        );

        let rawText = response.data.candidates[0].content.parts[0].text;
        rawText = rawText.replace(/```json|```/g, '').trim();
        const aiData = JSON.parse(rawText);

        const income = aiData.total_income || 0;
        const deductionMap = { '80c': aiData.deductions_80c, '80d': aiData.deductions_80d, '24b': aiData.deductions_24b, 'hra': aiData.hra_exemption };
        
        const taxNew = Math.floor(calculateNewRegime(income));
        const taxOld = Math.floor(calculateOldRegime(income, deductionMap));

        const taxEntry = new TaxRecord({
            userId,
            totalIncome: income,
            oldRegimeTax: taxOld,
            newRegimeTax: taxNew,
            savings: Math.abs(taxNew - taxOld),
            recommendation: taxNew <= taxOld ? "New Regime" : "Old Regime",
            detectedDeductions: { ...deductionMap, sources: aiData.findings },
            savingsSuggestion: aiData.savings_suggestion,
            taxTips: aiData.tax_tips
        });

        await taxEntry.save();
        res.json({ analysis: aiData, tax_comparison: taxEntry });

    } catch (error) {
        console.error("❌ Tax AI Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Tax Analysis Failed" });
    }
});

// 5. Credit (Simplified)
app.get('/api/credit-health/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const loans = await Loan.find({ userId });
        // Mock score logic for stability
        res.json({ score: 750, factors: { onTimePayments: 100, creditUtilization: 10, creditAgeYears: 2 }, loans });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/add-loan', async (req, res) => {
    await new Loan({ ...req.body, startDate: new Date() }).save();
    res.json({ success: true });
});

app.listen(PORT, () => console.log(`🚀 Engine running on port ${PORT}`));