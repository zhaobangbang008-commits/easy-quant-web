'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'; // 改用亮色代码高亮
import { supabase } from '../lib/supabase';

type Message = { role: 'user' | 'ai'; content: string; };

export default function Home() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 加载历史
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
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen font-sans text-gray-900 bg-white">
      
      {/* --- 左侧侧边栏 (极简灰) --- */}
      <div className="w-[260px] bg-gray-50 border-r border-gray-200 flex flex-col shrink-0">
        <div className="h-14 flex items-center px-4 font-semibold text-gray-800 border-b border-gray-200">
          X-TradeBrain
        </div>
        
        <div className="p-3">
          <button 
            onClick={() => {if(confirm('清空会话？')) setMessages([])}}
            className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-md transition-colors border border-gray-300 bg-white"
          >
            + 新建对话
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase">History</div>
          <div className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-md cursor-pointer truncate">
            双均线策略...
          </div>
        </div>

        <div className="p-4 border-t border-gray-200">
           <div className="flex items-center gap-2 text-sm text-gray-600">
             <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold text-white">U</div>
             User 8826
           </div>
        </div>
      </div>

      {/* --- 右侧主区域 (纯白) --- */}
      <div className="flex-1 flex flex-col relative bg-white">
        
        {/* 顶部标题 */}
        <div className="h-14 border-b border-gray-100 flex items-center justify-center text-sm text-gray-500 shrink-0">
           DeepSeek V3 (Consultant Mode)
        </div>

        {/* 聊天内容 */}
        <div className="flex-1 overflow-y-auto p-4 scroll-smooth pb-32">
           {messages.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center space-y-6 -mt-10">
                <div className="text-2xl font-bold text-gray-800">X-TradeBrain</div>
                <div className="grid grid-cols-2 gap-4 w-full max-w-2xl px-4">
                   <button onClick={() => setInput("写一个双均线策略")} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left text-sm text-gray-700">
                      → 编写双均线策略
                   </button>
                   <button onClick={() => setInput("查询 API 文档")} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left text-sm text-gray-700">
                      → API 报错查询
                   </button>
                </div>
             </div>
           ) : (
             <div className="max-w-3xl mx-auto space-y-6">
               {messages.map((msg, idx) => (
                 <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    
                    {/* AI 图标 */}
                    {msg.role === 'ai' && (
                      <div className="w-8 h-8 rounded-sm bg-green-600 text-white flex items-center justify-center shrink-0 text-xs">AI</div>
                    )}
                    
                    <div className={`text-sm leading-7 rounded px-4 py-2 max-w-[85%] ${
                      msg.role === 'user' 
                        ? 'bg-black text-white' // 用户是黑底白字
                        : 'bg-transparent text-gray-800' // AI是透明底黑字
                    }`}>
                      {msg.role === 'user' ? (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      ) : (
                        <ReactMarkdown components={{
                            code({node, inline, className, children, ...props}: any) {
                                const match = /language-(\w+)/.exec(className || '')
                                return !inline && match ? (
                                    <SyntaxHighlighter style={oneLight} language={match[1]} PreTag="div" customStyle={{backgroundColor: '#f9f9f9', border: '1px solid #e5e7eb'}} {...props}>
                                        {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                ) : (<code className="bg-gray-100 px-1 py-0.5 rounded text-red-600 font-mono text-xs" {...props}>{children}</code>)
                            }
                        }}>{msg.content}</ReactMarkdown>
                      )}
                    </div>

                    {/* 用户图标 */}
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-sm bg-gray-200 text-gray-600 flex items-center justify-center shrink-0 text-xs">Me</div>
                    )}
                 </div>
               ))}
               <div ref={messagesEndRef} />
             </div>
           )}
        </div>

        {/* 底部输入框 (居中、简单边框) */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
           <div className="max-w-3xl mx-auto relative">
             <textarea 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => {if(e.key === 'Enter' && !e.shiftKey) {e.preventDefault(); handleSend();}}}
               placeholder="发送消息..."
               className="w-full p-3 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black min-h-[50px] resize-none bg-white text-gray-900"
               rows={1}
             />
             <button onClick={handleSend} disabled={!input.trim()} className="absolute bottom-2.5 right-2.5 p-1.5 bg-black text-white rounded disabled:opacity-30">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
             </button>
           </div>
           <p className="text-center text-xs text-gray-400 mt-2">AI 生成的内容仅供参考</p>
        </div>

      </div>
    </div>
  );
}