# 🎯 部署检查清单

在部署到生产环境前，使用此清单确保一切就绪。

## 📋 部署前检查

### 1. 基础配置

- [ ] 已创建Supabase项目
- [ ] 已执行database-schema.sql创建所有表
- [ ] 已获取Supabase API密钥（3个）
- [ ] 已获取Claude API密钥
- [ ] 已创建飞书群聊和Webhook
- [ ] 已生成CRON_SECRET密钥

### 2. 环境变量（必需）

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `ANTHROPIC_API_KEY`
- [ ] `CRON_SECRET`

### 3. 环境变量（可选）

- [ ] `RSSHUB_BASE_URL` (默认: https://rsshub.app)
- [ ] `FEISHU_APP_ID` (可选，使用完整飞书API)
- [ ] `FEISHU_APP_SECRET` (可选)
- [ ] `FEISHU_FOLDER_TOKEN` (可选)

### 4. 代码准备

- [ ] 代码已推送到GitHub
- [ ] .env.local已添加到.gitignore
- [ ] package.json依赖完整
- [ ] TypeScript编译无错误

---

## 🚀 部署步骤

### Vercel部署

- [ ] 已登录Vercel
- [ ] 已导入GitHub仓库
- [ ] 已配置所有环境变量
- [ ] 已触发第一次部署
- [ ] 部署成功，获得域名

---

## ✅ 部署后验证

### 1. 健康检查

```bash
curl https://your-app.vercel.app/api/health
```

**预期结果：**
- status: "healthy"
- 所有服务显示configured: true
- tips数组为空或只有非关键提示

### 2. 飞书Webhook测试

```bash
curl -X POST https://your-app.vercel.app/api/test/feishu-webhook \
  -H "Content-Type: application/json" \
  -d '{"webhookUrl":"你的飞书Webhook"}'
```

**预期结果：**
- 返回 success: true
- 飞书群聊收到测试消息

### 3. RSS抓取测试

```bash
curl "https://your-app.vercel.app/api/test/rss?route=/wechat/mp/msgalbum/MzUyODc3NzI5NQ=="
```

**预期结果：**
- 返回文章列表
- count > 0
- 每篇文章有title、url、publishedAt

### 4. 完整流程测试

```bash
curl -X POST https://your-app.vercel.app/api/test/analyze-article \
  -H "Content-Type: application/json" \
  -d '{
    "title": "部署测试文章",
    "content": "这是一篇测试文章，用于验证系统是否正常工作。包括RSS抓取、Claude解读、飞书文档生成等完整流程。",
    "webhookUrl": "你的飞书Webhook"
  }'
```

**预期结果：**
- success: true
- 返回summary、keyPoints、insights
- 返回feishuDocUrl
- 飞书群聊收到通知卡片

### 5. Cron Job手动触发

```bash
curl -X GET https://your-app.vercel.app/api/cron/daily-check \
  -H "Authorization: Bearer your_cron_secret"
```

**预期结果：**
- 返回 success: true
- 显示articlesFound和articlesProcessed数量

---

## 📊 数据验证

### Supabase数据库检查

进入Supabase Dashboard → Table Editor，检查：

- [ ] `users` 表可访问
- [ ] `wechat_accounts` 表可访问
- [ ] `articles` 表可访问
- [ ] `feishu_configs` 表可访问
- [ ] `cron_logs` 表可访问
- [ ] RLS策略已启用

### 添加测试数据

在SQL Editor中执行：

```sql
-- 创建测试用户
INSERT INTO users (email) VALUES ('test@example.com');

-- 查询用户ID
SELECT id FROM users WHERE email = 'test@example.com';

-- 添加公众号配置（替换USER_ID）
INSERT INTO wechat_accounts (user_id, account_name, rsshub_route)
VALUES ('USER_ID', '中国汽车标准化研究院', '/wechat/mp/msgalbum/MzUyODc3NzI5NQ==');

-- 添加飞书配置（替换USER_ID和WEBHOOK_URL）
INSERT INTO feishu_configs (user_id, webhook_url)
VALUES ('USER_ID', 'YOUR_WEBHOOK_URL');

-- 验证数据
SELECT * FROM wechat_accounts;
SELECT * FROM feishu_configs;
```

---

## ⚙️ Vercel配置检查

### Cron Jobs

- [ ] 进入 Vercel项目 → Settings → Cron Jobs
- [ ] 确认看到 `/api/cron/daily-check`
- [ ] Schedule显示 `0 0 * * *`
- [ ] Status为 Enabled

### 环境变量

- [ ] 进入 Settings → Environment Variables
- [ ] 确认所有必需变量已设置
- [ ] Production、Preview、Development都已配置

### 日志监控

- [ ] 进入 Logs页面
- [ ] 可以看到实时日志输出
- [ ] 没有Critical错误

---

## 🎯 功能测试清单

### 基础功能

- [ ] 首页可以正常访问
- [ ] /api/health返回正常
- [ ] 测试接口全部可用

### RSS抓取

- [ ] 可以成功抓取公众号文章列表
- [ ] 文章信息完整（标题、链接、时间）
- [ ] 错误处理正常

### AI解读

- [ ] Claude API调用成功
- [ ] 返回结构化解读结果
- [ ] Markdown格式正确

### 飞书集成

- [ ] Webhook通知发送成功
- [ ] 消息卡片格式正确
- [ ] 文档链接可访问（如果配置了飞书API）

### 定时任务

- [ ] Cron Job可以手动触发
- [ ] 执行逻辑正确
- [ ] 数据正确写入数据库
- [ ] 错误日志记录完整

---

## 🔒 安全检查

- [ ] .env文件已添加到.gitignore
- [ ] CRON_SECRET足够复杂（至少32字符）
- [ ] Supabase RLS已启用
- [ ] API密钥未暴露在客户端代码
- [ ] Webhook URL保密

---

## 📈 性能检查

- [ ] 首页加载速度 < 2秒
- [ ] API响应时间 < 5秒
- [ ] Claude API调用有超时设置
- [ ] 数据库查询已优化

---

## 🐛 错误处理

- [ ] 所有API都有try-catch
- [ ] 错误信息记录到日志
- [ ] 用户看到友好的错误提示
- [ ] 失败的任务标记为failed状态

---

## 📱 通知测试

### 正常通知

- [ ] 新文章通知格式正确
- [ ] 包含文章标题和摘要
- [ ] 文档链接可点击
- [ ] 时间显示正确

### 错误通知（可选）

- [ ] 系统错误时发送告警
- [ ] 包含错误详情
- [ ] 方便快速定位问题

---

## 🎉 生产环境准备

### 最终检查

- [ ] 所有测试通过
- [ ] 文档完善
- [ ] 已创建监控告警
- [ ] 已设置备份策略
- [ ] 团队成员已培训

### 上线准备

- [ ] 选择合适的上线时间
- [ ] 准备回滚方案
- [ ] 通知相关人员
- [ ] 监控系统运行

### 上线后

- [ ] 观察第一次Cron Job执行
- [ ] 检查生成的文档质量
- [ ] 收集用户反馈
- [ ] 记录问题和优化点

---

## 💡 优化建议

### 短期优化

- [ ] 添加用户登录功能
- [ ] 完善Web管理界面
- [ ] 优化文章解读Prompt
- [ ] 添加更多测试用例

### 中期优化

- [ ] 支持更多RSS源
- [ ] 添加文章分类标签
- [ ] 实现全文搜索
- [ ] 数据统计Dashboard

### 长期优化

- [ ] 多租户支持
- [ ] API对外开放
- [ ] 移动端应用
- [ ] 企业版功能

---

## 📞 问题反馈

遇到问题时记录：

1. **问题描述**：
2. **复现步骤**：
3. **预期结果**：
4. **实际结果**：
5. **环境信息**：
6. **错误日志**：
7. **截图**（如有）：

---

**检查完成！准备上线！🚀**
