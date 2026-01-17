import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ShieldCheck, Lock } from 'lucide-react';

// Components
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero';       
import Process from './components/ProcessFlow.jsx'; 
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';

const GOOGLE_CLIENT_ID = "731583654109-ljb1knd5rrhjvv3ipgriq66mr4qum457.apps.googleusercontent.com"; // 🔴 Put your ID here

const App = () => {
  // 🟢 FIX 1: Initialize state from LocalStorage
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('finflow_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // 🟢 FIX 2: Save to LocalStorage whenever 'user' changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('finflow_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('finflow_user');
    }
  }, [user]);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] transition-colors duration-300">
          
          <Navbar user={user} setUser={setUser} />

          <Routes>
            <Route path="/" element={
              <main className="pb-20">
                <Hero />
                <Process />
                
                <section id="upload" className="max-w-7xl mx-auto px-6 py-12 scroll-mt-28">
                   {user ? (
                      <div className="animate-fade-in-up">
                        <div className="flex items-center justify-center gap-2 mb-6">
                           <ShieldCheck className="w-5 h-5 text-emerald-500" />
                           <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Authenticated: {user.email}</span>
                        </div>
                        <FileUpload userEmail={user.email} />
                      </div>
                   ) : (
                      <div className="text-center p-12 bg-slate-900 rounded-3xl text-white">
                          <Lock className="w-8 h-8 mx-auto mb-4 text-gray-400" />
                          <h3 className="text-xl font-bold">Sign in to Upload</h3>
                      </div>
                   )}
                </section>
              </main>
            } />

            <Route path="/dashboard" element={
              user ? (
                <div className="pt-28 pb-12 max-w-7xl mx-auto px-6 animate-fade-in-up">
                  <Dashboard userEmail={user.email} />
                </div>
              ) : (
                <Navigate to="/" replace />
              )
            } />

          </Routes>
        </div>
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;
