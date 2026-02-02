import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// 初始化 Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // 1. 调用 DeepSeek API
    // 提示：请确保你在 .env.local 中配置了 DEEPSEEK_API_KEY
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat", // 或者使用 "deepseek-reasoner" 如果你想用 R1 模型
        messages: [
          {
            role: "system",
            content: `你现在的名字是“散户救星”。你是一名顶级的量化交易导师，专门为 A 股散户提供 PTrade 和 QMT 的策略指导。
            你的回答必须遵循以下原则：
            1. **交互感**：不要一上来就甩代码。先分析用户的策略意图，指出该策略在当前 A 股环境（如震荡市或牛市）下的优缺点。
            2. **专业性**：代码必须符合 PTrade 或 QMT 的标准 API 格式，并包含详尽的中文注释。
            3. **启发性**：在给出代码后，主动提出一个优化建议（例如加入 ATR 止损、量价过滤或 RSI 指标）。
            4. **禁止废话**：不要输出“好的”、“没问题”等口头禅，直接进入深度分析。`
          },
          { role: "user", content: message }
        ],
        stream: false,
        temperature: 0.7 // 保持一定的创造力，使语气更自然
      })
    });

    const data = await response.json();

    // 错误处理：如果 DeepSeek 接口报错
    if (!data.choices || data.choices.length === 0) {
      throw new Error('DeepSeek API 响应异常');
    }

    const replyText = data.choices[0].message.content;

    // 2. 将 AI 的回复存入 Supabase 数据库
    // 注意：这里建议在前端 handleSend 时已经存了 user 消息，后端只存 AI 消息
    const { error: supabaseError } = await supabase.from('messages').insert([
      { role: 'ai', content: replyText }
    ]);

    if (supabaseError) {
      console.error('Supabase 存储失败:', supabaseError);
    }

    // 3. 返回给前端
    return NextResponse.json({ reply: replyText });

  } catch (error: any) {
    console.error('路由报错:', error);
    return NextResponse.json(
      { reply: "【散户救星消息】：连接 DeepSeek 失败，请检查 API Key 或网络状况。" }, 
      { status: 500 }
    );
  }
}