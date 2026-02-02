'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { supabase } from '../lib/supabase';

type Message = {
  role: 'user' | 'ai';
  content: string;
};

export default function Home() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
      if (data) {
        setMessages(data.map((msg: any) => ({ role: msg.role, content: msg.content })));
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    await supabase.from('messages').insert([{ role: 'user', content: userMsg.content }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      const data = await response.json();
      const aiMsg: Message = { role: 'ai', content: data.reply || "AI 暂时没有回复..." };
      setMessages(prev => [...prev, aiMsg]);
      await supabase.from('messages').insert([{ role: 'ai', content: aiMsg.content }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "网络请求出错" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen font-sans text-slate-800 overflow-hidden">
      
      {/* --- 左侧侧边栏 (深色高级感) --- */}
      <div className="w-[280px] bg-sidebar-gradient text-slate-300 flex flex-col shrink-0 shadow-xl z-20">
        
        {/* Logo 区域 */}
        <div className="h-20 flex items-center px-6">
           <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 mr-3">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
           </div>
           <div>
             <div className="font-bold text-lg text-white tracking-wide">X-TradeBrain</div>
             <div className="text-[10px] text-slate-400">Pro Edition</div>
           </div>
        </div>

        {/* 新建对话按钮 (深色背景上的亮色按钮) */}
        <div className="px-5 mb-6">
          <button 
            onClick={() => { if(confirm('确定要清空当前屏幕吗？')) setMessages([]) }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10 backdrop-blur-sm group"
          >
            <span className="text-xl font-light group-hover:scale-110 transition-transform">+</span>
            <span className="text-sm font-medium">New Chat</span>
          </button>
        </div>

        {/* 历史记录 */}
        <div className="flex-1 overflow-y-auto px-4 space-y-1">
          <div className="px-2 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">History</div>
          <div className="px-3 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded-lg cursor-pointer transition-colors truncate">
            双均线策略编写...
          </div>
          <div className="px-3 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded-lg cursor-pointer transition-colors truncate">
            API 接口调试记录
          </div>
        </div>

        {/* 底部用户栏 */}
        <div className="p-4 bg-black/20 backdrop-blur-md">
          <div className="flex items-center gap-3">
             <div className="w-9 h-9 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 p-[2px]">
               <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-xs text-white">U</div>
             </div>
             <div className="text-sm">
                <div className="font-medium text-white">User 8826</div>
                <div className="text-xs text-emerald-400">● Online</div>
             </div>
          </div>
        </div>
      </div>

      {/* --- 右侧主界面 (浅色背景 + 玻璃质感) --- */}
      <div className="flex-1 flex flex-col relative bg-[#f8fafc]">
        
        {/* 顶部标题栏 (透明玻璃) */}
        <div className="h-16 flex items-center justify-between px-8 bg-white/70 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-10">
           <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
             AI Model: <span className="text-slate-800 font-bold">DeepSeek V3</span>
           </div>
           <div className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-medium border border-indigo-100">
             Token Balance: 120
           </div>
        </div>

        {/* 聊天内容区 */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 scroll-smooth pb-32">
           {messages.length === 0 ? (
             // 空状态 (带一点色彩装饰)
             <div className="h-full flex flex-col items-center justify-center -mt-10">
                <div className="w-24 h-24 bg-gradient-to-tr from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                   <svg className="w-12 h-12 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                </div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">How can I help you trade?</h1>
                <p className="text-slate-500 mb-8">Professional Quantitative Strategy Assistant</p>
                
                <div className="grid grid-cols-2 gap-4 w-full max-w-2xl px-6">
                   <button onClick={() => setInput("帮我写一个双均线策略")} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-left group">
                      <div className="text-indigo-600 mb-2 group-hover:scale-110 transition-transform origin-left">⚡️</div>
                      <div className="font-bold text-slate-700">编写策略</div>
                      <div className="text-xs text-slate-400 mt-1">均线交叉、MACD...</div>
                   </button>
                   <button onClick={() => setInput("如何查询账户资金？")} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-left group">
                      <div className="text-purple-600 mb-2 group-hover:scale-110 transition-transform origin-left">🔍</div>
                      <div className="font-bold text-slate-700">API 查询</div>
                      <div className="text-xs text-slate-400 mt-1">ContextInfo 函数用法...</div>
                   </button>
                </div>
             </div>
           ) : (
             // 消息气泡
             messages.map((msg, index) => (
               <div key={index} className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'ai' && (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-lg shadow-indigo-200 mt-1">Ai</div>
                  )}
                  
                  <div className={`rounded-2xl px-6 py-4 text-[15px] leading-relaxed shadow-sm max-w-[85%] ${
                    msg.role === 'user' 
                    ? 'bg-brand-gradient text-white rounded-tr-sm shadow-indigo-200' // 用户气泡用漂亮的渐变
                    : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm'
                  }`}>
                    {msg.role === 'user' ? (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                      <ReactMarkdown
                        components={{
                          code({node, inline, className, children, ...props}: any) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={oneDark}
                                language={match[1]}
                                PreTag="div"
                                customStyle={{ margin: '1em 0', borderRadius: '12px', fontSize: '13px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={`${className} bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs font-bold`} {...props}>
                                {children}
                              </code>
                            )
                          }
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
               </div>
             ))
           )}
           <div ref={messagesEndRef} />
        </div>

        {/* --- 底部输入区 (玻璃悬浮) --- */}
        <div className="absolute bottom-6 left-6 right-6 z-20">
           <div className="max-w-3xl mx-auto relative">
             {/* 毛玻璃背景层 */}
             <div className="absolute inset-0 bg-white/80 backdrop-blur-xl rounded-2xl shadow-glass border border-white/20"></div>
             
             {/* 输入框本体 */}
             <textarea 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => {
                 if (e.key === 'Enter' && !e.shiftKey) {
                   e.preventDefault();
                   handleSend();
                 }
               }}
               placeholder="Tell me your strategy idea..."
               className="relative w-full pl-6 pr-14 py-4 bg-transparent resize-none focus:outline-none text-slate-700 placeholder:text-slate-400 min-h-[60px] max-h-[150px] rounded-2xl z-10"
               rows={1}
             />
             <button 
               onClick={handleSend}
               disabled={!input.trim() || isLoading}
               className={`absolute bottom-3 right-3 p-2 rounded-xl transition-all z-20 ${
                 input.trim() 
                   ? 'bg-brand-gradient text-white shadow-lg shadow-indigo-300 hover:scale-105' 
                   : 'bg-slate-200 text-slate-400'
               }`}
             >
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
             </button>
           </div>
        </div>

      </div>
    </div>
  );
}