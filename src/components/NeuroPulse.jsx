import React from 'react';

const NeuroPulse = ({ className }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Outer Pulse Ring */}
      <div className="absolute w-full h-full rounded-full bg-blue-500/20 animate-ping"></div>
      
      {/* Inner Rotating Ring */}
      <div className="absolute w-3/4 h-3/4 rounded-full border-2 border-dashed border-blue-400 animate-[spin_3s_linear_infinite]"></div>
      
      {/* Core Brain/Network Node */}
      <div className="relative z-10 w-1/2 h-1/2 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full shadow-lg shadow-blue-500/50 flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-1/2 h-1/2 text-white animate-pulse">
          <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
          <path d="M12 12 2.5 7.5" />
          <path d="M12 12 12 22" />
          <path d="M12 12 21.5 7.5" />
        </svg>
      </div>
    </div>
  );
};

export default NeuroPulse;