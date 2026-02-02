'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { supabase } from '../lib/supabase'; // <--- 这里现在能找到了！

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

  // --- 核心功能：打开网页时，去数据库读取历史记录 ---
  useEffect(() => {
    const fetchHistory = async () => {
      // 去 messages 表里查数据
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true }); // 按时间正序排列

      if (data) {
        // 转换格式给网页显示
        const history = data.map((msg: any) => ({
          role: msg.role,
          content: msg.content
        }));
        setMessages(history);
      }
    };

    fetchHistory();
  }, []);

  // 每次有新消息，自动滚到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // 1. 准备好用户的消息
    const userMsg: Message = { role: 'user', content: input };
    
    // 2. 先显示在网页上 (视觉上快)
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // 3. 【存档】把用户说的话存进数据库
    await supabase.from('messages').insert([
      { role: 'user', content: userMsg.content }
    ]);

    try {
      // 4. 发给 AI
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      const aiMsg: Message = { 
        role: 'ai', 
        content: data.reply || "AI 没说话..." 
      };

      // 5. 显示 AI 的回复
      setMessages(prev => [...prev, aiMsg]);

      // 6. 【存档】把 AI 的回复也存进数据库
      await supabase.from('messages').insert([
        { role: 'ai', content: aiMsg.content }
      ]);

    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "网络请求失败。" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen bg-white text-slate-800 font-sans">
      {/* 左侧侧边栏 */}
      <div className="w-[260px] bg-slate-50 border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-4">
          <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-4 py-3 text-sm font-medium transition-colors shadow-sm">
            + 新建对话
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
           <div className="text-xs font-semibold text-slate-400 px-2 mb-2">最近历史</div>
           <div className="p-2 hover:bg-slate-200 rounded cursor-pointer text-sm text-slate-700">双均线策略编写...</div>
        </div>
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">U</div>
            <div>用户 8826 <span className="block text-xs text-slate-400">积分: 121</span></div>
          </div>
        </div>
      </div>

      {/* 右侧主区域 */}
      <div className="flex-1 flex flex-col relative bg-white">
        <div className="h-14 border-b flex items-center justify-between px-6 bg-white shrink-0">
           <div className="font-bold text-xl text-slate-800">X-TradeBrain <span className="text-xs bg-slate-100 px-2 rounded text-slate-500 font-normal">V1.12.8</span></div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
           {messages.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                <h1 className="text-4xl font-extrabold text-slate-900">X-TradeBrain</h1>
                <p className="text-lg text-slate-500">已接入 DeepSeek & 云端数据库</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full text-left">
                  <div className="border p-4 rounded-xl hover:bg-slate-50 cursor-pointer">
                    <h3 className="font-bold text-slate-700">编写策略</h3>
                    <p className="text-sm text-slate-500">编写一个双均线策略...</p>
                  </div>
                </div>
             </div>
           ) : (
             <>
               {messages.map((msg, index) => (
                 <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                       msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-green-600 text-white'
                     }`}>
                       {msg.role === 'user' ? '我' : 'AI'}
                     </div>
                     <div className={`p-3 rounded-xl text-sm leading-relaxed overflow-hidden ${
                       msg.role === 'user' 
                         ? 'bg-indigo-600 text-white' 
                         : 'bg-white border border-slate-200 text-slate-700 shadow-sm w-full'
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
                                   {...props}
                                 >
                                   {String(children).replace(/\n$/, '')}
                                 </SyntaxHighlighter>
                               ) : (
                                 <code className={`${className} bg-slate-100 px-1 rounded`} {...props}>
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
                 </div>
               ))}
               {isLoading && (
                 <div className="flex justify-start">
                    <div className="flex gap-3">
                       <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center">AI</div>
                       <div className="bg-slate-100 p-3 rounded-xl text-slate-500 text-sm">X-TradeBrain 正在思考...</div>
                    </div>
                 </div>
               )}
               <div ref={messagesEndRef} />
             </>
           )}
        </div>

        <div className="p-6 max-w-4xl mx-auto w-full shrink-0">
           <div className="relative border border-slate-300 rounded-xl shadow-sm bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
             <textarea 
               className="w-full p-4 pr-12 bg-transparent resize-none focus:outline-none min-h-[60px] max-h-[200px]"
               placeholder="请输入您的策略想法，按回车发送..."
               rows={1}
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={handleKeyDown}
             />
             <div className="absolute bottom-2 right-2 flex items-center gap-2">
               <button 
                 onClick={handleSend}
                 className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
               >
                 发送
               </button>
             </div>
           </div>
           <p className="text-xs text-center text-slate-400 mt-3">AI 生成的代码仅作为技术参考。</p>
        </div>
      </div>
    </div>
  );
}