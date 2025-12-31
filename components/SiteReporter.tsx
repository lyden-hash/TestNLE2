
import React, { useState, useRef } from 'react';
import { generateSiteReport } from '../services/geminiService';
import { SiteReport } from '../types';

export const SiteReporter: React.FC = () => {
  const [reports, setReports] = useState<SiteReport[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewImage(event.target?.result as string);
      setMimeType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!userInput.trim() && !previewImage) {
      alert("Please provide a photo or a description.");
      return;
    }

    setIsGenerating(true);
    try {
      const base64 = previewImage ? previewImage.split(',')[1] : undefined;
      const reportData = await generateSiteReport(userInput, base64, mimeType || undefined);
      
      const newReport: SiteReport = {
        ...reportData,
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setReports([newReport, ...reports]);
      setUserInput('');
      setPreviewImage(null);
    } catch (err) {
      alert("Failed to generate report.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col space-y-10 animate-fade-in overflow-y-auto custom-scrollbar">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Site Reporter</h1>
          <p className="text-slate-400 mt-1">AI-assisted daily logs. Combine photos and notes into professional site reports.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Creation Panel */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 space-y-8 shadow-2xl">
            <h3 className="text-xs font-black text-white uppercase tracking-widest px-1">New Site Log</h3>
            
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Jobsite Observations</label>
              <textarea 
                placeholder="What happened on site today? List deliveries, crew counts, or any specific progress..."
                className="w-full bg-slate-950 border border-slate-800 rounded-3xl p-6 text-sm text-white outline-none focus:border-indigo-500 min-h-[160px] resize-none"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Site Photos</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative aspect-video rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                  previewImage ? 'border-indigo-500/50' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {previewImage ? (
                  <img src={previewImage} alt="Site Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-6">
                    <i className="fas fa-camera text-2xl text-slate-600 mb-2"></i>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Capture or Upload Photo</p>
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-3xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}
              Generate Professional Report
            </button>
          </div>
        </div>

        {/* History Panel */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-white uppercase tracking-widest px-1">Report History</h3>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-900 px-3 py-1 rounded-full">{reports.length} Logs</span>
          </div>

          <div className="space-y-6 pb-12">
            {reports.length === 0 ? (
              <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-[40px] p-20 text-center opacity-40">
                <i className="fas fa-clipboard-list text-5xl text-slate-700 mb-6"></i>
                <p className="text-sm font-medium text-slate-500">No reports generated yet. Start your daily log above.</p>
              </div>
            ) : reports.map(report => (
              <div key={report.id} className="bg-slate-900 border border-slate-800 rounded-[40px] overflow-hidden shadow-xl animate-in slide-in-from-bottom-4">
                <div className="bg-slate-800/40 px-8 py-6 flex justify-between items-center border-b border-slate-800">
                  <div>
                    <h4 className="text-lg font-bold text-white">{report.projectName}</h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{report.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase rounded-full border border-indigo-500/20">Daily Log</span>
                  </div>
                </div>
                
                <div className="p-8 grid grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <i className="fas fa-check-circle text-emerald-500"></i> Work Completed
                      </h5>
                      <ul className="space-y-1">
                        {report.workCompleted.map((w, i) => <li key={i} className="text-xs text-slate-300">• {w}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <i className="fas fa-triangle-exclamation text-amber-500"></i> Issues & Delays
                      </h5>
                      <ul className="space-y-1">
                        {report.issues.length > 0 ? report.issues.map((iss, i) => <li key={i} className="text-xs text-slate-300">• {iss}</li>) : <li className="text-xs text-slate-500 italic">No issues reported</li>}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <i className="fas fa-cloud-sun text-blue-400"></i> Weather & Conditions
                      </h5>
                      <p className="text-xs text-slate-300">{report.weather}</p>
                    </div>
                    <div>
                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <i className="fas fa-helmet-safety text-orange-400"></i> Safety Notes
                      </h5>
                      <p className="text-xs text-slate-300">{report.safetyObservations}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/50 p-8 pt-0">
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Executive Summary</h5>
                    <p className="text-sm text-slate-300 leading-relaxed italic">"{report.summary}"</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
