import { createClient } from '@supabase/supabase-js';

// 获取我们之前在 .env.local 里填的那两把钥匙
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 创建并导出连接器
export const supabase = createClient(supabaseUrl, supabaseKey);