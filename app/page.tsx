'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { supabase } from '../lib/supabase';

type Message = { role: 'user' | 'ai'; content: string; };

export default function Home() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
      if (data) setMessages(data.map((msg: any) => ({ role: msg.role, content: msg.content })));
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
        body: JSON.stringify({ message: userMsg.content }),
      });
      const data = await response.json();
      const aiMsg: Message = { role: 'ai', content: data.reply };
      setMessages(prev => [...prev, aiMsg]);
      await supabase.from('messages').insert([{ role: 'ai', content: aiMsg.content }]);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  return (
    <div className="flex h-screen bg-white text-slate-900 font-sans">
      
      {/* --- 左侧侧边栏 (极简灰蓝) --- */}
      <div className="w-[260px] bg-[#f9fafb] flex flex-col shrink-0 border-r border-slate-100">
        <div className="p-4">
          <button 
            onClick={() => {if(confirm('清空对话？')) setMessages([])}}
            className="w-full bg-[#5850ec] hover:bg-[#4e46e5] text-white rounded-lg py-3 text-sm font-medium shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <span className="text-lg">+</span> 新建对话
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          <div className="px-3 py-4 text-xs font-semibold text-slate-400">最近历史</div>
          <div className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-200/50 rounded-md cursor-pointer truncate transition-colors">
            双均线策略编写...
          </div>
        </div>

        {/* 用户底部信息栏 (仿图) */}
        <div className="p-4 border-t border-slate-200 flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center text-white font-bold text-xs">N</div>
          <div className="text-xs">
            <div className="font-bold text-slate-700">用户 8826</div>
            <div className="text-slate-400">积分: 121</div>
          </div>
        </div>
      </div>

      {/* --- 右侧主区域 (纯白) --- */}
      <div className="flex-1 flex flex-col relative bg-white">
        
        {/* 顶部简单的标题栏 */}
        <div className="h-14 flex items-center px-6 border-b border-slate-50">
           <div className="font-bold text-lg text-slate-800 flex items-center gap-2">
             X-TradeBrain <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-400 font-normal">V1.12.8</span>
           </div>
        </div>

        {/* 聊天内容区 */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 scroll-smooth pb-44">
           {messages.length === 0 ? (
             // --- 首页状态 (极简居中) ---
             <div className="h-full flex flex-col items-center justify-center -mt-20">
                <h1 className="text-5xl font-extrabold text-[#111827] mb-4">X-TradeBrain</h1>
                <p className="text-slate-400 text-lg mb-12">已接入 DeepSeek 大模型</p>
                
                {/* 快捷按钮卡片 (带浅边框) */}
                <div onClick={() => setInput("写一个双均线策略")} className="w-full max-w-sm border border-slate-200 rounded-2xl p-6 cursor-pointer hover:bg-slate-50 transition-all text-left group">
                   <div className="font-bold text-slate-800 mb-1 group-hover:text-[#5850ec]">编写策略</div>
                   <div className="text-sm text-slate-400">编写一个双均线策略...</div>
                </div>
             </div>
           ) : (
             // --- 聊天模式 ---
             <div className="max-w-4xl mx-auto space-y-8">
               {messages.map((msg, idx) => (
                 <div key={idx} className={`flex gap-6 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* 头像 */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${msg.role === 'user' ? 'bg-slate-800 text-white' : 'bg-[#5850ec] text-white'}`}>
                            {msg.role === 'user' ? 'U' : 'X'}
                        </div>
                        {/* 内容 */}
                        <div className={`leading-relaxed text-sm ${msg.role === 'user' ? 'bg-slate-50 p-4 rounded-2xl text-slate-800' : 'text-slate-700 py-2'}`}>
                            <ReactMarkdown components={{
                                code({node, inline, className, children, ...props}: any) {
                                    const match = /language-(\w+)/.exec(className || '')
                                    return !inline && match ? (
                                        <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" customStyle={{borderRadius: '12px', margin: '1em 0'}} {...props}>
                                            {String(children).replace(/\n$/, '')}
                                        </SyntaxHighlighter>
                                    ) : (<code className="bg-slate-100 px-1 py-0.5 rounded text-[#5850ec] font-mono text-xs" {...props}>{children}</code>)
                                }
                            }}>{msg.content}</ReactMarkdown>
                        </div>
                    </div>
                 </div>
               ))}
               <div ref={messagesEndRef} />
             </div>
           )}
        </div>

        {/* --- 底部输入区 (完全复刻: 居中、白底卡片、右侧紫色发送按钮) --- */}
        <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-white via-white to-transparent">
           <div className="max-w-4xl mx-auto relative bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center px-6 py-4 focus-within:ring-1 focus-within:ring-[#5850ec]/20 transition-all">
             <textarea 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => {if(e.key === 'Enter' && !e.shiftKey) {e.preventDefault(); handleSend();}}}
               placeholder="请输入您的策略想法，按回车发送..."
               className="flex-1 bg-transparent resize-none focus:outline-none text-slate-700 text-base"
               rows={1}
             />
             <button 
                onClick={handleSend} 
                disabled={!input.trim()}
                className="ml-4 bg-[#5850ec] hover:bg-[#4e46e5] text-white rounded-lg px-6 py-2.5 text-sm font-medium disabled:opacity-30 transition-all active:scale-95"
             >
               发送
             </button>
           </div>
           <p className="text-center text-[10px] text-slate-300 mt-4 tracking-wider">AI 生成的代码仅作为技术参考。</p>
        </div>

      </div>
    </div>
  );
}