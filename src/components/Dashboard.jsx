import React, { useMemo, useEffect, useRef, useState } from 'react';
import axios from 'axios'; 
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { 
  ArrowUpCircle, ArrowDownCircle, Wallet, ShieldAlert, 
  LayoutDashboard, BrainCircuit, Loader2
} from 'lucide-react';
import gsap from 'gsap'; 

import TaxCard from './TaxCard';
import CibilScoreUI from './CibilScoreUI';
import SavingCard from './SavingCard';
import TradingBackground from './TradingBackground'; 

const COLORS = ['#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#F59E0B', '#EF4444', '#14b8a6', '#f43f5e', '#8b5cf6', '#ec4899'];
const HIGH_VALUE_THRESHOLD = 5000;
const SUSPICIOUS_KEYWORDS = ['bet', 'casino', 'crypto', 'dream11', 'unknown', 'cash', 'loan'];

const checkFraudRisk = (transaction) => {
  const flags = [];
  const rawAmount = String(transaction.amount).replace(/,/g, ''); 
  const amt = Math.abs(parseFloat(rawAmount));
  const desc = (transaction.description || "").toLowerCase();
  
  if (amt > HIGH_VALUE_THRESHOLD) flags.push('High Value');
  SUSPICIOUS_KEYWORDS.forEach(word => { if (desc.includes(word)) flags.push(`Suspicious: "${word}"`); });
  
  return flags.length > 0 ? flags : null;
};

const Dashboard = ({ userEmail = "aditya@gmail.com" }) => {
  const [activeTab, setActiveTab] = useState('overview'); 
  const [transactions, setTransactions] = useState([]); 
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  // 🟢 FIX: Dynamic Backend URL for Deployment
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/transactions/${userEmail}`);
        setTransactions(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    if (userEmail) fetchData();
  }, [userEmail, BACKEND_URL]);

  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".gsap-header", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" });
      if (activeTab === 'overview') {
        gsap.fromTo(".gsap-card", { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: "back.out(1.7)" });
      } else {
        gsap.fromTo(".gsap-intel-card", { scale: 0.98, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.15, duration: 0.5, ease: "power2.out" });
      }
    }, containerRef);
    return () => ctx.revert();
  }, [activeTab, loading]); 

  const summary = useMemo(() => {
    let income = 0, expense = 0;
    const categoryMap = {}, fraudList = [];
    if (!transactions || transactions.length === 0) return { income: 0, expense: 0, balance: 0, chartData: [], fraudList: [] };

    transactions.forEach(t => {
      const amt = Number(t.amount);
      if (isNaN(amt)) return;
      const risks = checkFraudRisk(t);
      if (risks) fraudList.push({ ...t, riskReasons: risks.join(', ') });

      if (t.type === 'income' || amt > 0) income += amt;
      else { 
          expense += Math.abs(amt); 
          const cat = t.category || "Uncategorized"; 
          categoryMap[cat] = (categoryMap[cat] || 0) + Math.abs(amt); 
      }
    });

    const chartData = Object.keys(categoryMap).map(key => ({ name: key, value: categoryMap[key] })).sort((a, b) => b.value - a.value);
    return { income, expense, balance: income - expense, chartData, fraudList };
  }, [transactions]);

  if (loading) return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center text-white space-y-4">
      <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
      <p className="text-lg font-mono text-emerald-400">Syncing Production Data...</p>
    </div>
  );

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-white p-6 md:p-12 font-sans relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-40 dark:opacity-30 pointer-events-none"><TradingBackground /></div>

      <header className="gsap-header mb-12 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-cyan-500">Financial Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Overview for <span className="text-emerald-500">{userEmail}</span></p>
        </div>
        <div className="flex items-center gap-2 bg-white/60 dark:bg-white/5 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
            <TabButton icon={LayoutDashboard} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
            <TabButton icon={BrainCircuit} label="Intelligence" active={activeTab === 'intelligence'} onClick={() => setActiveTab('intelligence')} />
        </div>
      </header>

      {activeTab === 'overview' && (
        <div className="relative z-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <SummaryCard title="Net Balance" amount={summary.balance} icon={Wallet} color="text-emerald-500" />
                <SummaryCard title="Total Income" amount={summary.income} icon={ArrowUpCircle} color="text-blue-500" />
                <SummaryCard title="Total Expenses" amount={summary.expense} icon={ArrowDownCircle} color="text-rose-500" isExpense />
                <RiskCard count={summary.fraudList.length} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="gsap-card lg:col-span-2 glass-panel p-6 h-[500px] flex flex-col bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                    <h3 className="text-xl font-bold mb-6 text-slate-800 dark:text-white">Recent Activity</h3>
                    <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 space-y-3">
                        {transactions.length > 0 ? (
                            transactions.map((t, i) => <TransactionItem key={i} t={t} />)
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500 italic">No historical data found.</div>
                        )}
                    </div>
                </div>

                {/* Spending Chart with Legend Fix */}
                <div className="gsap-card glass-panel p-6 h-[500px] flex flex-col bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                    <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-white">Spending Mix</h3>
                    <div className="flex-1">
                        {summary.chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={summary.chartData} 
                                        cx="50%" 
                                        cy="40%" // 🟢 Shifted up to prevent legend overlap
                                        innerRadius={60} 
                                        outerRadius={80} 
                                        dataKey="value" 
                                        paddingAngle={5}
                                    >
                                        {summary.chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    
                                    {/* 🟢 White Tooltip Fix */}
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', color: '#000', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                                        itemStyle={{ color: '#000' }} 
                                    />
                                    
                                    {/* 🟢 Legend Font & Layout Fix */}
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={100} 
                                        iconType="circle" 
                                        align="center"
                                        wrapperStyle={{ 
                                            fontSize: '11px', 
                                            paddingTop: '20px',
                                            color: '#94a3b8' 
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500 italic">Upload a statement to see the mix.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'intelligence' && (
         <div className="max-w-7xl mx-auto space-y-12 relative z-10">
             <div className="gsap-intel-card"><SavingCard userEmail={userEmail} /></div>
             <div className="gsap-intel-card"><CibilScoreUI userEmail={userEmail} /></div>
             <div className="gsap-intel-card"><TaxCard userEmail={userEmail} /></div>
         </div>
      )}
    </div>
  );
};

// Sub-components
const TabButton = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:bg-white/10'}`}>
    <Icon className="w-4 h-4" /> {label}
  </button>
);

