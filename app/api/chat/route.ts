import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// 连接 DeepSeek 的配置
const openai = new OpenAI({
  // 👇👇👇 请把你的 sk- 开头的 Key 填在下面引号里 👇👇👇
  apiKey: 'sk-f937fc2c1e5149fd9119d22751fe343e', 
  baseURL: 'https://api.deepseek.com', // 这是 DeepSeek 的专用地址
});

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // 这里是给 AI 的“人设”，让它知道自己是量化专家
    const systemPrompt = `你是一个精通 Python 的量化交易架构师 (X-TradeBrain)。
    要求：
    1. 用户让你写策略时，直接输出 Python 代码块。
    2. 代码必须包含 initialize 和 handle_data 等标准函数。
    3. 加上中文注释。
    4. 不要说废话。`;

    const completion = await openai.chat.completions.create({
      model: "deepseek-chat", 
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
    });

    const aiResponse = completion.choices[0].message.content;
    return NextResponse.json({ reply: aiResponse });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ reply: "出错了，请检查 Key 是否正确。" }, { status: 500 });
  }
}