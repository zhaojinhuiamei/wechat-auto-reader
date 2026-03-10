import { NextRequest, NextResponse } from 'next/server'
import { analyzeArticle } from '@/utils/claude'
import { createFeishuDoc, sendFeishuNotification } from '@/utils/feishu'

/**
 * 测试单篇文章解读流程
 * POST /api/test/analyze-article
 * Body: {
 *   "title": "文章标题",
 *   "content": "文章内容",
 *   "webhookUrl": "飞书Webhook URL（可选）"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { title, content, webhookUrl } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: '请提供title和content参数' },
        { status: 400 }
      )
    }

    console.log(`开始测试文章解读: ${title}`)

    // 1. 使用Claude解读文章
    console.log('步骤1: 调用Claude API解读文章...')
    const analysis = await analyzeArticle(title, content)
    console.log('✅ 文章解读完成')

    // 2. 生成飞书文档
    console.log('步骤2: 生成飞书文档...')
    const feishuResult = await createFeishuDoc(analysis.markdownContent, title)

    if (!feishuResult.success) {
      throw new Error(feishuResult.error || '生成飞书文档失败')
    }
    console.log('✅ 飞书文档生成完成')

    // 3. 发送飞书通知（如果提供了webhook）
    if (webhookUrl) {
      console.log('步骤3: 发送飞书通知...')
      await sendFeishuNotification(
        webhookUrl,
        title,
        `📰 测试文章解读\n\n${analysis.summary.substring(0, 200)}...`,
        feishuResult.docUrl
      )
      console.log('✅ 飞书通知发送完成')
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: analysis.summary,
        keyPoints: analysis.keyPoints,
        insights: analysis.insights,
        feishuDocUrl: feishuResult.docUrl,
        notificationSent: !!webhookUrl
      }
    })

  } catch (error) {
    console.error('测试失败:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '未知错误',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
