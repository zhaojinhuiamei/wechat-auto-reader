# 🚀 快速部署测试版本

按照以下步骤快速部署你的测试环境。

## ⚡ 最小配置快速启动（5分钟）

### 步骤1: 准备Supabase（2分钟）

1. 访问 https://supabase.com/dashboard/sign-up
2. 创建新项目 `wechat-auto-reader-test`
3. 等待项目初始化完成
4. 进入 SQL Editor，执行 `database-schema.sql` 的内容
5. 进入 Settings → API，复制以下信息：
   - Project URL
   - anon public key
   - service_role key

### 步骤2: 获取Claude API Key（1分钟）

1. 访问 https://console.anthropic.com
2. 登录后进入 API Keys
3. 创建新密钥并复制

### 步骤3: 准备飞书Webhook（1分钟）

1. 打开飞书群聊
2. 群设置 → 群机器人 → 添加机器人 → 自定义机器人
3. 复制Webhook URL

### 步骤4: 部署到Vercel（1分钟）

#### 方式A: 通过GitHub（推荐）

```bash
# 1. 初始化Git（如果还没有）
cd wechat-auto-reader
git init
git add .
git commit -m "Initial commit"

# 2. 创建GitHub仓库并推送
# 在GitHub上创建新仓库: wechat-auto-reader
git remote add origin https://github.com/你的用户名/wechat-auto-reader.git
git branch -M main
git push -u origin main
```

然后：
1. 访问 https://vercel.com/new
2. 导入你的GitHub仓库
3. 配置环境变量（见下方）
4. 点击Deploy

#### 方式B: 通过Vercel CLI

```bash
# 安装Vercel CLI
npm i -g vercel

# 登录Vercel
vercel login

# 部署
cd wechat-auto-reader
vercel
```

### 步骤5: 配置环境变量

在Vercel部署页面添加以下环境变量：

**必需配置：**
```env
# Supabase（必需）
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Claude API（必需）
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Cron密钥（必需，自己生成一个随机字符串）
CRON_SECRET=my_super_secret_key_12345
```

**可选配置：**
```env
# RSSHub（可选，有默认值）
RSSHUB_BASE_URL=https://rsshub.app

# 飞书开放平台（可选，不配置则使用简化方案）
FEISHU_APP_ID=cli_xxxxx
FEISHU_APP_SECRET=xxxxx
FEISHU_FOLDER_TOKEN=xxxxx
```

---

## 🧪 测试你的部署

部署完成后，访问你的Vercel域名（例如：`your-app.vercel.app`）

### 1. 健康检查

```bash
curl https://your-app.vercel.app/api/health
```

应该返回系统状态信息。

### 2. 测试飞书Webhook

```bash
curl -X POST https://your-app.vercel.app/api/test/feishu-webhook \
  -H "Content-Type: application/json" \
  -d '{"webhookUrl":"你的飞书Webhook URL"}'
```

检查飞书群聊是否收到测试消息。

### 3. 测试RSS抓取

```bash
# 测试中国汽车标准化研究院公众号
curl "https://your-app.vercel.app/api/test/rss?route=/wechat/mp/msgalbum/MzUyODc3NzI5NQ=="
```

应该返回文章列表。

### 4. 测试完整流程

```bash
curl -X POST https://your-app.vercel.app/api/test/analyze-article \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试文章标题",
    "content": "这是一篇测试文章的内容。主要讨论微信公众号自动化解读系统的实现方案，包括RSS抓取、AI分析、飞书集成等功能。",
    "webhookUrl": "你的飞书Webhook URL"
  }'
```

检查：
1. API返回成功响应
2. 飞书群聊收到通知
3. 可以查看生成的文档

### 5. 手动触发定时任务（测试）

```bash
curl -X GET https://your-app.vercel.app/api/cron/daily-check \
  -H "Authorization: Bearer your_cron_secret"
```

检查Vercel日志查看执行情况。

---

## 📊 监控和调试

