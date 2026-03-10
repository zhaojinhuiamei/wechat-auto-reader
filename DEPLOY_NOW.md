# 🚀 立即部署测试版本

## 现在就开始！

我已经为你准备好了一个**完整可用**的测试版本。按照以下步骤，**15分钟内**即可完成部署。

---

## 📦 你得到了什么

✅ **完整的后端系统**
- RSS抓取功能
- Claude AI解读
- 飞书集成（支持两种模式）
- 定时任务
- 完整的数据库设计

✅ **测试接口**
- `/api/health` - 健康检查
- `/api/test/rss` - 测试RSS抓取
- `/api/test/feishu-webhook` - 测试飞书通知
- `/api/test/analyze-article` - 测试完整流程

✅ **详细文档**
- README.md - 项目说明
- QUICKSTART.md - 快速开始
- DEPLOYMENT.md - 详细部署
- CHECKLIST.md - 检查清单

---

## ⚡ 快速部署（3步骤）

### 步骤1: 准备必需服务（5分钟）

#### 1.1 Supabase数据库

1. 访问 https://supabase.com → Sign Up
2. 创建新项目：`wechat-reader-test`
3. 等待初始化（~2分钟）
4. 进入 SQL Editor → New Query
5. 复制粘贴 `database-schema.sql` 的内容
6. 点击Run执行
7. 进入 Settings → API，复制以下信息：
   ```
   Project URL: https://xxxxx.supabase.co
   anon public: eyJhbGc...
   service_role: eyJhbGc... (点击Reveal显示)
   ```

#### 1.2 Claude API

1. 访问 https://console.anthropic.com
2. 登录 → API Keys → Create Key
3. 复制密钥：`sk-ant-xxxxx`

#### 1.3 飞书Webhook

1. 打开飞书群聊
2. 群设置 → 群机器人 → 添加机器人 → 自定义机器人
3. 复制Webhook URL

#### 1.4 生成Cron密钥

```bash
# 在命令行执行
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

复制生成的密钥。

---

### 步骤2: 部署到Vercel（5分钟）

#### 方式A: 通过GitHub（推荐）

```bash
# 进入项目目录
cd C:\Users\zhaojinhui\wechat-auto-reader

# 初始化Git
git init
git add .
git commit -m "Initial commit - test version"

# 在GitHub创建新仓库后推送
git remote add origin https://github.com/你的用户名/wechat-auto-reader.git
git branch -M main
git push -u origin main
```

然后：

1. 访问 https://vercel.com/new
2. Import Git Repository → 选择你的仓库
3. 点击Import
4. 配置环境变量（见下文）
5. Deploy

#### 方式B: 使用Vercel CLI

```bash
# 安装Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
cd C:\Users\zhaojinhui\wechat-auto-reader
vercel
```

---

### 步骤3: 配置环境变量（2分钟）

在Vercel部署页面的Environment Variables中添加：

```env
NEXT_PUBLIC_SUPABASE_URL=你的Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon key
SUPABASE_SERVICE_ROLE_KEY=你的service role key
ANTHROPIC_API_KEY=你的Claude API key
CRON_SECRET=你生成的随机密钥
RSSHUB_BASE_URL=https://rsshub.app
```

点击Deploy！

---

## ✅ 部署完成后测试（3分钟）

部署成功后，你会得到一个域名，例如：`your-app.vercel.app`

### 测试1: 健康检查

```bash
curl https://your-app.vercel.app/api/health
```

**应该看到：**
```json
{
  "status": "healthy",
  "services": {
    "supabase": { "configured": true },
    "claude": { "configured": true },
    ...
  }
}
```

### 测试2: 飞书Webhook

```bash
curl -X POST https://your-app.vercel.app/api/test/feishu-webhook \
  -H "Content-Type: application/json" \
  -d '{"webhookUrl":"你的飞书Webhook URL"}'
```

检查飞书群聊，应该收到测试消息！

### 测试3: 完整流程

```bash
curl -X POST https://your-app.vercel.app/api/test/analyze-article \
  -H "Content-Type: application/json" \
  -d '{
    "title": "🎉 部署成功测试",
    "content": "恭喜！你的微信公众号自动解读系统已成功部署。这是一条测试消息，用于验证完整的工作流程，包括Claude AI解读和飞书通知功能。系统现在可以自动抓取公众号文章、进行智能解读，并推送到飞书群聊了。",
    "webhookUrl": "你的飞书Webhook URL"
  }'
```

几秒钟后，飞书群聊会收到一张漂亮的卡片通知，包含AI解读结果！

---

## 📝 添加第一个监控公众号（2分钟）

在Supabase Dashboard → SQL Editor中执行：

```sql
-- 1. 创建用户
INSERT INTO users (email)
VALUES ('你的邮箱@example.com')
RETURNING id;

-- 复制上面返回的user_id，替换下面的 'USER_ID'

