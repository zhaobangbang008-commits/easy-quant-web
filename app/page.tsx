'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { supabase } from '../lib/supabase';

// 定义消息类型，增加 created_at
type Message = {
  id?: number;
  role: 'user' | 'ai';
  content: string;
  created_at?: string;
};

// 定义会话类型
type Session = {
  id: string; // 用时间戳做临时ID
  title: string;
  messages: Message[];
};

export default function Home() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 所有会话列表
  const [sessions, setSessions] = useState<Session[]>([]);
  // 当前选中的会话索引 (默认 -1 表示新对话，或者 0 表示最近一个)
  const [currentSessionIndex, setCurrentSessionIndex] = useState<number>(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // --- 核心逻辑：获取历史并按时间分组 ---
  useEffect(() => {
    const fetchAndGroupHistory = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (data && data.length > 0) {
        // 简单的分组逻辑：如果两条消息间隔超过 1 小时，就算新会话
        const grouped: Session[] = [];
        let currentGroup: Message[] = [];
        
        data.forEach((msg, index) => {
          const prevMsg = data[index - 1];
          const isLongGap = prevMsg && 
            (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 60 * 60 * 1000);
            
          if (isLongGap && currentGroup.length > 0) {
            grouped.push({
              id: `sess-${grouped.length}`,
              title: currentGroup[0].content.slice(0, 10) + '...', // 用第一句话当标题
              messages: [...currentGroup]
            });
            currentGroup = [];
          }
          currentGroup.push(msg);
        });

        // 最后一组
        if (currentGroup.length > 0) {
          grouped.push({
            id: `sess-${grouped.length}`,
            title: currentGroup[0].content.slice(0, 10) + '...',
            messages: currentGroup
          });
        }

        // 反转一下，让最新的在最上面
        const reversedSessions = grouped.reverse();
        setSessions(reversedSessions);
        // 默认选中最新的一个会话
        setCurrentSessionIndex(0);
      }
    };

    fetchAndGroupHistory();
  }, [isLoading]); // 每次发送完消息重新抓取一下分组

  useEffect(() => {
    scrollToBottom();
  }, [sessions, currentSessionIndex]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // 乐观更新：先在界面上显示（虽然我们马上会重新fetch，但这样体验好）
    // 注意：这里我们临时加到当前显示的列表中，实际存储靠数据库
    const tempMsg: Message = { role: 'user', content: input, created_at: new Date().toISOString() };
    
    // 如果当前是空会话，先占个位
    if (sessions.length === 0) {
        setSessions([{ id: 'new', title: 'New Chat', messages: [tempMsg] }]);
        setCurrentSessionIndex(0);
    } else {
        const newSessions = [...sessions];
        newSessions[currentSessionIndex].messages.push(tempMsg);
        setSessions(newSessions);
    }
    
    setInput('');
    setIsLoading(true);

    // 存入数据库
    await supabase.from('messages').insert([{ role: 'user', content: input }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      const data = await response.json();
      
      // 存入 AI 回复
      await supabase.from('messages').insert([{ role: 'ai', content: data.reply }]);
      
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false); // 这会触发 useEffect 重新拉取并分组
    }
  };

  // 新建对话：其实就是把选中状态设为一个不存在的索引，或者清空当前视窗
  const handleNewChat = () => {
      // 实际上，只要我们不往旧会话里发消息，发一条新消息时，
      // 因为时间间隔短，可能会被分到上一个会话。
      // 为了强制分新会话，我们在前端逻辑里可以简单处理：
      // 只要用户点“新对话”，我们就清空当前视图，让他发的消息变成新的开头。
      if(confirm("开始新话题？旧记录将保存在左侧列表。")) {
          // 这里我们简单粗暴一点：刷新页面或者让用户发第一条消息时自动变成新组
          // 但因为没有 SessionID 字段，最好是告诉用户逻辑
          alert("提示：发送新消息后，如果距离上一条很久，会自动归档为历史记录。");
          setInput(''); 
      }
  };

  // 获取当前要显示的消息列表
  const currentMessages = sessions[currentSessionIndex]?.messages || [];

  return (
    <div className="flex h-screen font-sans text-slate-800 overflow-hidden">
      
      {/* --- 左侧侧边栏 --- */}
      <div className="w-[280px] bg-sidebar-gradient text-slate-300 flex flex-col shrink-0 shadow-xl z-20">
        <div className="h-20 flex items-center px-6">
           <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 mr-3">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
           </div>
           <div>
             <div className="font-bold text-lg text-white tracking-wide">X-TradeBrain</div>
             <div className="text-[10px] text-slate-400">Pro Edition</div>
           </div>
        </div>

        <div className="px-5 mb-6">
          <button 
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10 backdrop-blur-sm group"
          >
            <span className="text-xl font-light group-hover:scale-110 transition-transform">+</span>
            <span className="text-sm font-medium">New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-1">
          <div className="px-2 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">History</div>
          {sessions.map((sess, idx) => (
             <div 
               key={sess.id}
               onClick={() => setCurrentSessionIndex(idx)}
               className={`px-3 py-3 text-sm rounded-lg cursor-pointer transition-colors truncate ${
                   idx === currentSessionIndex 
                   ? 'bg-white/10 text-white font-medium border border-white/5' 
                   : 'text-slate-400 hover:bg-white/5 hover:text-white'
               }`}
             >
                {sess.title || "New Conversation"}
             </div>
          ))}
        </div>

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

      {/* --- 右侧主界面 --- */}
      <div className="flex-1 flex flex-col relative bg-[#f8fafc]">
        
        {/* 顶部标题栏 */}
        <div className="h-16 flex items-center justify-between px-8 bg-white/70 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-10">
           <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
             AI Model: <span className="text-slate-800 font-bold">DeepSeek V3 (Consultant Mode)</span>
           </div>
           <div className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-medium border border-indigo-100">
             Pro Account
           </div>
        </div>

        {/* 聊天内容区 */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 scroll-smooth pb-32">
           {currentMessages.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center -mt-10">
                <div className="w-24 h-24 bg-gradient-to-tr from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                   <svg className="w-12 h-12 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                </div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">How can I help you trade?</h1>
                <p className="text-slate-500 mb-8">我会先理解你的意图，再提供策略代码。</p>
                
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
             currentMessages.map((msg, index) => (
               <div key={index} className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'ai' && (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-lg shadow-indigo-200 mt-1">Ai</div>
                  )}
                  
                  <div className={`rounded-2xl px-6 py-4 text-[15px] leading-relaxed shadow-sm max-w-[85%] ${
                    msg.role === 'user' 
                    ? 'bg-brand-gradient text-white rounded-tr-sm shadow-indigo-200' 
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

                   {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0 mt-1">Me</div>
                  )}
               </div>
             ))
           )}
           {isLoading && (
              <div className="max-w-4xl mx-auto flex gap-4">
                 <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-lg shadow-indigo-200 mt-1">Ai</div>
                 <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-6 py-4 text-sm text-slate-500 shadow-sm flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                    思考策略逻辑中...
                 </div>
              </div>
           )}
           <div ref={messagesEndRef} />
        </div>

        {/* 底部输入区 */}
        <div className="absolute bottom-6 left-6 right-6 z-20">
           <div className="max-w-3xl mx-auto relative">
             <div className="absolute inset-0 bg-white/80 backdrop-blur-xl rounded-2xl shadow-glass border border-white/20"></div>
             <textarea 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => {
                 if (e.key === 'Enter' && !e.shiftKey) {
                   e.preventDefault();
                   handleSend();
                 }
               }}
               placeholder="告诉我你的想法，例如：'想写一个基于RSI的日内策略'"
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