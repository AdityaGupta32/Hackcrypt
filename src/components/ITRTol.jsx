import React, { useState } from 'react';
import axios from 'axios';
import { Calculator, Save, RefreshCw, FileText, CheckCircle, AlertTriangle, IndianRupee } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

const ITRTool = ({ userEmail }) => {
  const [formData, setFormData] = useState({
    ageGroup: '0-60',
    financialYear: '2023-24',
    salaryIncome: '',
    otherIncome: '',
    section80C: '',
    section80D: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
// inside ITRTool component

useEffect(() => {
    const fetchLastCalculation = async () => {
      try {
        // Create a GET route for this in your backend
        const res = await axios.get(`http://localhost:5000/api/itr/history/${userEmail}`);
        
        if (res.data.latestRecord) {
          // PRE-FILL THE FORM with database data
          setFormData({
              ageGroup: res.data.latestRecord.ageGroup,
              financialYear: res.data.latestRecord.financialYear,
              salaryIncome: res.data.latestRecord.incomeDetails.salaryIncome,
              otherIncome: res.data.latestRecord.incomeDetails.otherIncome,
              section80C: res.data.latestRecord.deductionsBreakdown.section80C,
              section80D: res.data.latestRecord.deductionsBreakdown.section80D
          });
          // Optionally show the last result immediately
          setResult(res.data.latestRecord); 
        }
      } catch (err) {
        console.log("No previous history found");
      }
    };
  
    fetchLastCalculation();
  }, [userEmail]);
  const calculateTax = async () => {
    setLoading(true);
    try {
      // 🟢 Connects to your existing Backend Engine
      const payload = {
        userId: userEmail,
        ageGroup: formData.ageGroup,
        financialYear: formData.financialYear,
        incomeDetails: {
          salaryIncome: Number(formData.salaryIncome),
          otherIncome: Number(formData.otherIncome),
        },
        deductions: {
          section80C: Number(formData.section80C),
          section80D: Number(formData.section80D)
        }
      };

      const response = await axios.post('http://localhost:5000/api/itr/calculate', payload);
      setResult(response.data.data);
    } catch (error) {
      console.error("Calculation Error", error);
    } finally {
      setLoading(false);
    }
  };

  // Chart Data for Result
  const chartData = result ? [
    { name: 'Tax', value: result.taxResult.taxAmount },
    { name: 'Cess/Surcharge', value: result.taxResult.cess + result.taxResult.surcharge },
    { name: 'Net Income', value: result.incomeDetails.grossTotalIncome - result.taxResult.totalTaxLiability }
  ] : [];

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in zoom-in duration-500">
      
      {/* 🟢 LEFT: INPUT FORM */}
      <div className="relative group h-fit">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 rounded-[2rem] opacity-50 blur group-hover:opacity-100 transition duration-1000 animate-gradient-xy"></div>
        
        <div className="relative glass-panel p-8 bg-white dark:bg-[#0f172a]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Calculator className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">ITR Simulator</h3>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Age Group</label>
                <select name="ageGroup" onChange={handleChange} className="input-field">
                  <option value="0-60">General (0-60)</option>
                  <option value="60-80">Senior (60-80)</option>
                  <option value="80+">Super Senior (80+)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Fin. Year</label>
                <select name="financialYear" onChange={handleChange} className="input-field">
                  <option value="2023-24">2023-24</option>
                  <option value="2024-25">2024-25</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10 pb-2">Income Sources</p>
              <input type="number" name="salaryIncome" placeholder="Salary Income (₹)" onChange={handleChange} className="input-field" />
              <input type="number" name="otherIncome" placeholder="Other Sources (₹)" onChange={handleChange} className="input-field" />
            </div>

            <div className="space-y-4">
              <p className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10 pb-2">Deductions</p>
              <input type="number" name="section80C" placeholder="80C (LIC, PF) - Max 1.5L" onChange={handleChange} className="input-field" />
              <input type="number" name="section80D" placeholder="80D (Medical Insurance)" onChange={handleChange} className="input-field" />
            </div>

            <button 
              onClick={calculateTax} 
              disabled={loading}
              className="w-full py-4 mt-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
              {loading ? 'Calculating...' : 'Calculate Tax'}
            </button>
          </div>
        </div>
      </div>

      {/* 🟢 RIGHT: RESULT CARD */}
      <div className="flex flex-col gap-6">
        {result ? (
          <>
            <div className="glass-panel p-8 bg-white dark:bg-[#0f172a] border-l-4 border-emerald-500">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Tax Liability</p>
                  <h2 className="text-4xl font-black text-slate-900 dark:text-white mt-2 flex items-center gap-1">
                    <IndianRupee className="w-8 h-8 text-emerald-500"/>
                    {result.taxResult.totalTaxLiability.toLocaleString()}
                  </h2>
                </div>
                <div className="px-4 py-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg text-emerald-700 dark:text-emerald-400 text-sm font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4" /> {result.itrFormType} Recommended
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl">
                  <p className="text-xs text-slate-500">Gross Income</p>
                  <p className="font-bold text-slate-900 dark:text-white">₹{result.incomeDetails.grossTotalIncome.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl">
                  <p className="text-xs text-slate-500">Taxable Income</p>
                  <p className="font-bold text-slate-900 dark:text-white">₹{result.taxResult.taxableIncome.toLocaleString()}</p>
                </div>
              </div>

              <div className="h-48 w-full">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={chartData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : (
          /* EMPTY STATE PLACEHOLDER */
          <div className="glass-panel p-8 flex flex-col items-center justify-center h-full text-center opacity-50">
            <Calculator className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ready to Calculate</h3>
            <p className="text-slate-500 text-sm">Enter your income details on the left to generate an instant tax report.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default ITRTool;