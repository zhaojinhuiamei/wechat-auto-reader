import { NextResponse } from 'next/server'

/**
 * 健康检查和系统状态
 * GET /api/health
 */
export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0-beta',
    services: {
      supabase: {
        configured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || '未配置'
      },
      claude: {
        configured: !!process.env.ANTHROPIC_API_KEY,
        model: 'claude-sonnet-4-5-20250929'
      },
      rsshub: {
        configured: true,
        baseUrl: process.env.RSSHUB_BASE_URL || 'https://rsshub.app'
      },
      feishu: {
        apiConfigured: !!(process.env.FEISHU_APP_ID && process.env.FEISHU_APP_SECRET),
        webhookMode: !(process.env.FEISHU_APP_ID && process.env.FEISHU_APP_SECRET)
      },
      cron: {
        configured: !!process.env.CRON_SECRET,
        schedule: '每天 UTC 0:00 (北京时间 8:00)'
      }
    },
    tips: []
  }

  // 添加配置提示
  if (!health.services.supabase.configured) {
    health.tips.push('⚠️ Supabase未配置，请添加NEXT_PUBLIC_SUPABASE_URL和SUPABASE_SERVICE_ROLE_KEY')
  }

  if (!health.services.claude.configured) {
    health.tips.push('⚠️ Claude API未配置，请添加ANTHROPIC_API_KEY')
  }

  if (!health.services.cron.configured) {
    health.tips.push('⚠️ Cron密钥未配置，请添加CRON_SECRET')
  }

  if (health.services.feishu.webhookMode) {
    health.tips.push('ℹ️ 飞书文档使用简化模式（base64编码），建议配置FEISHU_APP_ID和FEISHU_APP_SECRET以获得完整功能')
  }

  if (health.tips.length === 0) {
    health.tips.push('✅ 所有服务配置完整！系统运行正常。')
  }

  return NextResponse.json(health)
}
