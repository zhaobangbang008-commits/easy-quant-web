import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // 真正的逻辑：不再输出任何“(此处...)”这种废话
    let replyText = "";
    
    if (message.includes("双均线")) {
        // 针对策略请求，直接给出专业回复
        replyText = `### 🧐 策略逻辑确认
收到。双均线策略（Dual Moving Average Crossover）是趋势跟踪的经典模型。
核心逻辑如下：
1. **买入信号**：短期均线（MA5）上穿长期均线（MA10），形成金叉。
2. **卖出信号**：短期均线（MA5）下穿长期均线（MA10），形成死叉。

---

### 💻 PTrade 策略代码
\`\`\`python
def initialize(context):
    # 设定标的：以贵州茅台为例
    g.security = '600519.SS'
    # 设定均线周期
    g.short_len = 5
    g.long_len = 10
    set_universe([g.security])

def handle_data(context, data):
    # 获取历史收盘价
    hist = get_history(g.long_len + 2, '1d', 'close', g.security)
    
    # 计算均线
    ma_short = hist.iloc[-g.short_len:].mean()
    ma_long = hist.iloc[-g.long_len:].mean()
    
    # 获取持仓
    position = context.portfolio.positions[g.security].amount
    
    # 金叉买入
    if ma_short > ma_long and position == 0:
        order_target_percent(g.security, 1.0)
        log.info("金叉触发，全仓买入")
        
    # 死叉卖出
    elif ma_short < ma_long and position > 0:
        order_target(g.security, 0)
        log.info("死叉触发，清仓止盈")
\`\`\`

### 💡 风险提示
该策略在震荡市中可能会频繁触发假信号，导致手续费磨损。建议加入 **ATR 波动率过滤** 或 **RSI 指标** 进行辅助判断。`;
    } else {
        // 通用回复，引导性强，但绝不显示内部指令
        replyText = `收到指令：**"${message}"**。

作为 X-TradeBrain 量化助手，为了给您提供准确的代码，我需要确认以下细节：

1. **运行环境**：您是在 **回测** 阶段还是准备 **实盘**？
2. **交易频率**：是 **日线 (Daily)** 级别还是 **分钟 (Minute)** 级别？

您可以直接告诉我，例如：“我要写一个基于日线的实盘策略”。`;
    }

    // 存入数据库
    await supabase.from('messages').insert([
        { role: 'ai', content: replyText }
    ]);

    return NextResponse.json({ reply: replyText });

  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}