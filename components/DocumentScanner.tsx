
import React, { useState, useRef } from 'react';
import { analyzeDocumentImage } from '../services/geminiService';
import { LineItem, Estimate } from '../types';

interface DocumentScannerProps {
  estimates: Estimate[];
  onImport: (estimateId: string, items: Partial<LineItem>[]) => void;
}

export const DocumentScanner: React.FC<DocumentScannerProps> = ({ estimates, onImport }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [extractedItems, setExtractedItems] = useState<Partial<LineItem>[]>([]);
  const [targetEstimateId, setTargetEstimateId] = useState<string>(estimates[0]?.id || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      setImage(event.target?.result as string);
      
      setIsScanning(true);
      try {
        const items = await analyzeDocumentImage(base64, file.type);
        setExtractedItems(items);
      } catch (err) {
        alert("Failed to scan document. Please try a clearer image.");
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-8 h-full flex flex-col space-y-8 animate-fade-in overflow-y-auto custom-scrollbar">
      <header className="flex-none">
        <h1 className="text-3xl font-bold text-white tracking-tight">AI Document Scanner</h1>
        <p className="text-slate-400 mt-1">Upload site notes, invoices, or quotes to instantly extract project line items.</p>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Upload Zone */}
        <div className="flex flex-col space-y-6">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`relative aspect-[4/3] bg-slate-900 border-2 border-dashed rounded-[40px] flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
              image ? 'border-indigo-500/50' : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            {image ? (
              <>
                <img src={image} alt="Document Preview" className="w-full h-full object-contain opacity-60" />
                {isScanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40">
                    <div className="w-full h-1 bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,1)] absolute animate-[scan_2s_infinite]"></div>
                    <div className="bg-slate-900/90 px-6 py-4 rounded-3xl border border-slate-800 flex items-center gap-4 shadow-2xl backdrop-blur-xl">
                      <i className="fas fa-spinner fa-spin text-indigo-400"></i>
                      <span className="text-sm font-bold text-white uppercase tracking-widest">Processing Scope...</span>
                    </div>
                  </div>
                )}
                {!isScanning && (
                   <div className="absolute top-6 right-6 flex gap-2">
                     <button className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl text-white hover:bg-slate-800"><i className="fas fa-redo"></i></button>
                   </div>
                )}
              </>
            ) : (
              <div className="text-center p-12">
                <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center text-slate-500 mb-6 mx-auto group-hover:scale-110 transition-transform">
                  <i className="fas fa-cloud-upload-alt text-3xl"></i>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Drag & Drop Document</h3>
                <p className="text-slate-500 text-sm">PNG, JPG or PDF drawings and invoices supported.</p>
              </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Extraction Logic</h4>
            <div className="space-y-4">
               <div className="flex gap-4">
                 <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400"><i className="fas fa-text-height"></i></div>
                 <div>
                   <p className="text-xs font-bold text-white">OCR Engine</p>
                   <p className="text-[10px] text-slate-500 mt-0.5">High-precision text recognition for handwritten notes.</p>
                 </div>
               </div>
               <div className="flex gap-4">
                 <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400"><i className="fas fa-microchip"></i></div>
                 <div>
                   <p className="text-xs font-bold text-white">Gemini Analysis</p>
                   <p className="text-[10px] text-slate-500 mt-0.5">Semantic mapping of quantities and market rates.</p>
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Results Pane */}
        <div className="flex flex-col space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 flex-1 flex flex-col shadow-2xl backdrop-blur-sm bg-opacity-50">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xs font-black text-white uppercase tracking-widest">Extracted Items ({extractedItems.length})</h3>
               {extractedItems.length > 0 && (
                 <button onClick={() => setExtractedItems([])} className="text-slate-600 hover:text-red-400 transition-colors"><i className="fas fa-trash"></i></button>
               )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
              {extractedItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <i className="fas fa-receipt text-5xl mb-6 text-slate-700"></i>
                  <p className="text-sm font-medium text-slate-500">Scan a document to see extracted line items here.</p>
                </div>
              ) : extractedItems.map((item, i) => (
                <div key={i} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl group hover:border-indigo-500/30 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="text-sm font-black text-white">{item.name}</h5>
                    <span className="text-xs font-mono font-bold text-indigo-400 tabular-nums">${item.rate?.toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed mb-4">{item.description}</p>
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-600">
                    <span>Quantity: <span className="text-slate-300">{item.qty}</span></span>
                    <span className="text-indigo-500/50">Ext: ${(item.qty! * item.rate!).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            {extractedItems.length > 0 && (
              <div className="mt-8 pt-8 border-t border-slate-800 space-y-6">
                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Import Destination</label>
                   <select 
                    value={targetEstimateId}
                    onChange={(e) => setTargetEstimateId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-indigo-500"
                   >
                     {estimates.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                   </select>
                 </div>
                 <button 
                  onClick={() => onImport(targetEstimateId, extractedItems)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 group"
                 >
                   <i className="fas fa-file-import group-hover:translate-x-1 transition-transform"></i>
                   Import All Items to Project
                 </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
};
