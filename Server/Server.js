require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 🔴 SAFETY CHECK
if (!process.env.MONGO_URI || !process.env.GEMINI_API_KEY) {
    console.error("❌ MISSING ENV VARIABLES: Check MONGO_URI and GEMINI_API_KEY in .env");
    process.exit(1);
}

const app = express();
const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_123'; // Add JWT_SECRET to your .env for production

// 🟢 MIDDLEWARE
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 1. Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// ---------------------------------------------------------
// 🟢 MODELS
// ---------------------------------------------------------

// User Model
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Transaction Model
const TransactionSchema = new mongoose.Schema({}, { strict: false });
const Transaction = mongoose.models.transactions || mongoose.model('transactions', TransactionSchema, 'transactions');

// Savings Record (AI Cache)
const SavingsSchema = new mongoose.Schema({ userId: String, monthlyIncome: Number, monthlyExpense: Number, currentSavings: Number, potentialSavings: Number, wastefulSpends: [String], aiAdvice: String, timestamp: { type: Date, default: Date.now } });
const SavingsRecord = mongoose.models.SavingsRecord || mongoose.model('SavingsRecord', SavingsSchema);

// Tax Record (AI Cache)
const TaxSchema = new mongoose.Schema({ userId: String, totalIncome: Number, oldRegimeTax: Number, newRegimeTax: Number, savings: Number, recommendation: String, detectedDeductions: Object, savingsSuggestion: String, taxTips: [String], timestamp: { type: Date, default: Date.now } });
const TaxRecord = mongoose.models.TaxRecord || mongoose.model('TaxRecord', TaxSchema);

// ---------------------------------------------------------
// 🟢 HELPER FUNCTIONS
// ---------------------------------------------------------

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const callGeminiWithRetry = async (url, payload, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await axios.post(url, payload, { headers: { 'Content-Type': 'application/json' } });
            return response;
        } catch (error) {
            if (error.response && error.response.status === 429) {
                console.warn(`⚠️ Gemini Rate Limit (429). Retrying in ${2 * (i + 1)}s...`);
                await delay(2000 * (i + 1));
            } else {
                throw error;
            }
        }
    }
    throw new Error("Gemini API Rate Limit Exceeded after retries.");
};

// 🟢 TAX CALCULATORS
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
    const sec80tta = Math.min(deductions['80tta'] || 0, 10000); 
    const sec80ccd = Math.min(deductions['80ccd'] || 0, 50000); 
    const others = (deductions['80g'] || 0) + (deductions['80e'] || 0) + (deductions['hra'] || 0);
    const totalDeductions = sec80c + sec80d + sec24b + sec80tta + sec80ccd + others;
    let taxable = Math.max(0, income - 50000 - totalDeductions); 
    if (taxable <= 250000) return 0;
    if (taxable <= 500000) return (taxable - 250000) * 0.05;
    if (taxable <= 1000000) return 12500 + (taxable - 500000) * 0.20;
    return 112500 + (taxable - 1000000) * 0.30;
};

// ---------------------------------------------------------
// 🟢 ROUTES
// ---------------------------------------------------------

// 1. REGISTER (Secure)
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ success: false, message: "User already exists" });

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        // Create Token
        const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '1h' });

        console.log(`✅ New User Registered: ${email}`);
        res.json({ success: true, token, user: { id: newUser._id, name: newUser.name, email: newUser.email } });
    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// 2. LOGIN (Secure)
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ success: false, message: "Invalid credentials" });

        // Check Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });

        // Create Token
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

        console.log(`🔓 User Logged In: ${email}`);
        res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// 3. CHECK DATA
