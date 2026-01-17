import React, { useState, useRef, useCallback, useEffect } from 'react';
import { UploadCloud, FileText, X, CheckCircle, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { gsap } from 'gsap';
import { useNavigate } from 'react-router-dom'; // 🟢 Import Router Hook

const FileUpload = ({ userEmail }) => { 
  const navigate = useNavigate(); // 🟢 Initialize Hook
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); 
  const [dragActive, setDragActive] = useState(false);
  
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
        gsap.fromTo(".upload-card", { x: -50, opacity: 0 }, { x: 0, opacity: 1, duration: 1, ease: "power3.out" });
        gsap.fromTo(".info-panel", { x: 50, opacity: 0 }, { x: 0, opacity: 1, duration: 1, delay: 0.3, ease: "power3.out" });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  // Handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFiles(e.dataTransfer.files);
  }, []);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) handleFiles(e.target.files);
  };

  const handleFiles = (newFiles) => {
    const fileArray = Array.from(newFiles);
    setFiles((prev) => [...prev, ...fileArray]);
    setUploadStatus(null);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 🟢 FIXED UPLOAD LOGIC
  const handleUpload = async () => {
    if (files.length === 0 || !userEmail) return; 
    setUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('userId', userEmail); 

    try {
        console.log(`📤 Uploading for: ${userEmail}`);
        
        // Ensure this matches your n8n or backend URL
        const response = await fetch('http://localhost:5678/webhook-test/transactions-analyze', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            setUploadStatus('success');
            setFiles([]); 
            
            console.log("✅ Success! Redirecting...");

            // 🟢 FORCE REDIRECT TO DASHBOARD
            setTimeout(() => {
                navigate('/dashboard'); 
            }, 1000); 

        } else {
            console.error("Server Error");
            setUploadStatus('error');
        }
    } catch (error) {
        console.error("Upload Error:", error);
        setUploadStatus('error');
    } finally {
        setUploading(false);
    }
  };

  return (
    <section id="upload" ref={containerRef} className="py-12 px-6 md:px-12 bg-slate-50 dark:bg-[#0b0f19] transition-colors duration-500 relative overflow-hidden">
      {/* Visuals */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
        <div className="upload-card relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 rounded-[2rem] opacity-50 blur group-hover:opacity-100 transition duration-1000 animate-gradient-xy"></div>
            <div className="relative glass-panel p-8 bg-white dark:bg-[#0f172a] h-full flex flex-col rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl">
                
                <div className="mb-6 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Upload Session</span>
                    <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-1 rounded">{userEmail}</span>
                </div>

                <div 
                    className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer flex-1 min-h-[250px] ${dragActive ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-300 dark:border-slate-700 hover:border-emerald-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                    onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={() => inputRef.current.click()}
                >
                    <input ref={inputRef} type="file" multiple className="hidden" onChange={handleChange} accept=".pdf,.csv,.xlsx" />
                    <div className="p-4 bg-emerald-100 dark:bg-emerald-500/20 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300"><UploadCloud className="w-8 h-8 text-emerald-600 dark:text-emerald-400" /></div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">Drop files here</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">or click to browse</p>
                </div>

                {files.length > 0 && (
                    <div className="mt-6 space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                        {files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10 animate-in slide-in-from-bottom-2 fade-in">
                                <div className="flex items-center gap-3"><FileText className="w-4 h-4 text-blue-500" /><span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[180px]">{file.name}</span></div>
                                <button onClick={(e) => { e.stopPropagation(); removeFile(index); }} className="text-slate-400 hover:text-rose-500"><X className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                )}

                {uploadStatus === 'success' && <div className="mt-4 p-3 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center gap-2 text-sm font-bold animate-in fade-in"><CheckCircle className="w-5 h-5" /> <span>Upload Complete! Opening Dashboard...</span></div>}
                {uploadStatus === 'error' && <div className="mt-4 p-3 bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 rounded-xl flex items-center gap-2 text-sm font-bold animate-in fade-in"><AlertCircle className="w-5 h-5" /> <span>Upload failed.</span></div>}

                <div className="mt-6">
                    <button onClick={handleUpload} disabled={files.length === 0 || !userEmail || uploading || uploadStatus === 'success'} className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${files.length === 0 || !userEmail || uploading || uploadStatus === 'success' ? 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed text-slate-500' : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-emerald-500/30 hover:scale-[1.02] active:scale-95'}`}>
                        {uploading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : uploadStatus === 'success' ? <><Loader2 className="w-5 h-5 animate-spin" /> Redirecting...</> : <><ShieldCheck className="w-5 h-5" /> Secure Upload</>}
                    </button>
                </div>
            </div>
        </div>
        <div className="info-panel space-y-8">
            <div><h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Secure Data <br /><span className="text-emerald-500">Ingestion Engine</span></h2><p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">Upload raw financial statements. AI normalizes data instantly.</p></div>
        </div>
      </div>
    </section>
  );
};
export default FileUpload;
