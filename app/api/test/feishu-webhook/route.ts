import { NextRequest, NextResponse } from 'next/server'
import { testFeishuWebhook } from '@/utils/feishu'

/**
 * 测试飞书Webhook连接
 * POST /api/test/feishu-webhook
 * Body: { "webhookUrl": "https://open.feishu.cn/..." }
 */
export async function POST(request: NextRequest) {
  try {
    const { webhookUrl } = await request.json()

    if (!webhookUrl) {
      return NextResponse.json(
        { error: '请提供webhookUrl参数' },
        { status: 400 }
      )
    }

    const success = await testFeishuWebhook(webhookUrl)

    if (success) {
      return NextResponse.json({
        success: true,
        message: '飞书Webhook测试成功！请检查你的飞书群聊。'
      })
    } else {
      return NextResponse.json(
        { error: '飞书Webhook测试失败，请检查URL是否正确' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('测试失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}
