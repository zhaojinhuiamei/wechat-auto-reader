import { NextRequest, NextResponse } from 'next/server'
import { fetchWeChatArticles } from '@/utils/rss'

/**
 * 测试RSS抓取
 * GET /api/test/rss?route=/wechat/mp/msgalbum/xxxxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const route = searchParams.get('route')

    if (!route) {
      return NextResponse.json(
        { error: '请提供route参数，例如: /wechat/mp/msgalbum/xxxxx' },
        { status: 400 }
      )
    }

    console.log(`测试RSS抓取: ${route}`)

    const articles = await fetchWeChatArticles(route)

    return NextResponse.json({
      success: true,
      count: articles.length,
      articles: articles.map(article => ({
        title: article.title,
        url: article.url,
        publishedAt: article.publishedAt,
        description: article.description?.substring(0, 200) + '...'
      }))
    })

  } catch (error) {
    console.error('RSS抓取测试失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}
