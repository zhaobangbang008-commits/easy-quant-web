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

// 简单的图标组件 (不需要安装额外的包)
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
  </svg>
);
const BotIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" />
  </svg>
);
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
  </svg>
);

export default function Home() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [platform, setPlatform] = useState('ptrade'); // 默认平台
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
      if (data) {
        setMessages(data.map((msg: any) => ({ role: msg.role, content: msg.content })));
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
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
        body: JSON.stringify({ message: input, platform }), // 把选中的平台也发给后台
      });
      const data = await response.json();
      const aiMsg: Message = { role: 'ai', content: data.reply || "AI 暂时掉线了..." };
      setMessages(prev => [...prev, aiMsg]);
      await supabase.from('messages').insert([{ role: 'ai', content: aiMsg.content }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "网络请求失败，请稍后再试。" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      
      {/* --- 左侧侧边栏 (桌面端显示) --- */}
      <div className="w-[260px] bg-white border-r border-slate-200 flex flex-col hidden md:flex shrink-0">
        <div className="p-4">
          <button 
            onClick={() => setMessages([])}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-3 text-sm font-medium transition-all shadow-sm active:scale-95"
          >
            <span className="text-lg">+</span> 新建对话
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          <div className="text-xs font-semibold text-slate-400 px-3 py-2">最近历史</div>
          {/* 这里是个假的历史列表，以后可以从数据库读 */}
          <div className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer truncate transition-colors">
            双均线策略编写...
          </div>
          <div className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer truncate transition-colors">
            QMT 如何查询资金...
          </div>
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
              U
            </div>
            <div className="text-sm">
              <div className="font-medium text-slate-700">User 8826</div>
              <div className="text-xs text-slate-400">积分: 120</div>
            </div>
          </div>
        </div>
      </div>

      {/* --- 右侧主区域 --- */}
      <div className="flex-1 flex flex-col relative min-w-0">
        
        {/* 顶部标题栏 */}
        <div className="h-14 border-b bg-white/80 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="font-bold text-lg text-slate-800 flex items-center gap-2">
            EasyQuant <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border">V1.2</span>
          </div>
        </div>

        {/* 聊天内容区 */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
          {messages.length === 0 ? (
            // --- 欢迎界面 (空状态) ---
            <div className="h-full flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-lg border border-slate-100 mx-auto flex items-center justify-center text-indigo-600 mb-4">
                  <BotIcon />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">有什么可以帮您？</h2>
                <p className="text-slate-500 text-sm">已接入 DeepSeek 深度思考模型 & 量化知识库</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl px-4">
                <button 
                  onClick={() => setInput('请帮我写一个双均线策略，5日线上穿10日线买入，下穿卖出')}
                  className="text-left p-4 bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md rounded-xl transition-all group"
                >
                  <div className="font-medium text-slate-700 group-hover:text-indigo-600 mb-1">✍️ 编写策略</div>
                  <div className="text-xs text-slate-400">写一个双均线策略，金叉买入死叉卖出...</div>
                </button>
                <button 
                  onClick={() => setInput('ptrade如何获取账户持仓信息？')}
                  className="text-left p-4 bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md rounded-xl transition-all group"
                >
                  <div className="font-medium text-slate-700 group-hover:text-indigo-600 mb-1">🔍 API 问题</div>
                  <div className="text-xs text-slate-400">PTrade 如何获取当前账户的持仓？</div>
                </button>
              </div>
            </div>
          ) : (
            // --- 消息列表 ---
            <>
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[90%] md:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* 头像 */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                      msg.role === 'user' ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-indigo-600 border-indigo-600 text-white'
                    }`}>
                      {msg.role === 'user' ? <UserIcon /> : <BotIcon />}
                    </div>
                    
                    {/* 气泡 */}
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm overflow-hidden ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-sm' 
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
                                  customStyle={{ margin: 0, borderRadius: '8px', fontSize: '12px' }}
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              ) : (
                                <code className={`${className} bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono text-xs`} {...props}>
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
                <div className="flex gap-3">
                   <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center animate-pulse"><BotIcon /></div>
                   <div className="bg-slate-100 px-4 py-3 rounded-2xl text-slate-500 text-xs flex items-center">EasyQuant 正在思考...</div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* 底部输入框区域 */}
        <div className="p-4 md:p-6 bg-white shrink-0">
          <div className="max-w-4xl mx-auto relative border border-slate-300 rounded-xl shadow-sm bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all flex flex-col">
            
            {/* 文本输入 */}
            <textarea 
              className="w-full p-4 bg-transparent resize-none focus:outline-none min-h-[50px] max-h-[200px] text-sm text-slate-700 placeholder:text-slate-400"
              placeholder="输入你的量化策略想法..."
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            {/* 底部工具栏 */}
            <div className="flex items-center justify-between p-2 pl-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
              {/* 平台选择器 */}
              <div className="flex items-center gap-2">
                <select 
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1.5 text-slate-600 focus:outline-none focus:border-indigo-500 cursor-pointer hover:bg-slate-50"
                >
                  <option value="ptrade">PTrade (国金/湘财)</option>
                  <option value="qmt">QMT (迅投)</option>
                  <option value="joinquant">聚宽 (JoinQuant)</option>
                </select>
                <button className="text-slate-400 hover:text-indigo-600 transition-colors p-1" title="上传文件 (暂未开放)">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 6.187l-10.94 10.941a1.5 1.5 0 102.121 2.121l7.779-7.779-1.415-1.414-7.779 7.779a.5.5 0 01-.707 0 .5.5 0 010-.707l10.94-10.941a2 2 0 00-2.828-2.828l-10.94 10.94A3.5 3.5 0 006.364 18.707 4.5 4.5 0 0012.728 12.35l7.693-7.693 1.414 1.414z" />
                  </svg>
                </button>
              </div>

              {/* 发送按钮 */}
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`p-2 rounded-lg transition-all ${
                  input.trim() 
                    ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <SendIcon />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-2">
            AI 生成内容仅供参考，不构成投资建议。
          </p>
        </div>
      </div>
    </div>
  );
}