-- 2. 添加公众号（示例：中国汽车标准化研究院）
INSERT INTO wechat_accounts (user_id, account_name, rsshub_route, is_active)
VALUES (
  'USER_ID',
  '中国汽车标准化研究院',
  '/wechat/mp/msgalbum/MzUyODc3NzI5NQ==',
  true
);

-- 3. 添加飞书配置
INSERT INTO feishu_configs (user_id, webhook_url, is_active)
VALUES (
  'USER_ID',
  '你的飞书Webhook URL',
  true
);

-- 4. 验证配置
SELECT
  u.email,
  w.account_name,
  w.rsshub_route,
  f.webhook_url
FROM users u
JOIN wechat_accounts w ON w.user_id = u.id
JOIN feishu_configs f ON f.user_id = u.id;
```

---

## 🎯 手动触发第一次抓取（测试定时任务）

```bash
curl -X GET https://your-app.vercel.app/api/cron/daily-check \
  -H "Authorization: Bearer 你的CRON_SECRET"
```

**应该看到：**
```json
{
  "success": true,
  "articlesFound": 5,
  "articlesProcessed": 2
}
```

同时，飞书群聊会收到新文章的解读通知！

---

## 📊 查看结果

### 在Supabase中查看数据

1. Supabase → Table Editor
2. 查看 `articles` 表：
   - 应该有新记录
   - status为"completed"
   - 有feishu_doc_url链接
3. 查看 `cron_logs` 表：
   - 应该有执行记录
   - status为"completed"

### 在Vercel中查看日志

1. Vercel Dashboard → 你的项目 → Logs
2. 查看实时日志输出
3. 确认没有错误

---

## ⏰ 定时任务配置

系统已配置为**每天UTC 0:00（北京时间8:00）**自动执行。

### 验证Cron Jobs配置

1. Vercel Dashboard → 你的项目
2. Settings → Cron Jobs
3. 确认看到：`/api/cron/daily-check` - `0 0 * * *`

⚠️ **注意**：Vercel免费版每天只能运行1次Cron Job。

---

## 🎨 体验工作流程

现在系统会：

1. **每天早上8点**自动检查你配置的公众号
2. **发现新文章**后自动抓取
3. **使用Claude AI**深度解读文章内容
4. **生成飞书文档**（结构化的Markdown）
5. **推送通知**到你的飞书群聊
6. **所有数据**自动保存到数据库

你什么都不用做，每天早上打开飞书，就能看到最新的公众号文章解读！

---

## 🚨 如果遇到问题

### Claude API报错

**原因**：API密钥错误或额度不足

**解决**：
1. 验证API Key：https://console.anthropic.com/settings/keys
2. 检查账户额度：https://console.anthropic.com/settings/billing

### RSS抓取失败

**原因**：RSSHub路由错误或服务不可用

**解决**：
1. 测试RSSHub：访问 `https://rsshub.app/wechat/mp/msgalbum/公众号ID`
2. 如果不可用，尝试其他实例：
   - https://rsshub.rssforever.com
   - https://rsshub.feeded.xyz

### 飞书通知未收到

**检查**：
1. Webhook URL是否正确
2. 机器人是否在群聊中
3. 测试Webhook：
```bash
curl -X POST "你的Webhook URL" \
  -H "Content-Type: application/json" \
  -d '{"msg_type":"text","content":{"text":"test"}}'
```

---

## 📈 下一步建议

测试通过后：

### 短期（本周）
- ✅ 添加更多公众号监控
- ✅ 观察AI解读质量，调整Prompt
- ✅ 收集团队反馈

### 中期（本月）
- ✅ 完善Web管理界面
- ✅ 添加用户登录系统
- ✅ 优化文档格式

### 长期（季度）
- ✅ 支持更多数据源
- ✅ 实现全文搜索
- ✅ 开发数据分析功能

---

## 💰 成本估算

基于测试环境（每天10篇文章）：

| 服务 | 用量 | 成本 |
|------|------|------|
| Vercel | 免费tier | $0 |
| Supabase | <100MB | $0 |
| Claude API | ~20k tokens/天 | ~$0.06/天 |
| RSSHub | 公共实例 | $0 |
| **月度总计** | | **~$1.8** |

几乎免费！🎉

---

## 🎉 恭喜！

你现在有了一个**完全自动化**的微信公众号解读系统：

✅ 全自动运行
✅ AI智能解读
✅ 飞书即时通知
✅ 数据完整记录
✅ 可扩展架构

**开始享受自动化带来的便利吧！**

---

## 📞 技术支持

需要帮助？

1. 查看 `QUICKSTART.md` - 快速入门
2. 查看 `DEPLOYMENT.md` - 详细部署
3. 查看 `CHECKLIST.md` - 检查清单
4. GitHub Issues - 提交问题

---

**Made with ❤️ by Claude Code**

**祝你使用愉快！🚀**
