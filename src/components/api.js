import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000'; // Match your PORT 5000

// 🟢 NEW: Fetch Raw Transactions (Fast Load)
export const fetchTransactions = async (userId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/transactions/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Tx Fetch Error:", error);
    return []; // Return empty array to prevent crashes
  }
};

// 🔵 EXISTING: Fetch AI Analysis (Credit, Savings, Tax)
export const fetchDashboardData = async (userId) => {
  try {
    // 1. Get Credit Health
    const creditReq = axios.get(`${API_BASE_URL}/api/credit-health/${userId}`);
    
    // 2. Get AI Savings Analysis (Gemini)
    const savingsReq = axios.post(`${API_BASE_URL}/api/analyze-savings`, { userId });

    // 3. Get AI Tax Analysis (Gemini)
    const taxReq = axios.post(`${API_BASE_URL}/analyze-tax`, { userId });

    // Execute all in parallel
    const [creditRes, savingsRes, taxRes] = await Promise.all([
      creditReq, 
      savingsReq, 
      taxReq
    ]);

    return {
      credit: creditRes.data,
      savings: savingsRes.data,
      tax: taxRes.data
    };
  } catch (error) {
    console.error("API Fetch Error:", error);
    return null;
  }
};