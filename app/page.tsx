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

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 加载历史记录
  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
      if (data) {
        setMessages(data.map((msg: any) => ({ role: msg.role, content: msg.content })));
      }
    };
    fetchHistory();
  }, []);

  // 监听消息更新，自动滚动
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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
        body: JSON.stringify({ message: input }),
      });
      const data = await response.json();
      const aiMsg: Message = { role: 'ai', content: data.reply || "AI 暂时没有回复..." };
      
      setMessages(prev => [...prev, aiMsg]);
      await supabase.from('messages').insert([{ role: 'ai', content: aiMsg.content }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "网络请求出错，请检查连接。" }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 清空历史（新建对话）
  const handleNewChat = async () => {
    if (confirm("确定要开启新对话吗？当前屏幕将被清空。")) {
       setMessages([]);
       // 如果你想物理删除数据库记录，取消下面这行的注释：
       // await supabase.from('messages').delete().neq('id', 0);
    }
  };

  return (
    // 最外层容器：Flex布局，全屏高度，不可滚动
    <div className="flex h-screen bg-white font-sans text-slate-800 overflow-hidden">
      
      {/* --- 左侧侧边栏 (参考图样式) --- */}
      <div className="w-[260px] bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
        {/* 顶部按钮区 */}
        <div className="p-4 space-y-3">
          {/* 获得积分 (装饰) */}
          <div className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium flex justify-between items-center shadow-sm cursor-pointer hover:bg-indigo-700 transition">
             <span>✨ 获得积分</span>
             <span className="bg-indigo-500 px-2 rounded text-xs">120</span>
          </div>
          
          {/* 新建对话按钮 */}
          <button 
            onClick={handleNewChat}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-sm text-slate-700 shadow-sm"
          >
            <span className="text-xl leading-none text-indigo-600">+</span>
            <span>新建对话</span>
          </button>
        </div>

        {/* 历史记录列表区 */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          <div className="px-3 py-2 text-xs font-semibold text-slate-400">历史记录</div>
          {/* 假数据演示布局 */}
          <div className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-md cursor-pointer truncate">
            双均线策略编写...
          </div>
          <div className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-md cursor-pointer truncate">
            API 接口查询报错
          </div>
        </div>

        {/* 底部用户区 */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">U</div>
             <div className="text-sm font-medium text-slate-700">用户 8826</div>
          </div>
        </div>
      </div>

      {/* --- 右侧主界面 --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-white relative">
        {/* 顶部标题栏 */}
        <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 bg-white shrink-0 z-10">
           <div className="text-lg font-bold text-slate-800">X-TradeBrain <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded ml-2 font-normal">V1.12.8</span></div>
        </div>

        {/* 聊天滚动区 */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
           {messages.length === 0 ? (
             // 空状态：显示欢迎页
             <div className="h-full flex flex-col items-center justify-center -mt-20 space-y-6">
                <h1 className="text-4xl font-bold text-slate-800">X-TradeBrain</h1>
                <p className="text-slate-500 bg-slate-50 px-4 py-1 rounded-full text-sm border border-slate-100">
                  已接入 DeepSeek & 云端数据库
                </p>
                <div className="grid grid-cols-2 gap-4 w-full max-w-2xl px-6">
                   <div onClick={() => setInput("帮我写一个双均线策略")} className="border border-slate-200 p-4 rounded-xl hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all bg-white">
                      <div className="font-bold text-slate-700 mb-1">📝 编写策略</div>
                      <div className="text-xs text-slate-400">写一个双均线策略，金叉买入死叉卖出...</div>
                   </div>
                   <div onClick={() => setInput("如何获取账户持仓？")} className="border border-slate-200 p-4 rounded-xl hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all bg-white">
                      <div className="font-bold text-slate-700 mb-1">🔍 代码调试</div>
                      <div className="text-xs text-slate-400">查询 API 文档，解决代码报错...</div>
                   </div>
                </div>
             </div>
           ) : (
             // 消息列表
             messages.map((msg, index) => (
               <div key={index} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {/* 头像 */}
                  <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center text-xs font-bold ${
                    msg.role === 'user' ? 'bg-indigo-600 text-white order-2' : 'bg-green-600 text-white order-1'
                  }`}>
                    {msg.role === 'user' ? 'Me' : 'AI'}
                  </div>
                  
                  {/* 气泡 */}
                  <div className={`max-w-[85%] rounded-lg p-4 text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                    ? 'bg-indigo-50 border border-indigo-100 text-slate-800 order-1' 
                    : 'bg-white border border-slate-200 text-slate-800 order-2'
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
                                customStyle={{ margin: '1em 0', borderRadius: '8px' }}
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={`${className} bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-mono text-xs`} {...props}>
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
           {isLoading && <div className="text-center text-xs text-slate-400">AI 正在思考中...</div>}
           <div ref={messagesEndRef} />
        </div>

        {/* 底部输入区 */}
        <div className="p-6 bg-white border-t border-slate-100 shrink-0">
           <div className="max-w-4xl mx-auto relative border border-slate-300 rounded-xl shadow-sm bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
             <textarea 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => {
                 if (e.key === 'Enter' && !e.shiftKey) {
                   e.preventDefault();
                   handleSend();
                 }
               }}
               placeholder="请输入您的策略想法，Shift+Enter 换行..."
               className="w-full p-4 bg-transparent resize-none focus:outline-none min-h-[60px] max-h-[150px] text-sm"
               rows={1}
             />
             <button 
               onClick={handleSend}
               disabled={!input.trim() || isLoading}
               className={`absolute bottom-3 right-3 p-2 rounded-lg transition-all ${
                 input.trim() ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
               }`}
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
             </button>
           </div>
           <p className="text-xs text-center text-slate-400 mt-2">AI 生成代码仅供参考，不构成投资建议</p>
        </div>

      </div>
    </div>
  );
}