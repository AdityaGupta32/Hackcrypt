import React, { useState, useEffect } from 'react';
import { Layers, LogOut, LayoutDashboard, Home } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import ThemeToggle from './ThemeToggle'; // Ensure you have this component

const Navbar = ({ user, setUser }) => {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll effect for transparent -> solid background
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLoginSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const userData = {
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture
      };

      setUser(userData);
      
      // Sync user with Backend (MongoDB)
      await axios.post('http://localhost:5000/api/auth/google', userData);
      
    } catch (error) {
      console.error("Login Failed", error);
    }
  };

  const handleLogout = () => {
    googleLogout();
    setUser(null);
    navigate('/'); // Force redirect to Home on logout
  };

  // Determine if we are on the Dashboard page
  const isDashboard = location.pathname === '/dashboard';

  return (
    <nav 
      className={`fixed top-0 w-full px-6 py-4 flex justify-between items-center z-50 transition-all duration-300 
      ${scrolled || isDashboard 
        ? 'backdrop-blur-xl bg-white/80 dark:bg-[#0a0a0a]/80 border-b border-gray-200 dark:border-white/10 shadow-sm' 
        : 'bg-transparent border-transparent'
      }`}
    >
      {/* 1. Logo (Clicking resets to Home) */}
      <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-600 dark:text-blue-400 group">
        <Layers className="w-8 h-8 group-hover:rotate-12 transition-transform" />
        <span className="text-gray-900 dark:text-white">FinFlow.ai</span>
      </Link>

      {/* 2. Center Navigation Links */}
      <div className="flex items-center gap-6">
        
        {/* HIDE links if on Dashboard, SHOW if on Home */}
        {!isDashboard && (
          <div className="hidden md:flex gap-6 text-sm font-medium text-gray-600 dark:text-gray-300">
            <a href="#process" className="hover:text-blue-600 dark:hover:text-white transition">Process</a>
            <a href="#upload" className="hover:text-blue-600 dark:hover:text-white transition">Upload</a>
          </div>
        )}

        {/* If on Dashboard, show "Back to Home" */}
        {isDashboard && (
           <Link to="/" className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-white">
              <Home className="w-4 h-4" /> Home
           </Link>
        )}

        {/* 3. Right Side Actions */}
        <div className="flex items-center gap-4">
            <ThemeToggle />

            {/* AUTHENTICATION */}
            {user ? (
              <div className="flex items-center gap-3 pl-4 border-l border-gray-300 dark:border-white/10">
                
                {/* Dashboard Shortcut (Only visible on Home) */}
                {!isDashboard && (
                    <Link 
                        to="/dashboard" 
                        className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                        <LayoutDashboard className="w-3 h-3" /> Dashboard
                    </Link>
                )}

                <img 
                  src={user.picture} 
                  alt="Profile" 
                  className="w-9 h-9 rounded-full border-2 border-white dark:border-white/10 shadow-sm"
                  title={`Signed in as ${user.name}`}
                />
                
                <button 
                  onClick={handleLogout}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="transform scale-90 sm:scale-100">
                <GoogleLogin
                  onSuccess={handleLoginSuccess}
                  onError={() => console.log('Login Failed')}
                  theme="filled_black"
                  shape="pill"
                  text="signin"
                />
              </div>
            )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;