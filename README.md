# 微信公众号自动解读系统

自动抓取微信公众号文章，使用AI解读，并生成飞书文档的Web应用。

## ✨ 功能特性

- 🤖 **全自动化**：每天自动检查公众号更新
- 📝 **AI解读**：使用Claude AI深度解读文章内容
- 📄 **飞书集成**：自动生成飞书文档并推送通知
- 🌐 **Web界面**：用户友好的配置和管理界面
- 💯 **完全免费**：所有服务均使用免费tier

## 🏗️ 技术栈

- **前端**: Next.js 14 + React + Tailwind CSS
- **后端**: Next.js API Routes
- **数据库**: Supabase (PostgreSQL)
- **定时任务**: Vercel Cron Jobs
- **AI**: Claude API (Anthropic)
- **部署**: Vercel (免费)

## 📋 前置要求

1. **Supabase账号** - 免费注册: https://supabase.com
2. **Vercel账号** - 免费注册: https://vercel.com
3. **Anthropic API Key** - 申请: https://console.anthropic.com
4. **飞书Webhook** - 在飞书群聊中添加自定义机器人

## 🚀 部署步骤

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd wechat-auto-reader
```

### 2. 配置Supabase数据库

1. 在 https://supabase.com 创建新项目
2. 在SQL Editor中执行 `database-schema.sql` 文件
3. 获取以下信息：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 3. 配置环境变量

创建 `.env.local` 文件：

```bash
cp .env.example .env.local
```

填写以下环境变量：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# RSSHub
RSSHUB_BASE_URL=https://rsshub.app

# Cron Job密钥（自己生成一个随机字符串）
CRON_SECRET=your_random_secret_key_here

# Claude API
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### 4. 安装依赖

```bash
npm install
```

### 5. 本地测试

```bash
npm run dev
```

访问 http://localhost:3000

### 6. 部署到Vercel

1. 将代码推送到GitHub仓库
2. 访问 https://vercel.com/new
3. 导入你的GitHub仓库
4. 配置环境变量（复制 .env.local 中的内容）
5. 点击Deploy

### 7. 配置Vercel Cron Jobs

1. 进入Vercel项目设置
2. 找到 "Cron Jobs" 选项卡
3. Vercel会自动识别 `next.config.js` 中的cron配置
4. 确认定时任务已启用

## 📝 使用说明

### 添加监控公众号

1. 登录系统
2. 进入"公众号配置"页面
3. 输入公众号名称
4. 获取RSSHub路由（见下文）
5. 点击"添加"

### 获取RSSHub路由

访问 https://docs.rsshub.app/zh/routes/social-media#wei-xin

常用路由格式：
- `/wechat/mp/msgalbum/{公众号ID}` - 文章列表
- `/wechat/mp/{公众号名称}` - 公众号文章

**如何获取公众号ID：**
1. 访问 https://weixin.sogou.com
2. 搜索目标公众号
3. 进入公众号主页
4. URL中的参数即为公众号ID

### 配置飞书通知

1. 在飞书群聊中添加"自定义机器人"
2. 复制Webhook URL
3. 在系统中粘贴Webhook URL
4. 点击"保存"

## 🔧 手动触发定时任务（测试用）

```bash
curl -X GET https://your-domain.vercel.app/api/cron/daily-check \
  -H "Authorization: Bearer your_cron_secret"
```

## 📊 项目结构

```
wechat-auto-reader/
├── app/
│   ├── api/
│   │   └── cron/
│   │       └── daily-check/
│   │           └── route.ts      # 定时任务API
│   ├── dashboard/                # 用户仪表板
│   └── page.tsx                  # 首页
├── lib/
│   └── supabase.ts              # Supabase客户端
├── utils/
│   ├── rss.ts                   # RSS抓取工具
│   ├── claude.ts                # Claude AI集成
│   └── feishu.ts                # 飞书集成
├── database-schema.sql          # 数据库Schema
├── next.config.js              # Next.js配置
├── package.json
└── README.md
```

## ⚠️ 重要提示

### 关于MCP doc-parser集成

当前代码中的 `utils/feishu.ts` 需要集成你的MCP doc-parser工具。有两种方案：

**方案1：使用API封装**
将MCP doc-parser工具封装为独立的API服务，然后在Vercel中调用。

**方案2：使用飞书开放平台API**
直接使用飞书开放平台的文档API创建文档，不依赖MCP工具。

建议使用方案2，示例代码：

```typescript
// 使用飞书开放平台API创建文档
async function createFeishuDocViaAPI(markdown: string, title: string) {
  // 1. 获取tenant_access_token
  // 2. 调用文档API创建文档
  // 3. 返回文档URL
  // 详见：https://open.feishu.cn/document/server-docs/docs/docs/docx-v1/document/create
}
```

### 免费额度说明

- **Vercel**:
  - 100GB带宽/月
  - Cron Jobs: 每天最多触发1次（免费plan）

- **Supabase**:
  - 500MB数据库
  - 1GB文件存储
  - 50,000行/月的数据库读取

- **Anthropic Claude**:
  - 需要付费，但成本很低（每千tokens约$0.003）

## 🐛 常见问题

### Q: RSSHub无法访问？
A: 可以尝试使用其他公共RSSHub实例，或自己部署一个。

### Q: 定时任务没有执行？
A: 检查Vercel的Cron Jobs日志，确认CRON_SECRET配置正确。

### Q: 无法抓取某些公众号？
A: 部分公众号可能没有RSS源，需要使用其他方法。

## 📞 支持与反馈

如有问题或建议，欢迎提Issue。

## 📄 License

MIT License

---

**Made with ❤️ by Claude Code**
