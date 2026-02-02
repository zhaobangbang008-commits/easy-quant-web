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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
      if (data) setMessages(data.map((msg: any) => ({ role: msg.role, content: msg.content })));
    };
    fetchHistory();
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

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
    <div className="flex h-screen font-sans text-slate-700 bg-[#f8fafc]">
      
      {/* --- 左侧侧边栏 (纯白背景，无黑线) --- */}
      <div className="w-[280px] bg-white flex flex-col shrink-0 shadow-sm z-10">
        <div className="p-5">
           {/* 紫色大按钮 (完全复刻参考图) */}
           <button className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-lg py-3 text-sm font-bold shadow-lg shadow-purple-200 transition-all mb-4">
             ✨ 获得积分
           </button>
           
           <button 
             onClick={() => {if(confirm('清空会话？')) setMessages([])}}
             className="w-full flex items-center gap-2 px-3 py-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors text-sm font-medium"
           >
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
             新建对话
           </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          <div className="px-3 py-2 text-xs font-bold text-slate-400">历史记录</div>
          <div className="px-3 py-3 text-sm text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer truncate transition-colors">
            上次写的双均线策略...
          </div>
        </div>

        <div className="p-4 border-t border-slate-50">
           <div className="flex items-center gap-3">
             <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">U</div>
             <div className="text-sm font-medium">用户 8826</div>
           </div>
        </div>
      </div>

      {/* --- 右侧主区域 --- */}
      <div className="flex-1 flex flex-col relative">
        
        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-4 scroll-smooth pb-40">
           {messages.length === 0 ? (
             // --- 首页 (复刻参考图: 大标题 + 悬浮卡片) ---
             <div className="max-w-4xl mx-auto flex flex-col items-center mt-20">
                
                {/* 标题 */}
                <h1 className="text-4xl font-extrabold text-slate-800 mb-2">EasyQuant</h1>
                <div className="bg-white px-3 py-1 rounded-full text-xs text-slate-500 border border-slate-100 shadow-sm mb-10">
                   生成式 AI 编程助手 <span className="text-purple-600 font-bold">V1.12.8</span>
                </div>

                {/* 巨大的输入框卡片 (无边框，全靠阴影) */}
                <div className="w-full bg-white rounded-2xl shadow-floating p-2 mb-8 relative group hover:shadow-xl transition-shadow duration-300">
                    <textarea 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {if(e.key === 'Enter' && !e.shiftKey) {e.preventDefault(); handleSend();}}}
                        placeholder="请输入您的策略想法..."
                        className="w-full p-6 min-h-[140px] resize-none focus:outline-none text-lg text-slate-700 placeholder:text-slate-300 bg-transparent"
                    />
                    {/* 底部工具栏 */}
                    <div className="flex justify-between items-center px-4 pb-2">
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 cursor-pointer hover:bg-slate-100">
                           <span>PTrade 国金版</span>
                           <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                        </div>
                        <button onClick={handleSend} className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-full p-2.5 shadow-lg shadow-purple-200 transition-transform active:scale-95">
                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                        </button>
                    </div>
                </div>

                {/* 底部快捷卡片 (白底 + 软阴影) */}
                <div className="grid grid-cols-2 gap-4 w-full">
                   <div onClick={() => setInput("写一个双均线策略")} className="bg-white p-6 rounded-xl shadow-card hover:shadow-md cursor-pointer transition-all border border-transparent hover:border-purple-100 group">
                      <div className="font-bold text-slate-800 mb-2 group-hover:text-purple-600">⚡️ 编写策略</div>
                      <p className="text-sm text-slate-400">MA5 上穿 MA10 买入...</p>
                   </div>
                   <div onClick={() => setInput("API 查询")} className="bg-white p-6 rounded-xl shadow-card hover:shadow-md cursor-pointer transition-all border border-transparent hover:border-purple-100 group">
                      <div className="font-bold text-slate-800 mb-2 group-hover:text-purple-600">📚 API 问题</div>
                      <p className="text-sm text-slate-400">如何获取账户资金...</p>
                   </div>
                </div>
             </div>
           ) : (
             // --- 聊天界面 ---
             <div className="max-w-4xl mx-auto space-y-8 py-6">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                     <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600'}`}>
                        {msg.role === 'user' ? 'Me' : 'AI'}
                     </div>
                     <div className={`px-6 py-4 rounded-2xl text-[15px] leading-relaxed shadow-sm max-w-[85%] ${
                        msg.role === 'user' 
                        ? 'bg-purple-600 text-white rounded-tr-sm' 
                        : 'bg-white text-slate-700 rounded-tl-sm'
                     }`}>
                        {msg.role === 'user' ? (
                           <div className="whitespace-pre-wrap">{msg.content}</div>
                        ) : (
                           <ReactMarkdown components={{
                               code({node, inline, className, children, ...props}: any) {
                                   const match = /language-(\w+)/.exec(className || '')
                                   return !inline && match ? (
                                       <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" customStyle={{borderRadius: '12px', margin: '1em 0'}} {...props}>
                                           {String(children).replace(/\n$/, '')}
                                       </SyntaxHighlighter>
                                   ) : (<code className="bg-slate-100 px-1 py-0.5 rounded text-purple-600 font-mono text-xs" {...props}>{children}</code>)
                               }
                           }}>{msg.content}</ReactMarkdown>
                        )}
                     </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
             </div>
           )}
        </div>

        {/* 聊天模式下的底部输入框 (也是悬浮卡片) */}
        {messages.length > 0 && (
            <div className="absolute bottom-6 left-0 right-0 px-4">
                <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-floating flex items-center p-2 border border-slate-100">
                    <input 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {if(e.key === 'Enter') handleSend()}}
                        placeholder="继续输入..."
                        className="flex-1 bg-transparent px-4 py-3 focus:outline-none text-slate-700"
                    />
                    <button onClick={handleSend} className="bg-purple-600 text-white rounded-xl p-2.5 shadow-md hover:bg-purple-700 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                    </button>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}