### 查看实时日志

1. 进入 Vercel Dashboard
2. 选择你的项目
3. 点击 "Logs"
4. 查看实时日志输出

### 检查Cron Jobs状态

1. Vercel项目 → Settings → Cron Jobs
2. 查看执行历史
3. 查看错误日志

### 查看Supabase数据

1. Supabase Dashboard → Table Editor
2. 查看各表数据：
   - `users` - 用户
   - `wechat_accounts` - 公众号配置
   - `articles` - 文章记录
   - `cron_logs` - 定时任务日志

---

## 🎯 添加第一个监控公众号

### 方法1: 直接操作数据库（测试用）

在Supabase SQL Editor中执行：

```sql
-- 1. 创建测试用户
INSERT INTO users (email) VALUES ('test@example.com')
RETURNING id;

-- 2. 添加公众号配置（使用上面返回的user_id）
INSERT INTO wechat_accounts (user_id, account_name, rsshub_route)
VALUES (
  '上面返回的user_id',
  '中国汽车标准化研究院',
  '/wechat/mp/msgalbum/MzUyODc3NzI5NQ=='
);

-- 3. 添加飞书配置
INSERT INTO feishu_configs (user_id, webhook_url)
VALUES (
  '上面返回的user_id',
  '你的飞书Webhook URL'
);
```

### 方法2: 通过Web界面（开发中）

目前Web界面尚未完善，可以先使用数据库方式添加。

---

## ⚙️ 如何找到公众号的RSSHub路由

### 步骤1: 搜索公众号

访问搜狗微信搜索：https://weixin.sogou.com

### 步骤2: 获取公众号ID

1. 搜索目标公众号
2. 点击进入公众号主页
3. 查看URL，复制其中的ID（类似 `MzUyODc3NzI5NQ==`）

### 步骤3: 构造RSSHub路由

使用格式：`/wechat/mp/msgalbum/{公众号ID}`

例如：`/wechat/mp/msgalbum/MzUyODc3NzI5NQ==`

### 步骤4: 测试路由

```bash
curl "https://your-app.vercel.app/api/test/rss?route=/wechat/mp/msgalbum/公众号ID"
```

---

## 🐛 常见问题

### Q: 健康检查显示服务未配置

**检查：**
1. Vercel环境变量是否正确设置
2. 重新部署项目（Vercel会重新加载环境变量）

### Q: Claude API调用失败

**可能原因：**
- API Key错误或过期
- API额度用尽
- 网络问题

**解决：**
1. 验证API Key: https://console.anthropic.com
2. 检查账户额度
3. 查看Vercel日志的详细错误

### Q: RSS抓取失败

**可能原因：**
- RSSHub路由错误
- RSSHub服务不可用
- 公众号ID不正确

**解决：**
1. 验证RSSHub路由：访问 `https://rsshub.app/wechat/mp/msgalbum/公众号ID`
2. 尝试其他RSSHub实例
3. 确认公众号ID正确

### Q: 飞书通知发送失败

**检查：**
1. Webhook URL是否正确
2. 机器人是否已添加到群聊
3. 测试Webhook：`curl -X POST "webhook_url" -d '{"msg_type":"text","content":{"text":"test"}}'`

### Q: Cron Job不执行

**注意：**
- Vercel免费版每天只能运行1次Cron Job
- 检查CRON_SECRET是否配置
- 查看Vercel的Cron Jobs页面确认状态

---

## 📈 下一步

测试通过后，你可以：

1. ✅ 添加更多公众号监控
2. ✅ 调整定时任务频率
3. ✅ 完善Web管理界面
4. ✅ 添加用户认证系统
5. ✅ 优化文章解读提示词
6. ✅ 部署到生产环境

---

## 💬 获取支持

如遇问题：

1. 查看Vercel日志
2. 查看Supabase日志
3. 检查环境变量配置
4. 提Issue到GitHub仓库

---

**祝测试顺利！🎉**
