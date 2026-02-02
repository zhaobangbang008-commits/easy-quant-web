import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // --- 核心升级：咨询师人格 + 深度思考模式 ---
    const systemPrompt = `
    你现在的身份是 "X-TradeBrain"，一位拥有15年经验的资深量化交易架构师。
    用户的技术栈是：Python, PTrade, QMT。
    
    【你的工作准则】
    1.  **拒绝机械式回答**：不要一上来就扔代码。
    2.  **先沟通与分析**：
        * 如果用户的需求模糊（例如“写个策略”），先询问具体的因子、周期、风控要求。
        * 如果用户给出了具体逻辑，先用自然语言复述一遍你的理解，确认逻辑闭环（例如：“我理解您的策略逻辑是：在早盘9:30-10:00之间，如果...，则执行...”）。
    3.  **代码即解释**：在提供代码前，先解释关键的算法思路（如：“为了解决滑点问题，我们采用了...”）。
    4.  **风险提示**：代码之后，必须给出回测建议或潜在风险（如：“注意：该策略在震荡市可能会频繁止损...”）。
    
    【回复格式范例】
    🧐 **策略分析**：
    (这里解释思路...)
    
    💻 **核心代码**：
    \`\`\`python
    # 代码内容...
    \`\`\`
    
    💡 **优化建议**：
    (这里给出一两条专业的改进意见...)

    用户的问题是：${message}
    `;

    // 模拟 AI 回复 (这里为了演示效果，写了一些模拟逻辑)
    // 如果你有 DeepSeek API，这里应该是调用 fetch('https://api.deepseek.com/...')
    
    let replyText = "";
    
    if (message.includes("双均线")) {
        replyText = `🧐 **策略思路分析**：
收到。双均线策略是趋势跟踪的经典入门策略。
我理解您的需求是：
1.  **短周期**（如5日线）上穿 **长周期**（如10日线） -> 形成金叉 -> **全仓买入**。
2.  **短周期** 下穿 **长周期** -> 形成死叉 -> **清仓卖出**。

在这个逻辑中，我们需要注意一个问题：**频繁震荡时的磨损**。为了避免在横盘时反复开平仓，我建议在代码中加入一个“阈值控制”或者“持仓天数限制”。

👇 下面是为您编写的 PTrade 框架下的标准代码：

💻 **策略代码**：
\`\`\`python
# X-TradeBrain 量化策略
# 策略类型：双均线趋势跟踪 (MA5 vs MA10)

def initialize(context):
    # 设置标的：以平安银行为例
    g.security = '000001.SZ'
    # 设置均线周期
    g.short_window = 5
    g.long_window = 10
    # 设定手续费和滑点
    set_commission(PerTrade(buy_cost=0.0003, sell_cost=0.0013, min_cost=5))

def handle_data(context, data):
    # 1. 获取历史收盘价数据 (多取一点防止计算不够)
    hist = get_history(g.long_window + 2, '1d', 'close', g.security)
    
    # 2. 计算均线
    ma_short = hist.iloc[-g.short_window:].mean()
    ma_long = hist.iloc[-g.long_window:].mean()
    
    # 3. 获取当前持仓
    current_position = context.portfolio.positions[g.security].amount
    
    # 4. 交易逻辑
    # 金叉且无持仓 -> 买入
    if ma_short > ma_long and current_position == 0:
        log.info(f"金叉触发，买入 {g.security}")
        order_target_percent(g.security, 1.0)
        
    # 死叉且有持仓 -> 卖出
    elif ma_short < ma_long and current_position > 0:
        log.info(f"死叉触发，卖出 {g.security}")
        order_target(g.security, 0)

\`\`\`

💡 **优化建议**：
1.  **过滤震荡**：可以尝试加入 ATR 指标，只有在波动率放大时才通过均线信号开仓。
2.  **止损保护**：建议加入 5% 的固定止损，防止单边下跌时的深度回撤。
3.  **资金管理**：目前是全仓买卖，实盘建议控制仓位，例如每次只动用 30% 资金。

您觉得这个逻辑是否符合您的预期？如果需要加入止损逻辑，请随时告诉我。`;
    } else {
        // 通用回复模式
        replyText = `收到您的指令：**"${message}"**。

🤔 **正在深度思考...**
作为一个量化策略，这部分逻辑稍显复杂。为了确保代码准确，我需要确认几个细节：
1. 您是希望在 **回测环境** 跑，还是 **实盘环境**？
2. 交易频率是 **日线级别** 还是 **分钟级别**？

(此处模拟 AI 的交互式提问，引导用户完善思路)`;
    }

    // 存入数据库
    await supabase.from('messages').insert([
        { role: 'ai', content: replyText }
    ]);

    return NextResponse.json({ reply: replyText });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}