'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../lib/supabase';

type Message = {
  role: 'user' | 'ai';
  content: string;
};

export default function Home() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [platform, setPlatform] = useState('ptrade'); 
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 加载历史
  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
      if (data) {
        setMessages(data.map((msg: any) => ({ role: msg.role, content: msg.content })));
      }
    };
    fetchHistory();
  }, []);

  // 发送消息
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
        body: JSON.stringify({ message: input, platform }),
      });
      const data = await response.json();
      const aiMsg: Message = { role: 'ai', content: data.reply };
      setMessages(prev => [...prev, aiMsg]);
      // 数据库插入在后端做了，这里只更新UI，或者也可以这里插
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "网络出小差了..." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 清空对话 (真的清空！)
  const handleClear = async () => {
    if(confirm("确定要清空所有历史记录吗？")) {
        setMessages([]);
        await supabase.from('messages').delete().neq('id', 0); // 清空数据库
    }
  }

  return (
    <div className="flex h-screen bg-[#f9fafb] font-sans text-slate-800">
      
      {/* --- 左侧侧边栏 (复刻版) --- */}
      <div className="w-[280px] bg-white border-r border-slate-100 flex flex-col hidden md:flex">
        <div className="p-5 space-y-4">
          {/* 获得积分按钮 */}
          <button className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-full py-2.5 font-medium shadow-sm transition-all flex items-center justify-center gap-2 text-sm">
            <span>✨ 获得积分</span>
          </button>
          
          <div className="h-px bg-slate-100 my-2"></div>

          {/* 新建对话 */}
          <button 
            onClick={handleClear}
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 text-slate-600 text-sm font-medium flex items-center gap-2 transition-colors border border-transparent hover:border-slate-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            新建对话
          </button>
        </div>

        {/* 历史记录列表 */}
        <div className="flex-1 overflow-y-auto px-4">
          <div className="text-xs text-slate-400 mb-2 px-2">历史记录</div>
          <div className="space-y-1">
             <div className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded cursor-pointer truncate">
               双均线策略编写...
             </div>
             <div className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded cursor-pointer truncate">
               API 问题咨询
             </div>
          </div>
        </div>

        {/* 底部用户信息 */}
        <div className="p-4 border-t border-slate-100">
           <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
             <div className="w-8 h-8 rounded-full bg-[#8b5cf6] text-white flex items-center justify-center text-xs font-bold">U</div>
             <div className="text-xs">
               <div className="font-bold text-slate-700">用户 8826</div>
               <div className="text-slate-400">积分: 120</div>
             </div>
           </div>
        </div>
      </div>

      {/* --- 右侧主区域 --- */}
      <div className="flex-1 flex flex-col relative">
        
        {/* 顶部通告栏 */}
        <div className="bg-[#8b5cf6] text-white text-xs py-2 px-4 text-center">
            🚀 欢迎行业伙伴交流合作机会 (点击这里加载微信备注"合作")
        </div>

        {/* 聊天区域 */}
        <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
          {messages.length === 0 ? (
            /* --- 空状态 (复刻 EasyQuant 首页) --- */
            <div className="h-full flex flex-col items-center justify-center -mt-10">
               <h1 className="text-4xl font-bold text-slate-800 mb-2">EasyQuant</h1>
               <div className="text-slate-400 text-sm bg-slate-100 px-3 py-1 rounded-full mb-8">
                  生成式 AI 编程助手 <span className="text-[#8b5cf6] font-bold">V1.12.8</span>
               </div>
               
               <div className="grid grid-cols-2 gap-4 w-full max-w-2xl px-4">
                  <div 
                    onClick={() => setInput('请写一个双均线策略')}
                    className="cursor-pointer bg-white p-6 rounded-2xl border border-slate-100 hover:shadow-lg hover:border-[#8b5cf6]/30 transition-all group"
                  >
                     <div className="text-lg font-bold text-slate-700 mb-2 group-hover:text-[#8b5cf6]">⚡️ 编写策略</div>
                     <p className="text-slate-400 text-sm">编写一个双均线策略：当五日均线高于十日均线时买入...</p>
                  </div>
                  <div 
                     onClick={() => setInput('如何获取订单详情？')}
                     className="cursor-pointer bg-white p-6 rounded-2xl border border-slate-100 hover:shadow-lg hover:border-[#8b5cf6]/30 transition-all group"
                  >
                     <div className="text-lg font-bold text-slate-700 mb-2 group-hover:text-[#8b5cf6]">📚 API 相关问题</div>
                     <p className="text-slate-400 text-sm">如何获取订单详情？函数用法查询...</p>
                  </div>
               </div>
            </div>
          ) : (
            /* --- 消息流 --- */
            <div className="max-w-3xl mx-auto space-y-6 py-6">
              {messages.map((msg, index) => (
                <div key={index} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* 头像 */}
                  <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-sm font-bold ${
                    msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-[#8b5cf6] text-white'
                  }`}>
                    {msg.role === 'user' ? 'Me' : '救'}
                  </div>
                  
                  {/* 内容 */}
                  <div className={`space-y-1 max-w-[85%] ${msg.role === 'user' ? 'items-end flex flex-col' : ''}`}>
                     <div className="text-xs text-slate-400 px-1">
                        {msg.role === 'user' ? 'User' : '散户救星'}
                     </div>
                     <div className={`p-4 rounded-2xl text-sm leading-7 shadow-sm ${
                        msg.role === 'user' 
                        ? 'bg-[#8b5cf6] text-white rounded-tr-sm' 
                        : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm'
                     }`}>
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                     </div>
                  </div>
                </div>
              ))}
              {isLoading && <div className="text-center text-xs text-slate-400 animate-pulse">散户救星正在思考...</div>}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 底部输入框 (复刻版) */}
        <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-slate-100">
           <div className="max-w-3xl mx-auto">
              <div className="relative bg-white border border-slate-200 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-[#8b5cf6]/20 focus-within:border-[#8b5cf6] transition-all">
                 <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if(e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder="请输入您的策略想法，Shift+回车换行"
                    className="w-full p-4 bg-transparent resize-none focus:outline-none text-sm min-h-[60px] max-h-[200px]"
                    rows={1}
                 />
                 
                 <div className="flex items-center justify-between px-3 py-2 bg-slate-50/50 rounded-b-2xl border-t border-slate-100/50">
                    <div className="flex items-center gap-2">
                       <select 
                         value={platform}
                         onChange={(e) => setPlatform(e.target.value)}
                         className="text-xs bg-white border border-slate-200 rounded px-2 py-1 text-slate-600 focus:outline-none hover:border-[#8b5cf6]"
                       >
                          <option value="ptrade">PTrade 国金版</option>
                          <option value="qmt">QMT 迅投版</option>
                          <option value="joinquant">聚宽 JoinQuant</option>
                       </select>
                    </div>
                    
                    <button 
                       onClick={handleSend}
                       disabled={!input.trim()}
                       className={`p-2 rounded-lg transition-all ${
                          input.trim() ? 'bg-[#8b5cf6] text-white shadow-md hover:bg-[#7c3aed]' : 'bg-slate-200 text-slate-400'
                       }`}
                    >
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                    </button>
                 </div>
              </div>
              <p className="text-[10px] text-center text-slate-400 mt-2">AI 生成的代码仅作技术参考，请勿用于任何实际生产、商业用途或投资</p>
           </div>
        </div>

      </div>
    </div>
  );
}