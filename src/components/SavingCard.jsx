import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PiggyBank, RefreshCw, Scissors, Sparkles, TrendingUp, Wallet, Loader2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell } from 'recharts';

const SavingCard = ({ userEmail }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🟢 FETCH FUNCTION
  const fetchSavings = async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      // Calls your backend AI endpoint
      const res = await axios.post('http://localhost:5000/api/analyze-savings', { userId: userEmail });
      setData(res.data);
    } catch (err) { 
      console.error("Savings Fetch Error", err); 
    } finally { 
      setLoading(false); 
    }
  };

  // 🟢 Trigger fetch on mount
  useEffect(() => { fetchSavings(); }, [userEmail]);

  // Loading State
  if (loading) return (
    <div className="glass-panel p-8 flex flex-col items-center justify-center animate-pulse min-h-[300px] bg-white/5 border border-white/10 rounded-3xl">
        <Loader2 className="w-8 h-8 text-pink-400 mb-3 animate-spin" />
        <p className="text-gray-400 font-medium">Gemini is analyzing your spending habits...</p>
    </div>
  );

  // Empty State (Before AI Run)
  if (!data) return (
    <div className="glass-panel p-8 flex flex-col items-center justify-center text-center min-h-[300px] bg-white/5 border border-white/10 rounded-3xl">
        <PiggyBank className="w-12 h-12 text-pink-500 mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Unlock Savings Potential</h3>
        <p className="text-gray-400 text-sm mb-6 max-w-md">Let our AI analyze your transaction history to find wasteful subscriptions and suggest a better budget.</p>
        <button onClick={fetchSavings} className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-full font-bold transition-all shadow-lg shadow-pink-500/30">
            Generate AI Plan
        </button>
    </div>
  );

  const current = data.currentSavings || 0;
  const potential = data.potentialSavings || 0;
  const chartData = [{ name: 'Now', amount: current }, { name: 'Goal', amount: current + potential }];

  return (
    <div className="glass-panel p-8 relative overflow-hidden bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl">
      {/* Background Icon */}
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <Wallet className="w-64 h-64 text-white" />
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-8 relative z-10">
        <div className="flex items-center gap-3">
             <div className="p-3 bg-pink-500/10 rounded-xl text-pink-400">
                <Sparkles className="w-6 h-6" />
             </div>
             <div>
                <h3 className="text-xl font-bold text-white">Smart Savings</h3>
                <p className="text-xs text-gray-400 uppercase tracking-wider">AI-Driven Advisor</p>
             </div>
        </div>
        <button onClick={fetchSavings} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        
        {/* LEFT: GEMINI ADVICE */}
        <div className="space-y-6">
           <div className="p-6 rounded-3xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20">
              <p className="text-pink-300 text-xs uppercase font-bold mb-3 tracking-widest flex items-center gap-2">
                 ⚡ Gemini Insight
              </p>
              <p className="text-lg text-gray-100 font-medium italic leading-relaxed">
                "{data.aiAdvice || "Reviewing your recent transactions..."}"
              </p>
           </div>

           <div>
              <p className="text-gray-500 text-xs uppercase font-bold mb-3 flex items-center gap-2">
                 <Scissors className="w-4 h-4 text-red-500" /> Wasteful Spends Detected
              </p>
              <div className="flex flex-wrap gap-2">
                 {data.wastefulSpends && data.wastefulSpends.length > 0 ? (
                     data.wastefulSpends.map((item, i) => (
                       <span key={i} className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded-full font-bold">
                         {item}
                       </span>
                     ))
                 ) : <span className="text-gray-500 text-sm italic">No obvious waste found. Good job!</span>}
              </div>
           </div>
        </div>

        {/* RIGHT: CHART */}
        <div className="bg-black/20 rounded-3xl p-6 border border-white/5 flex flex-col justify-between">
           <div className="flex justify-between items-end mb-4">
              <div>
                  <p className="text-gray-500 text-xs uppercase font-bold">Current Monthly Savings</p>
                  <p className="text-2xl font-black text-white">₹{current.toLocaleString()}</p>
              </div>
              <div className="text-right">
                  <p className="text-emerald-500 text-xs uppercase font-bold flex items-center justify-end gap-1">
                      Potential <TrendingUp className="w-3 h-3" />
                  </p>
                  <p className="text-2xl font-black text-emerald-500">₹{(current + potential).toLocaleString()}</p>
              </div>
           </div>

           <div className="h-40 w-full" style={{ minHeight: '160px' }}>
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#333', color: '#fff' }} />
                    <Bar dataKey="amount" barSize={32} radius={[0, 6, 6, 0]}>
                       <Cell fill="#64748b" /> {/* Current */}
                       <Cell fill="#10b981" /> {/* Potential */}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

      </div>
    </div>
  );
};

export default SavingCard;