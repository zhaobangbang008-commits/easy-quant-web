import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// 1. 初始化数据库连接
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // --- 核心：定义 AI 的“人设” (Consultant Personality) ---
    // 这一段决定了它说话像个专家，而不是机器人
    const systemPrompt = `
    你现在的身份是 "X-TradeBrain"，一位拥有10年经验的量化交易架构师。
    
    【回答准则】
    1. **拒绝冷冰冰**：不要只扔代码，要先用通俗语言解释策略逻辑。
    2. **结构化输出**：按 "🧐 逻辑分析" -> "💻 核心代码" -> "💡 风险提示" 的顺序回答。
    3. **针对性**：用户主要使用 PTrade 和 QMT 平台，代码必须符合这两个平台的 Python 语法。
    `;

    // --- 模拟智能回复逻辑 (Mock Logic) ---
    // 注意：如果你有 DeepSeek 或 OpenAI 的 Key，可以在这里替换为真实的 fetch 调用
    // 为了让你现在直接能看到“聪明”的效果，我在这里写了针对特定问题的完美回复模板
    
    let replyText = "";

    if (message.includes("双均线") || message.includes("均线策略")) {
        replyText = `### 🧐 策略逻辑分析
收到。双均线策略（Dual Moving Average）是趋势跟踪最经典的入门模型。
核心逻辑如下：
1. **买入信号**：短期均线（如 MA5）上穿 长期均线（如 MA10），形成金叉，视为上涨趋势确立。
2. **卖出信号**：短期均线 下穿 长期均线，形成死叉，视为趋势结束。

---

### 💻 PTrade 实盘代码
\`\`\`python
def initialize(context):
    # 设定标的：以贵州茅台为例
    g.security = '600519.SS'
    # 设定均线周期
    g.short_len = 5
    g.long_len = 10
    # 注册股票
    set_universe([g.security])

def handle_data(context, data):
    # 1. 获取历史收盘价 (多取2天以防数据缺失)
    hist = get_history(g.long_len + 2, '1d', 'close', g.security)
    
    # 2. 计算均线
    ma_short = hist.iloc[-g.short_len:].mean()
    ma_long = hist.iloc[-g.long_len:].mean()
    
    # 3. 获取当前持仓
    position = context.portfolio.positions[g.security].amount
    
    # 4. 交易逻辑
    # 金叉且无持仓 -> 全仓买入
    if ma_short > ma_long and position == 0:
        order_target_percent(g.security, 1.0)
        log.info(f"金叉触发，买入 {g.security}")
        
    # 死叉且有持仓 -> 清仓卖出
    elif ma_short < ma_long and position > 0:
        order_target(g.security, 0)
        log.info(f"死叉触发，卖出 {g.security}")
\`\`\`

### 💡 专家建议
该策略在**单边趋势行情**中表现优异，但在**震荡市**中会频繁触发假信号（反复打脸）。
建议优化方向：
* 加入 **ATR 波动率过滤**：只有波动率放大时才开仓。
* 加入 **RSI 指标**：避免在超买区高位追涨。`;

    } else if (message.includes("API") || message.includes("查询") || message.includes("资金")) {
        replyText = `### 📚 API 快速查询
在 PTrade/QMT 中，查询账户资金通常使用 \`context.portfolio\` 对象。

---

### 💻 常用代码片段
\`\`\`python
def handle_data(context, data):
    # 获取账户总资产
    total_value = context.portfolio.portfolio_value
    # 获取可用资金 (现金)
    cash = context.portfolio.cash
    # 获取当前持仓市值
    market_value = context.portfolio.positions_value
    
    log.info(f"当前总资产: {total_value}, 可用现金: {cash}")
\`\`\`

### ⚠️ 注意事项
* 回测模式下，资金是虚拟的，由 \`initialize\` 中的 \`set_commission\` 等函数影响。
* 实盘模式下，这是直接同步柜台的真实资金数据。`;

    } else {
        // 通用回复 (兜底)
        replyText = `### 🤖 收到指令
我已理解您的需求：**"${message}"**。

作为 X-TradeBrain 量化助手，我需要确认更多细节才能生成准确代码：
1. 您是想写 **选股策略** 还是 **择时策略**？
2. 交易频率是 **日线** 还是 **分钟线**？

您可以直接告诉我，例如：“我想写一个基于 RSI 指标的日内回转交易策略”。`;
    }

    // 2. 将 AI 的回复存入数据库 (确保历史记录能看到)
    const { error } = await supabase.from('messages').insert([
        { role: 'ai', content: replyText }
    ]);

    if (error) {
        console.error('Supabase Error:', error);
    }

    // 3. 返回给前端显示
    return NextResponse.json({ reply: replyText });

  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}