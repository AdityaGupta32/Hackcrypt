import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Plus, CreditCard, TrendingUp, AlertTriangle, CheckCircle, Clock, Loader2 } from 'lucide-react';

const CibilScoreUI = ({ userEmail }) => {
  const [data, setData] = useState(null);
  const [showAddLoan, setShowAddLoan] = useState(false);
  const [newLoan, setNewLoan] = useState({ lender: '', type: 'Personal', amount: '', outstanding: '' });

  const fetchData = async () => {
      if(!userEmail) return;
      try {
          const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/credit-health/${userEmail}`);
          setData(res.data);
      } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, [userEmail]);

  const handleAddLoan = async (e) => {
    e.preventDefault();
    await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/add-loan`, { ...newLoan, userId: userEmail }', { ...newLoan, userId: userEmail });
    setShowAddLoan(false);
    fetchData(); 
  };

  if (!data) return (
     <div className="p-6 text-gray-400 bg-white/5 rounded-2xl flex items-center gap-2">
         <Loader2 className="w-4 h-4 animate-spin"/> Loading Credit Health...
     </div>
  );

  const { score, loans, factors } = data;
  const gaugeData = [{ value: score - 300 }, { value: 900 - score }];
  const scoreColor = score > 750 ? '#10B981' : score > 650 ? '#FBBF24' : '#EF4444';

  return (
    <div className="w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* SCORE CARD */}
      <div className="lg:col-span-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col items-center">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-400" /> Credit Score</h3>
        
        <div className="w-64 h-32 relative mt-4">
          <ResponsiveContainer width="100%" height="200%">
            <PieChart>
              <Pie data={gaugeData} cx="50%" cy="50%" startAngle={180} endAngle={0} innerRadius={60} outerRadius={80} stroke="none" dataKey="value">
                <Cell fill={scoreColor} /><Cell fill="#374151" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute bottom-0 w-full text-center mb-2">
            <span className="text-5xl font-extrabold text-white">{score}</span>
            <p className="text-sm font-medium" style={{ color: scoreColor }}>{score > 750 ? 'EXCELLENT' : 'GOOD'}</p>
          </div>
        </div>

        <div className="w-full mt-8 space-y-3">
          <div className="flex justify-between text-sm text-gray-400">
            <span className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-500"/> On-Time Payments</span>
            <span className="text-white">{factors?.onTimePayments?.toFixed(0) || 0}%</span>
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span className="flex items-center gap-2"><AlertTriangle className="w-3 h-3 text-amber-500"/> Utilization</span>
            <span className="text-white">{factors?.creditUtilization?.toFixed(1) || 0}%</span>
          </div>
        </div>
      </div>

      {/* LOAN MANAGER */}
      <div className="lg:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2"><CreditCard className="w-5 h-5 text-purple-400" /> Active Loans</h3>
          <button onClick={() => setShowAddLoan(!showAddLoan)} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Plus className="w-4 h-4" /> Add Loan</button>
        </div>
        
        {showAddLoan && (
          <form onSubmit={handleAddLoan} className="mb-6 bg-black/40 p-4 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4 border border-white/5">
            <input placeholder="Lender" className="bg-white/10 text-white p-2 rounded" onChange={e => setNewLoan({...newLoan, lender: e.target.value})} required />
            <select className="bg-white/10 text-white p-2 rounded" onChange={e => setNewLoan({...newLoan, type: e.target.value})}><option className="bg-gray-900">Personal</option><option className="bg-gray-900">Home</option></select>
            <input type="number" placeholder="Amount" className="bg-white/10 text-white p-2 rounded" onChange={e => setNewLoan({...newLoan, outstanding: e.target.value, amount: e.target.value})} required />
            <button type="submit" className="bg-emerald-600 text-white rounded font-bold">Save</button>
          </form>
        )}

        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {loans && loans.map((loan, i) => (
              <div key={i} className="bg-black/20 p-4 rounded-xl flex justify-between items-center border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white/5 rounded-lg text-xl">💳</div>
                  <div><p className="text-white font-semibold">{loan.lender}</p><p className="text-xs text-gray-400">{loan.type} Loan</p></div>
                </div>
                <div className="text-right"><p className="text-white font-mono">₹{loan.outstanding?.toLocaleString()}</p><p className="text-xs text-emerald-400">Active</p></div>
              </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CibilScoreUI;