app.get('/api/check-data/:userId', async (req, res) => {
    try {
        const count = await Transaction.countDocuments({ userId: req.params.userId });
        res.json({ hasData: count > 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. FETCH TRANSACTIONS
app.get('/api/transactions/:userId', async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.params.userId }).sort({ date: -1 });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. UPLOAD & SAVE
app.post('/api/upload-and-save', async (req, res) => {
    const { userId, parsedTransactions } = req.body;
    try {
        if (!parsedTransactions || parsedTransactions.length === 0) {
            return res.status(400).json({ error: "No transactions to save" });
        }
        const taggedData = parsedTransactions.map(t => ({ ...t, userId, date: new Date(t.date) }));
        await Transaction.insertMany(taggedData);
        console.log(`💾 Saved ${taggedData.length} transactions for user ${userId}`);
        res.json({ success: true, message: "Data Saved Permanently" });
    } catch (err) {
        console.error("Upload Error:", err);
        res.status(500).json({ error: "Failed to save data" });
    }
});

// 6. ANALYZE SAVINGS (AI + Cache + Retry)
app.post('/api/analyze-savings', async (req, res) => {
    try {
        const { userId } = req.body;
        
        // Cache Check (24h)
        const cache = await SavingsRecord.findOne({ userId, timestamp: { $gte: new Date(Date.now() - 86400000) } }).sort({ timestamp: -1 });
        if (cache) {
            console.log("⚡ Serving Savings from Cache");
            return res.json(cache);
        }

        const txns = await Transaction.find({ userId }).sort({ date: -1 }).limit(50);
        if (txns.length === 0) return res.status(200).json({ aiAdvice: "Start spending to get advice!" });

        const summary = txns.map(t => `${t.description}: ${t.amount} (${t.category})`).join("\n");
        const prompt = `Analyze: ${summary}. Return JSON: { "monthly_income": number, "monthly_expense": number, "potential_savings": number, "wasteful_spends": ["string"], "ai_advice": "string" }`;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        
        const response = await callGeminiWithRetry(url, { contents: [{ parts: [{ text: prompt }] }] });
        const text = response.data.candidates[0].content.parts[0].text;
        const aiData = JSON.parse(text.match(/\{[\s\S]*\}/)[0]);

        const record = new SavingsRecord({ userId, ...aiData, currentSavings: (aiData.monthly_income - aiData.monthly_expense) });
        await record.save();
        res.json(record);
    } catch (err) {
        console.error("Savings AI Error:", err.message);
        res.status(500).json({ error: "AI Service Failed" });
    }
});

// 7. ANALYZE TAX (AI + Cache + Retry)
// Note: Matches 'axios.post(http://localhost:5000/analyze-tax)' in your TaxCard
app.post('/analyze-tax', async (req, res) => {
    try {
        const { userId } = req.body;

        // Cache Check
        const cache = await TaxRecord.findOne({ userId, timestamp: { $gte: new Date(Date.now() - 86400000) } }).sort({ timestamp: -1 });
        if (cache) {
            console.log("⚡ Serving Tax from Cache");
            return res.json({
                analysis: { total_income: cache.totalIncome, detected_deductions: cache.detectedDeductions, savings_suggestion: cache.savingsSuggestion, tax_tips: cache.taxTips },
                tax_comparison: { old_regime_tax: cache.oldRegimeTax, new_regime_tax: cache.newRegimeTax, savings: cache.savings, recommendation: cache.recommendation }
            });
        }

        const rawTxns = await Transaction.find({ userId }).limit(80);
        if (rawTxns.length === 0) return res.status(404).json({ error: "No transactions found" });

        const summary = rawTxns.map(t => `${t.description}: ${t.amount}`).join("\n");
        const prompt = `Act as Financial Advisor. Analyze: ${summary}. Return JSON: { "total_income": number, "deductions_80c": number, "deductions_80d": number, "deductions_24b": number, "deductions_80ccd": number, "deductions_80g": number, "deductions_80tta": number, "deductions_80e": number, "hra_exemption": number, "findings": ["strings"], "savings_suggestion": "string", "tax_tips": ["strings"] }`;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        
        const response = await callGeminiWithRetry(url, { contents: [{ parts: [{ text: prompt }] }] });
        const aiData = JSON.parse(response.data.candidates[0].content.parts[0].text.match(/\{[\s\S]*\}/)[0]);

        // Helpers
        const income = aiData.total_income || 0;
        const deductionMap = { '80c': aiData.deductions_80c, '80d': aiData.deductions_80d, 'hra': aiData.hra_exemption, 'sources': aiData.findings };
        const taxNew = Math.floor(calculateNewRegime(income));
        const taxOld = Math.floor(calculateOldRegime(income, deductionMap));

        const taxEntry = new TaxRecord({
            userId,
            totalIncome: income,
            oldRegimeTax: taxOld,
            newRegimeTax: taxNew,
            savings: Math.abs(taxNew - taxOld),
            recommendation: taxNew <= taxOld ? "New Regime" : "Old Regime",
            detectedDeductions: deductionMap,
            savingsSuggestion: aiData.savings_suggestion,
            taxTips: aiData.tax_tips
        });

        await taxEntry.save();
        res.json({
            analysis: { total_income: income, detected_deductions: deductionMap, savings_suggestion: aiData.savings_suggestion, tax_tips: aiData.tax_tips },
            tax_comparison: { old_regime_tax: taxOld, new_regime_tax: taxNew, savings: taxEntry.savings, recommendation: taxEntry.recommendation }
        });

    } catch (error) {
        console.error("Tax AI Error:", error.message);
        res.status(500).json({ error: "AI Service Failed" });
    }
});

// 8. GET ITR DATA
app.get('/api/get-itr-data/:userId', async (req, res) => {
    try {
        const record = await TaxRecord.findOne({ userId: req.params.userId }).sort({ timestamp: -1 });
        if (!record) return res.status(404).json({ error: "No tax record found" });
        res.json(record);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));