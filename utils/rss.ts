import Parser from 'rss-parser'
import axios from 'axios'

const parser = new Parser()

export interface WeChatArticle {
  title: string
  url: string
  publishedAt: Date
  description?: string
}

/**
 * 从RSSHub获取微信公众号文章列表
 * @param accountRoute - RSSHub路由，如 '/wechat/mp/msgalbum/MzUyODc3NzI5NQ=='
 * @returns 文章列表
 */
export async function fetchWeChatArticles(accountRoute: string): Promise<WeChatArticle[]> {
  try {
    const rsshubUrl = process.env.RSSHUB_BASE_URL || 'https://rsshub.app'
    const feedUrl = `${rsshubUrl}${accountRoute}`

    console.log(`正在抓取RSS源: ${feedUrl}`)

    const feed = await parser.parseURL(feedUrl)

    const articles: WeChatArticle[] = feed.items.map(item => ({
      title: item.title || '无标题',
      url: item.link || '',
      publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      description: item.contentSnippet || item.content || ''
    }))

    console.log(`成功抓取 ${articles.length} 篇文章`)
    return articles

  } catch (error) {
    console.error('抓取RSS源失败:', error)
    throw new Error(`抓取RSS源失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 从微信文章URL提取内容（使用curl方法）
 * @param articleUrl - 微信文章URL
 * @returns 文章内容
 */
export async function fetchArticleContent(articleUrl: string): Promise<string> {
  try {
    const response = await axios.get(articleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      },
      timeout: 30000
    })

    return response.data

  } catch (error) {
    console.error('抓取文章内容失败:', error)
    throw new Error(`抓取文章内容失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 从HTML中提取js_content内容
 * @param html - HTML字符串
 * @returns 纯文本内容
 */
export function extractContentFromHtml(html: string): string {
  const cheerio = require('cheerio')
  const $ = cheerio.load(html)

  // 移除脚本和样式标签
  $('script, style').remove()

  // 提取js_content部分
  const content = $('#js_content').text().trim()

  return content || '无法提取文章内容'
}
