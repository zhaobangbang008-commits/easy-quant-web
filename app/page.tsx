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

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content }),
      });
      const data = await response.json();
      const aiMsg: Message = { role: 'ai', content: data.reply };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-white font-sans text-slate-900 overflow-hidden">
      
      {/* --- 左侧侧边栏 --- */}
      <div className="w-[280px] bg-[#f9fafb] border-r border-slate-200 flex flex-col shrink-0">
        {/* 积分区域 */}
        <div className="p-4 space-y-2 mt-2">
          <div className="flex justify-between items-center px-2">
            <span className="text-sm font-medium text-slate-500">✨ 积分</span>
            <span className="text-brand-purple font-bold text-violet-600">120</span>
          </div>
          <button className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2 text-sm font-medium transition-all shadow-sm">
            获得积分
          </button>
          <button className="w-full bg-white border border-slate-200 text-slate-600 rounded-xl py-2 text-sm font-medium hover:bg-slate-50 transition-all">
            积分规则
          </button>
        </div>

        <div className="px-4 py-2 mt-4">
           <button onClick={() => setMessages([])} className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 transition-all">
             <span className="text-lg">+</span> 新建对话
           </button>
        </div>

        {/* 历史记录 */}
        <div className="flex-1 overflow-y-auto px-4 mt-4 space-y-1">
          <div className="text-xs font-semibold text-slate-400 mb-2 px-2">历史记录</div>
          <div className="px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-200/50 rounded-lg cursor-pointer truncate">双均线策略逻辑分析</div>
          <div className="px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-200/50 rounded-lg cursor-pointer truncate">PTrade 回测报错处理</div>
        </div>

        {/* 用户信息 */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px]">👤</div>
            <div className="text-sm font-medium text-slate-700">191****8826</div>
          </div>
        </div>
      </div>

      {/* --- 右侧主区域 --- */}
      <div className="flex-1 flex flex-col relative bg-white">
        
        {/* 顶部紫色公告栏 */}
        <div className="h-10 bg-violet-600 text-white text-xs flex items-center justify-center gap-2 px-4 text-center">
          📢 欢迎行业伙伴交流合作机会（点击这里加微信备注“合作”） <span className="opacity-70 ml-2">✕</span>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col items-center relative">
          
          {messages.length === 0 ? (
            /* --- 首页状态 --- */
            <div className="w-full max-w-3xl mt-20 px-6">
              <div className="text-center mb-10">
                <div className="flex justify-center gap-3 mb-6">
                  <span className="px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-xs text-slate-500 hover:bg-slate-100 cursor-pointer">🚀 选股 & 信息整理工具</span>
                  <span className="px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-xs text-slate-500 hover:bg-slate-100 cursor-pointer">📈 今日股市</span>
                </div>
                <h1 className="text-5xl font-bold text-slate-800 mb-2 tracking-tight">X-TradeBrain</h1>
                <p className="text-slate-400 text-lg font-light">生成式 AI 编程助手</p>
                <span className="inline-block mt-2 px-2 py-0.5 bg-slate-100 text-[10px] text-slate-400 rounded">V1.12.8</span>
              </div>

              {/* 输入框卡片 */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-4 mb-4 relative transition-all focus-within:border-violet-300">
                <textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {if(e.key === 'Enter' && !e.shiftKey) {e.preventDefault(); handleSend();}}}
                  placeholder="请输入您的策略想法..."
                  className="w-full min-h-[140px] p-2 resize-none focus:outline-none text-slate-700 placeholder:text-slate-300 text-base"
                />
                <div className="flex justify-between items-center mt-2 pt-3 border-t border-slate-50">
                  <div className="flex items-center gap-4">
                     <span className="text-[10px] text-slate-300">💡 回车键发送，Shift+回车键换行</span>
                     <select className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded px-2 py-1 outline-none">
                        <option>PTrade 国金版</option>
                        <option>QMT 极简版</option>
                     </select>
                  </div>
                  <div className="flex gap-4 items-center">
                    <button className="text-slate-400 hover:text-slate-600 text-xl">📎</button>
                    <button onClick={handleSend} className="bg-slate-200 text-white rounded-full p-2 hover:bg-violet-600 transition-all group">
                       <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                    </button>
                  </div>
                </div>
              </div>
              
              <p className="text-center text-[10px] text-slate-300 mb-12 italic">AI 生成的代码仅作为技术参考和研究学习，请勿用于任何实际生产、商业用途或投资</p>

              {/* 底部示例 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-violet-200 transition-all cursor-pointer">
                  <div className="font-bold text-slate-700 mb-1 text-sm">✨ 编写策略</div>
                  <p className="text-xs text-slate-400">编写一个双均线策略：当五日均线高于十日均线时买入...</p>
                </div>
                <div className="p-5 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-violet-200 transition-all cursor-pointer">
                  <div className="font-bold text-slate-700 mb-1 text-sm">📚 API 相关问题</div>
                  <p className="text-xs text-slate-400">如何获取订单详情？函数用法查询...</p>
                </div>
              </div>
            </div>
          ) : (
            /* --- 聊天状态 --- */
            <div className="w-full max-w-4xl p-6 pb-32 space-y-8">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                   {msg.role === 'ai' && <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-[10px] font-bold shrink-0">AI</div>}
                   <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-violet-600 text-white shadow-lg' : 'bg-slate-50 border border-slate-100 text-slate-800'}`}>
                      <ReactMarkdown components={{
                        code({node, inline, className, children, ...props}: any) {
                          const match = /language-(\w+)/.exec(className || '')
                          return !inline && match ? (
                            <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" customStyle={{borderRadius: '12px', fontSize: '12px'}} {...props}>
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (<code className="bg-slate-200/50 px-1 rounded text-pink-500 font-mono text-sm" {...props}>{children}</code>)
                        }
                      }}>{msg.content}</ReactMarkdown>
                   </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 聊天模式下的悬浮输入框 */}
        {messages.length > 0 && (
          <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-white via-white to-transparent">
            <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-full shadow-lg flex items-center px-4 py-2">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {if(e.key === 'Enter') handleSend()}}
                placeholder="继续追问..."
                className="flex-1 bg-transparent px-4 py-2 focus:outline-none text-sm"
              />
              <button onClick={handleSend} className="bg-violet-600 text-white p-2 rounded-full hover:scale-105 transition-transform">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </button>
            </div>
          </div>
        )}

        {/* 右下角交流群按钮 */}
        <div className="fixed bottom-6 right-6 z-50">
          <button className="bg-brand-purple bg-violet-600 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-sm font-medium hover:bg-violet-700 transition-all">
             <span className="text-lg">💬</span> 交流群
          </button>
        </div>
      </div>
    </div>
  );
}