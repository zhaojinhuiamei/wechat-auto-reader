-- 数据库Schema设计
-- 在Supabase SQL Editor中执行此脚本

-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 公众号配置表
CREATE TABLE wechat_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_name VARCHAR(255) NOT NULL, -- 公众号名称
  rsshub_route VARCHAR(500), -- RSSHub路由（如 /wechat/mp/msgalbum/xxx）
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, account_name)
);

-- 飞书配置表
CREATE TABLE feishu_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  webhook_url VARCHAR(500) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 文章记录表
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wechat_account_id UUID NOT NULL REFERENCES wechat_accounts(id) ON DELETE CASCADE,

  -- 文章信息
  title VARCHAR(500) NOT NULL,
  url VARCHAR(1000) NOT NULL UNIQUE,
  published_at TIMESTAMP WITH TIME ZONE,

  -- 处理状态
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed

  -- 解读结果
  summary TEXT,
  feishu_doc_url VARCHAR(1000),

  -- 错误信息
  error_message TEXT,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,

  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- 定时任务日志表
CREATE TABLE cron_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_type VARCHAR(50) NOT NULL, -- daily_check
  status VARCHAR(50) NOT NULL, -- started, completed, failed
  articles_found INTEGER DEFAULT 0,
  articles_processed INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表添加更新时间触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wechat_accounts_updated_at BEFORE UPDATE ON wechat_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feishu_configs_updated_at BEFORE UPDATE ON feishu_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建RLS (Row Level Security) 策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wechat_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feishu_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的数据
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own wechat accounts" ON wechat_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wechat accounts" ON wechat_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wechat accounts" ON wechat_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wechat accounts" ON wechat_accounts
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own feishu config" ON feishu_configs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feishu config" ON feishu_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feishu config" ON feishu_configs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own articles" ON articles
  FOR SELECT USING (auth.uid() = user_id);

-- Cron logs表不需要RLS（仅后端访问）
ALTER TABLE cron_logs DISABLE ROW LEVEL SECURITY;