const SummaryCard = ({ title, amount, icon: Icon, color, isExpense }) => (
  <div className="gsap-card p-6 flex flex-col justify-between h-32 relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md group hover:border-emerald-500/30 transition-colors">
    <div className={`absolute right-4 top-4 p-2 rounded-full bg-current opacity-10 ${color}`}><Icon className="w-6 h-6" /></div>
    <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider">{title}</span>
    <span className={`text-3xl font-bold ${color}`}>{isExpense && amount > 0 ? '-' : ''}{Number(amount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
  </div>
);

const RiskCard = ({ count }) => (
  <div className="gsap-card p-6 border-l-4 border-amber-500 flex flex-col justify-between h-32 rounded-2xl bg-white/5 border-t border-r border-b border-white/10 backdrop-blur-md">
    <div className="flex justify-between items-start">
        <div><span className="text-amber-500 font-bold uppercase text-xs tracking-wider">Risk Alerts</span><div className="text-3xl font-bold text-white mt-1">{count}</div></div>
        <ShieldAlert className="w-8 h-8 text-amber-500 animate-pulse" />
    </div>
  </div>
);

const TransactionItem = ({ t }) => (
  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
    <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${t.type==='income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>{t.category?.[0] || '?'}</div>
        <div><p className="font-semibold text-white">{t.description}</p><p className="text-xs text-slate-500">{t.date ? new Date(t.date).toLocaleDateString() : 'N/A'}</p></div>
    </div>
    <span className={`font-mono font-bold ${t.type==='income' ? 'text-emerald-400' : 'text-white'}`}>{t.type==='income'?'+':'-'}₹{Math.abs(Number(t.amount))}</span>
  </div>
);

export default Dashboard;
