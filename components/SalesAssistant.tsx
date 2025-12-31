
import React, { useState, useRef, useEffect } from 'react';
import { streamSalesAdvice } from '../services/geminiService';
import { ChatMessage, Estimate, Customer } from '../types';

interface SalesAssistantProps {
  estimates: Estimate[];
  customers: Customer[];
}

export const SalesAssistant: React.FC<SalesAssistantProps> = ({ estimates, customers }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: "Hello Foreman. I'm your Closing Specialist. Our current pipeline is looking strong. Which project should we focus on winning today?",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: textToSend, timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const modelMsg: ChatMessage = { role: 'model', text: '', timestamp: Date.now() };
    setMessages([...newMessages, modelMsg]);

    try {
      let fullResponse = '';
      const stream = streamSalesAdvice(newMessages, { estimates, customers });
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === 'model') {
            last.text = fullResponse;
          }
          return updated;
        });
      }
    } catch (err) {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'model', text: "I'm sorry, I hit a snag in my strategy analysis. Please try again.", timestamp: Date.now() }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    "Negotiation tactics for GCs",
    "Draft follow-up for high-value bids",
    "How to handle 'too expensive' objection",
    "Identify cross-sell opportunities"
  ];

  return (
    <div className="flex h-full animate-fade-in overflow-hidden">
      {/* Sidebar: Tools */}
      <div className="w-80 border-r border-slate-800 bg-slate-900/30 p-8 space-y-8 overflow-y-auto custom-scrollbar">
        <div>
          <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6">Sales Arsenal</h3>
          <div className="space-y-3">
            {quickPrompts.map((prompt, i) => (
              <button 
                key={i}
                onClick={() => handleSend(prompt)}
                className="w-full text-left p-4 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group"
              >
                <p className="text-xs font-bold text-slate-300 group-hover:text-amber-400 transition-colors">{prompt}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-[32px] p-6">
          <div className="flex items-center gap-3 mb-4">
            <i className="fas fa-trophy text-amber-500"></i>
            <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Winning Streak</h4>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed font-medium italic">
            "Price is what you pay. Value is what you get. Focus on the risk reduction we offer Manhattan Construction."
          </p>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-950/50 backdrop-blur-xl">
        <header className="flex-none p-8 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 border border-amber-500/20">
              <i className="fas fa-comments-dollar"></i>
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest">Closing Specialist</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">AI Strategy Partner</p>
            </div>
          </div>
        </header>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar"
        >
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-2xl rounded-[32px] p-6 ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 rounded-tr-none' 
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
              }`}>
                <div className="text-sm leading-relaxed whitespace-pre-wrap prose prose-invert">
                  {msg.text || (isLoading && i === messages.length - 1 ? <i className="fas fa-ellipsis fa-fade"></i> : null)}
                </div>
                <div className={`text-[9px] mt-3 font-bold uppercase tracking-widest ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex-none p-8 pt-0">
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-2 flex items-center gap-2 focus-within:border-amber-500/50 transition-all shadow-2xl">
            <input 
              type="text"
              placeholder="Ask about a specific project or strategy..."
              className="flex-1 bg-transparent border-none outline-none text-white px-4 py-3 text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="w-12 h-12 bg-amber-600 hover:bg-amber-500 disabled:opacity-30 disabled:hover:bg-amber-600 text-white rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-amber-600/20"
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
