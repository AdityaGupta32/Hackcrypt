import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calculator, TrendingDown, CheckCircle2, IndianRupee, AlertCircle, Loader2 } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

const COLORS = ['#34D399', '#60A5FA', '#FBBF24', '#F87171'];

const TaxCard = ({ userEmail }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🟢 FETCH FUNCTION
  useEffect(() => {
    const fetchTax = async () => {
        if (!userEmail) return;
        setLoading(true);
        try {
            const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/analyze-tax`, { userId: userEmail });
            setData(res.data);
        } catch (err) {
            console.error("Tax Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };
    fetchTax();
  }, [userEmail]);

  // Loading State
  if (loading) return (
     <div className="glass-panel p-8 flex flex-col items-center justify-center animate-pulse min-h-[300px] bg-white/5 border border-white/10 rounded-3xl">
        <Loader2 className="w-8 h-8 text-blue-400 mb-3 animate-spin" />
        <p className="text-gray-400 font-medium">Calculating Tax Regimes...</p>
     </div>
  );

  // Empty/Error State
  if (!data || !data.tax_comparison) {
    return (
      <div className="glass-panel p-6 border border-yellow-500/20 bg-yellow-500/10 rounded-2xl text-yellow-500 flex items-center justify-center gap-3">
        <AlertCircle className="w-5 h-5" /> 
        <span>Tax analysis unavailable. Please upload a statement first.</span>
      </div>
    );
  }

  // Destructure Data
  const { tax_comparison, analysis } = data;
  
  const oldTax = tax_comparison.old_regime_tax || 0;
  const newTax = tax_comparison.new_regime_tax || 0;
  const savings = tax_comparison.savings || 0;
  const recommendation = tax_comparison.recommendation || "New Regime";
  
  const taxComparisonData = [
    { name: 'Old', tax: oldTax },
    { name: 'New', tax: newTax },
  ];

  const detectedDeductions = analysis?.detected_deductions || {};
  const deductionData = [
    { name: '80C', value: detectedDeductions['80c'] || 0 },
    { name: '80D', value: detectedDeductions['80d'] || 0 },
    { name: 'HRA', value: detectedDeductions['hra'] || 0 },
  ].filter(item => item.value > 0);

  return (
    <div className="glass-panel p-8 relative overflow-hidden bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                <Calculator className="w-6 h-6" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-white">Tax Intelligence</h2>
                <p className="text-xs text-gray-400 uppercase tracking-wider"> AI-Powered Optimization</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* 1. VERDICT CARD */}
            <div className="lg:col-span-2 relative p-8 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-20"><TrendingDown className="w-48 h-48" /></div>
                
                <div className="relative z-10">
                    <p className="text-blue-100 font-bold uppercase text-xs tracking-widest mb-2">Recommended Strategy</p>
                    <h3 className="text-4xl font-black mb-6">
                        Switch to <span className="text-yellow-300 underline decoration-wavy decoration-white/30">{recommendation}</span>
                    </h3>
                    
                    <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl">
                        <span className="text-blue-100 font-medium">Potential Savings</span>
                        <span className="text-3xl font-bold text-white flex items-center">
                            <IndianRupee className="w-6 h-6" /> {savings.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. FINDINGS LIST */}
            <div className="bg-white/5 rounded-3xl p-6 border border-white/5 flex flex-col">
                <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Detected Deductions
                </h4>
                <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar max-h-40 pr-2">
                    {detectedDeductions.sources && detectedDeductions.sources.length > 0 ? (
                        detectedDeductions.sources.map((item, i) => (
                            <div key={i} className="px-3 py-2 bg-white/5 border border-white/5 rounded-lg text-sm text-gray-300">
                                {item}
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500 italic">No deductions detected automatically.</p>
                    )}
                </div>
                <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-xs text-gray-500 uppercase">Est. Total Income</p>
                      <p className="text-xl font-mono font-bold text-white">₹{(analysis?.total_income || 0).toLocaleString()}</p>
                </div>
            </div>

            {/* 3. CHARTS */}
            <div className="h-64 bg-white/5 rounded-3xl p-4 border border-white/5">
                <h4 className="text-sm font-bold text-gray-500 uppercase mb-4 text-center">Regime Comparison</h4>
                <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={taxComparisonData}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: '#fff' }} />
                        <Bar dataKey="tax" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="h-64 bg-white/5 rounded-3xl p-4 border border-white/5">
                <h4 className="text-sm font-bold text-gray-500 uppercase mb-4 text-center">Deductions Breakdown</h4>
                 {deductionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="85%">
                        <PieChart>
                            <Pie data={deductionData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                                {deductionData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                            </Pie>
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: '#fff' }} />
                        </PieChart>
                    </ResponsiveContainer>
                 ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 text-sm">No Deductions Found</div>
                 )}
            </div>

        </div>
    </div>
  );
};

export default TaxCard;
