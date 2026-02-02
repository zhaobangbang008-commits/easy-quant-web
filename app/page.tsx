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
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full font-sans">
      
      {/* --- 左侧侧边栏 (深色) --- */}
      <div className="w-[260px] bg-[#0f172a] text-slate-300 flex flex-col shrink-0 border-r border-white/5">
        <div className="h-16 flex items-center px-6 font-bold text-white text-lg tracking-wider border-b border-white/5">
          X-TB <span className="text-xs bg-indigo-600 px-1.5 rounded ml-2">PRO</span>
        </div>
        
        <div className="p-4">
            <button onClick={() => {if(confirm('清空会话？')) setMessages([])}} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2.5 text-sm font-medium transition-all shadow-glow">
                + 新建对话
            </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
            <div className="px-3 py-2 text-xs font-bold text-slate-500">HISTORY</div>
            <div className="px-3 py-2 hover:bg-white/5 rounded cursor-pointer truncate text-sm">双均线策略...</div>
            <div className="px-3 py-2 hover:bg-white/5 rounded cursor-pointer truncate text-sm">API 报错查询...</div>
        </div>

        <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">U</div>
                <div className="text-sm text-white">User 8826</div>
            </div>
        </div>
      </div>

      {/* --- 右侧主区域 --- */}
      <div className="flex-1 flex flex-col relative bg-[#f8fafc]">
        
        {/* 顶部大横幅 (仿图2的深紫色头部) */}
        {messages.length === 0 && (
            <div className="h-[280px] bg-hero-gradient flex flex-col items-center justify-center text-white relative overflow-hidden shrink-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <h1 className="text-4xl font-bold mb-2 z-10 drop-shadow-lg">X-TradeBrain</h1>
                <p className="text-indigo-200 text-sm z-10">生成式 AI 编程助手 V1.12.8</p>
                <div className="flex gap-4 mt-6 z-10">
                    <span className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs">🚀 选股 & 信息整理工具</span>
                    <span className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs">📈 今日股市</span>
                </div>
            </div>
        )}

        {/* 只有在聊天时才显示的顶部栏 */}
        {messages.length > 0 && (
             <div className="h-16 border-b bg-white flex items-center px-6 justify-between shrink-0 shadow-sm z-10">
                <div className="font-bold text-slate-800">X-TradeBrain <span className="text-xs text-slate-400 font-normal">AI Assistant</span></div>
                <button onClick={() => setMessages([])} className="text-xs text-red-500 hover:underline">清空</button>
             </div>
        )}

        {/* 内容滚动区 */}
        <div className="flex-1 overflow-y-auto relative scroll-smooth">
            {messages.length === 0 ? (
                // --- 首页状态 (卡片布局) ---
                <div className="max-w-4xl mx-auto px-6 -mt-8 relative z-20">
                    {/* 巨大的输入框 (仿图2) */}
                    <div className="bg-white rounded-2xl shadow-xl p-2 border border-indigo-100 flex flex-col mb-10">
                        <textarea 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {if(e.key === 'Enter' && !e.shiftKey) {e.preventDefault(); handleSend();}}}
                            placeholder="请输入您的策略想法..."
                            className="w-full p-4 min-h-[100px] resize-none focus:outline-none text-slate-700 placeholder:text-slate-400 text-lg"
                        />
                        <div className="flex justify-between items-center px-4 pb-2">
                             <div className="flex gap-2 text-xs text-slate-400 border px-2 py-1 rounded bg-slate-50">
                                PTrade 国金版 ▾
                             </div>
                             <button onClick={handleSend} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-2 transition-all">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                             </button>
                        </div>
                    </div>

                    {/* 底部卡片 (仿图2) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div onClick={() => setInput("写一个双均线策略")} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md cursor-pointer transition-all hover:border-indigo-200">
                            <div className="font-bold text-slate-800 mb-2">⚡️ 编写策略</div>
                            <p className="text-sm text-slate-500">编写一个双均线策略：当五日均线高于十日均线时买入...</p>
                        </div>
                        <div onClick={() => setInput("如何获取订单详情？")} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md cursor-pointer transition-all hover:border-indigo-200">
                            <div className="font-bold text-slate-800 mb-2">📚 API 相关问题</div>
                            <p className="text-sm text-slate-500">如何获取订单详情？函数用法查询...</p>
                        </div>
                        {/* 装饰性空卡片 */}
                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm opacity-60">
                             <div className="font-bold text-slate-800 mb-2">✨ 策略示例</div>
                             <p className="text-sm text-slate-500">查看更多高分策略...</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm opacity-60">
                             <div className="font-bold text-slate-800 mb-2">💬 社区互动</div>
                             <p className="text-sm text-slate-500">与其他量化爱好者交流...</p>
                        </div>
                    </div>
                </div>
            ) : (
                // --- 聊天状态 ---
                <div className="p-4 md:p-8 space-y-6 pb-32">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'ai' && <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">AI</div>}
                            
                            <div className={`rounded-2xl p-4 shadow-sm max-w-[85%] ${
                                msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-100 text-slate-800'
                            }`}>
                                {msg.role === 'user' ? (
                                    <div className="whitespace-pre-wrap">{msg.content}</div>
                                ) : (
                                    <ReactMarkdown components={{
                                        code({node, inline, className, children, ...props}: any) {
                                            const match = /language-(\w+)/.exec(className || '')
                                            return !inline && match ? (
                                                <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" customStyle={{borderRadius: '8px', fontSize: '13px'}} {...props}>
                                                    {String(children).replace(/\n$/, '')}
                                                </SyntaxHighlighter>
                                            ) : (<code className="bg-slate-100 px-1 rounded text-pink-500 text-xs" {...props}>{children}</code>)
                                        }
                                    }}>{msg.content}</ReactMarkdown>
                                )}
                            </div>

                            {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center shrink-0">Me</div>}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            )}
        </div>

        {/* 聊天模式下的底部输入框 (固定在底部) */}
        {messages.length > 0 && (
            <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                <div className="max-w-3xl mx-auto relative">
                    <input 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {if(e.key === 'Enter') handleSend()}}
                        placeholder="继续输入..."
                        className="w-full bg-slate-100 rounded-full py-3 px-6 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button onClick={handleSend} className="absolute right-2 top-1.5 bg-indigo-600 text-white rounded-full p-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                    </button>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}