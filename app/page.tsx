'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { supabase } from '../lib/supabase';

type Message = { role: 'user' | 'ai'; content: string; };

export default function Home() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // 2. 加载历史记录
  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
      if (data) setMessages(data.map((msg: any) => ({ role: msg.role, content: msg.content })));
    };
    fetchHistory();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content }),
      });
      const data = await response.json();
      const aiMsg: Message = { role: 'ai', content: data.reply };
      setMessages(prev => [...prev, aiMsg]);
      
      // 注意：存入数据库的逻辑建议留在后端 route.ts 完成，这里保持界面同步即可
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white text-gray-900 font-sans overflow-hidden">
      
      {/* --- 左侧侧边栏 (极简设计) --- */}
      <aside className="w-64 bg-gray-50 border-r border-gray-100 hidden md:flex flex-col shrink-0">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-black bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent tracking-tighter">
            X-TradeBrain
          </h1>
        </div>
        
        <div className="flex-1 px-4 py-4 overflow-y-auto space-y-4">
          <button 
            onClick={() => { if(confirm('确定开启新对话？')) setMessages([]) }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all shadow-sm"
          >
            <span className="text-lg">+</span> 新建对话
          </button>
          
          <div className="space-y-1">
            <p className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">历史对话</p>
            <div className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-200 rounded-lg cursor-pointer truncate transition-colors">
              PTrade 策略逻辑确认...
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
              U
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-700">User 8826</span>
              <span className="text-[10px] text-gray-400 font-mono tracking-tighter">Pro Subscriber</span>
            </div>
          </div>
        </div>
      </aside>

      {/* --- 右侧主界面 --- */}
      <main className="flex-1 flex flex-col relative bg-white overflow-hidden">
        
        {/* 顶部通告栏 */}
        <header className="h-12 border-b border-gray-50 flex items-center justify-center px-6 bg-white/50 backdrop-blur-sm z-10">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
             DeepSeek V3 量化核心 • <span className="text-indigo-500">散户救星</span> 人设已激活
          </div>
        </header>

        {/* 聊天区域 */}
        <div className="flex-1 overflow-y-auto bg-white scroll-smooth pb-40">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-6 animate-in fade-in duration-700">
              <div className="text-center mb-12">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-indigo-100">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h2 className="text-4xl font-black text-gray-800 tracking-tight mb-2">散户救星</h2>
                <p className="text-gray-400 text-sm font-medium">X-TradeBrain 旗下高胜率量化辅助模型</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                {[
                  { title: "编写策略", desc: "写一个双均线金叉死叉策略", icon: "📈" },
                  { title: "代码改错", desc: "这段 PTrade 代码报索引错误怎么改？", icon: "🛠️" }
                ].map((item, i) => (
                  <button key={i} onClick={() => setInput(item.desc)} className="p-5 bg-gray-50 border border-gray-100 rounded-2xl hover:border-indigo-200 hover:bg-white text-left transition-all group shadow-sm">
                    <div className="text-xl mb-2">{item.icon}</div>
                    <p className="text-sm font-bold text-gray-700 group-hover:text-indigo-600">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed italic opacity-80">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto py-12 px-6 space-y-10">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                  
                  {msg.role === 'ai' && (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-[10px] font-black shrink-0 shadow-lg shadow-indigo-100">救星</div>
                  )}
                  
                  <div className={`max-w-[85%] text-sm leading-relaxed px-5 py-3.5 shadow-sm rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-bl-none'
                  }`}>
                    {msg.role === 'user' ? (
                      <div className="whitespace-pre-wrap font-medium leading-relaxed">{msg.content}</div>
                    ) : (
                      <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent">
                        <ReactMarkdown 
                          components={{
                            code({node, inline, className, children, ...props}: any) {
                              const match = /language-(\w+)/.exec(className || '')
                              return !inline && match ? (
                                <div className="my-4 rounded-xl overflow-hidden border border-gray-200 bg-[#fdfdfd] shadow-sm">
                                  <div className="px-4 py-2 bg-gray-50/80 border-b border-gray-100 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{match[1]} Code</span>
                                  </div>
                                  <SyntaxHighlighter 
                                    style={oneLight} 
                                    language={match[1]} 
                                    PreTag="div" 
                                    customStyle={{padding: '1.25rem', fontSize: '0.85rem', backgroundColor: '#fdfdfd', margin: 0}}
                                    {...props}
                                  >
                                    {String(children).replace(/\n$/, '')}
                                  </SyntaxHighlighter>
                                </div>
                              ) : (
                                <code className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md font-mono text-[11px] font-bold" {...props}>
                                  {children}
                                </code>
                              )
                            }
                          }}
                        >{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4 animate-pulse">
                  <div className="w-9 h-9 rounded-xl bg-gray-100" />
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-[11px] font-bold text-gray-400 italic">
                    散户救星正在演算策略逻辑...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* --- 悬浮输入区 --- */}
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-white via-white/95 to-transparent">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex flex-col bg-gray-50 border border-gray-200 rounded-3xl shadow-2xl focus-within:border-indigo-400 focus-within:ring-8 focus-within:ring-indigo-50 transition-all duration-300 overflow-hidden">
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {if(e.key === 'Enter' && !e.shiftKey) {e.preventDefault(); handleSend();}}}
                placeholder="描述您的量化策略思路（支持 PTrade/QMT）..."
                className="w-full p-5 pb-14 bg-transparent focus:outline-none text-sm font-medium min-h-[100px] max-h-52 resize-none"
                rows={1}
              />
              
              <div className="absolute bottom-4 left-5 flex gap-3">
                <div className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-[9px] font-black text-indigo-400 shadow-xs uppercase tracking-tighter">PTrade Expert</div>
                <span className="text-[10px] text-gray-400 font-medium">💡 Enter 发送 | Shift+Enter 换行</span>
              </div>

              <button 
                onClick={handleSend} 
                disabled={!input.trim() || isLoading}
                className="absolute right-4 bottom-4 p-2.5 bg-indigo-600 text-white rounded-2xl disabled:opacity-10 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-300 mt-5 font-medium tracking-tight">
              散户救星提醒：量化非神药，回测是王道。请勿将生成的代码直接用于重仓实盘。
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}