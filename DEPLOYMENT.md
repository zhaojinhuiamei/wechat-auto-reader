# 部署指南

本指南将帮助你从零开始部署微信公众号自动解读系统。

## 📝 目录

1. [准备工作](#准备工作)
2. [Supabase配置](#supabase配置)
3. [本地开发](#本地开发)
4. [Vercel部署](#vercel部署)
5. [MCP集成方案](#mcp集成方案)
6. [测试验证](#测试验证)
7. [常见问题](#常见问题)

---

## 准备工作

### 1. 注册必要的服务账号

- [ ] Supabase账号: https://supabase.com/dashboard/sign-up
- [ ] Vercel账号: https://vercel.com/signup
- [ ] Anthropic账号: https://console.anthropic.com
- [ ] GitHub账号: https://github.com/signup

### 2. 获取API密钥

#### Anthropic API Key

1. 访问 https://console.anthropic.com
2. 登录后点击 "API Keys"
3. 点击 "Create Key"
4. 复制并保存密钥（格式：`sk-ant-xxxxx`）

#### 飞书Webhook

1. 打开飞书群聊
2. 点击右上角设置 → 群机器人 → 添加机器人
3. 选择"自定义机器人"
4. 设置名称和头像
5. 复制Webhook地址（格式：`https://open.feishu.cn/open-apis/bot/v2/hook/xxxxx`）

---

## Supabase配置

### 1. 创建Supabase项目

1. 访问 https://supabase.com/dashboard
2. 点击 "New Project"
3. 填写项目信息：
   - Name: `wechat-auto-reader`
   - Database Password: 设置强密码
   - Region: 选择最近的区域（建议：Singapore）
4. 点击 "Create new project"（需要等待2-3分钟）

### 2. 执行数据库Schema

1. 项目创建完成后，点击左侧 "SQL Editor"
2. 点击 "New query"
3. 复制 `database-schema.sql` 文件的全部内容
4. 粘贴到编辑器中
5. 点击右下角 "Run" 按钮
6. 确认所有表创建成功

### 3. 获取API密钥

1. 点击左侧 "Settings" → "API"
2. 找到以下信息并记录：
   - `Project URL`: 类似 `https://xxxxx.supabase.co`
   - `anon public`: 公开匿名密钥
   - `service_role secret`: 服务端密钥（点击"Reveal"显示）

⚠️ **重要**：`service_role` 密钥具有超级权限，请妥善保管！

---

## 本地开发

### 1. 克隆项目

```bash
cd C:\Users\zhaojinhui
git clone <your-repo-url>
cd wechat-auto-reader
```

### 2. 安装依赖

```bash
npm install
```

如果遇到依赖安装问题，尝试：

```bash
npm install --legacy-peer-deps
```

### 3. 配置环境变量

复制环境变量模板：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件：

```env
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...（anon public）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...（service_role secret）

# RSSHub配置
RSSHUB_BASE_URL=https://rsshub.app

# Cron Job密钥（自己生成）
CRON_SECRET=my_super_secret_cron_key_123456

# Claude API
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

**如何生成CRON_SECRET：**

```bash
# 在命令行中生成随机密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

---

## Vercel部署

### 1. 推送代码到GitHub

```bash
# 初始化Git仓库
git init
git add .
git commit -m "Initial commit"

# 创建GitHub仓库后，推送代码
git remote add origin <your-github-repo-url>
git branch -M main
git push -u origin main
```

### 2. 导入项目到Vercel

1. 访问 https://vercel.com/new
2. 点击 "Import Git Repository"
3. 选择你的GitHub仓库
4. 点击 "Import"

### 3. 配置环境变量

在Vercel部署页面的 "Environment Variables" 部分，添加所有环境变量：

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RSSHUB_BASE_URL
CRON_SECRET
ANTHROPIC_API_KEY
```

⚠️ **注意**：不要在GitHub仓库中提交 `.env.local` 文件！

### 4. 部署

1. 确认所有配置无误
2. 点击 "Deploy"
3. 等待部署完成（约2-3分钟）
4. 访问分配的域名（如：`your-app.vercel.app`）

### 5. 配置Cron Jobs

Vercel会自动识别 `vercel.json` 中的cron配置。

验证方法：
1. 进入Vercel项目 → Settings → Cron Jobs
2. 确认看到：`/api/cron/daily-check` - 每天0:00 UTC执行

---

## MCP集成方案

当前 `utils/feishu.ts` 中的 `createFeishuDoc` 函数需要集成MCP doc-parser工具。

### 方案A：使用飞书开放平台API（推荐）

修改 `utils/feishu.ts`：

```typescript
import axios from 'axios'

// 获取飞书tenant_access_token
async function getTenantAccessToken() {
  const response = await axios.post(
    'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
    {
      app_id: process.env.FEISHU_APP_ID,
      app_secret: process.env.FEISHU_APP_SECRET
    }
  )
  return response.data.tenant_access_token
}

// 创建飞书文档
export async function createFeishuDoc(
  markdownContent: string,
  title: string
): Promise<FeishuDocResult> {
  try {
    const token = await getTenantAccessToken()

    // 1. 创建空文档
    const createResponse = await axios.post(
      'https://open.feishu.cn/open-apis/docx/v1/documents',
      { title },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const docId = createResponse.data.data.document.document_id
    const docUrl = `https://example.feishu.cn/docx/${docId}`

    // 2. 将Markdown转换为飞书块格式并写入
    // （这部分需要实现Markdown到飞书格式的转换）

    return {
      docUrl,
      success: true
    }

  } catch (error) {
    console.error('创建飞书文档失败:', error)
    return {
      docUrl: '',
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}
```

需要额外配置：
- 在飞书开放平台创建应用
- 获取 `app_id` 和 `app_secret`
- 添加文档权限

### 方案B：独立MCP服务

将MCP doc-parser封装为独立的HTTP API服务：

```typescript
export async function createFeishuDoc(
  markdownContent: string,
  title: string
): Promise<FeishuDocResult> {
  try {
    // 调用你部署的MCP服务
    const response = await axios.post(
      process.env.MCP_SERVICE_URL + '/parse-markdown',
      {
        content: markdownContent,
        title: title
      }
    )

    return {
      docUrl: response.data.feishuDocUrl,
      success: true
    }

  } catch (error) {
    return {
      docUrl: '',
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}
```

---

## 测试验证

### 1. 测试Supabase连接

创建测试文件 `test-supabase.ts`：

```typescript
import { supabaseAdmin } from './lib/supabase'

async function testConnection() {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .limit(1)

  if (error) {
    console.error('连接失败:', error)
  } else {
    console.log('连接成功!', data)
  }
}

testConnection()
```

运行：
```bash
npx tsx test-supabase.ts
```

### 2. 手动触发Cron Job

```bash
curl -X GET https://your-app.vercel.app/api/cron/daily-check \
  -H "Authorization: Bearer your_cron_secret"
```

检查响应：
```json
{
  "success": true,
  "articlesFound": 5,
  "articlesProcessed": 2
}
```

### 3. 检查日志

在Vercel Dashboard中：
1. 选择你的项目
2. 点击 "Logs"
3. 查看实时日志输出

---

## 常见问题

### Q1: Supabase连接超时

**解决方案：**
- 检查 `NEXT_PUBLIC_SUPABASE_URL` 是否正确
- 确认Supabase项目已激活
- 检查网络连接

### Q2: Cron Job不执行

**可能原因：**
- Vercel免费plan限制每天只能运行一次
- CRON_SECRET配置错误
- cron schedule格式错误

**验证方法：**
```bash
# 手动触发测试
curl -X GET https://your-app.vercel.app/api/cron/daily-check \
  -H "Authorization: Bearer your_cron_secret" \
  -v
```

### Q3: RSSHub无法访问

**解决方案：**
- 尝试其他公共实例：
  - https://rsshub.rssforever.com
  - https://rsshub.feeded.xyz
- 或自己部署RSSHub（Docker一键部署）

### Q4: Claude API超时

**原因：**
- 文章内容过长
- API限流

**解决方案：**
- 截断文章内容到4000字符
- 添加重试逻辑
- 使用更高tier的API

### Q5: 找不到公众号RSSHub路由

**解决方案：**

1. 访问搜狗微信搜索：https://weixin.sogou.com
2. 搜索目标公众号
3. 复制公众号主页URL中的ID
4. 使用路由：`/wechat/mp/msgalbum/{ID}`

如果仍然不行，查看RSSHub文档：
https://docs.rsshub.app/zh/routes/social-media#wei-xin

---

## 🎉 部署完成！

如果所有步骤都顺利完成，你的系统现在应该：

✅ 每天自动检查公众号更新
✅ AI解读新文章
✅ 生成飞书文档
✅ 发送通知到群聊

---

## 📞 获取帮助

如遇到问题，请提供以下信息：

1. 错误日志（Vercel Logs）
2. 配置信息（不要包含密钥）
3. 浏览器控制台错误
4. 复现步骤

提Issue地址：<your-github-repo-url>/issues

---

**祝你使用愉快！**
