import Parser from 'rss-parser'
import axios from 'axios'

const parser = new Parser()

// 多个RSSHub实例配置（按优先级排序）
// 注意：公共实例可能随时变更，建议自建实例或使用环境变量 RSSHUB_BASE_URL 配置
const RSSHUB_INSTANCES = [
  'https://rsshub.app',
  'https://rsshub.rssforever.com',
  'https://rsshub.ktachibana.party',
  'https://hub.slarker.me',
  'https://rsshub.pseudoyu.com'
]

// 单个实例的超时时间（毫秒）
const INSTANCE_TIMEOUT = 15000

export interface WeChatArticle {
  title: string
  url: string
  publishedAt: Date
  description?: string
}

/**
 * 从RSSHub获取微信公众号文章列表（支持多实例自动切换）
 * @param accountRoute - RSSHub路由，如 '/wechat/mp/msgalbum/MzUyODc3NzI5NQ=='
 * @returns 文章列表
 */
export async function fetchWeChatArticles(accountRoute: string): Promise<WeChatArticle[]> {
  // 确保route以/开头
  const normalizedRoute = accountRoute.startsWith('/') ? accountRoute : `/${accountRoute}`

  // 优先使用环境变量配置的实例，否则尝试所有预设实例
  const instances = process.env.RSSHUB_BASE_URL
    ? [process.env.RSSHUB_BASE_URL]
    : RSSHUB_INSTANCES

  let lastError: Error | null = null

  // 遍历所有实例，直到成功获取数据
  for (let i = 0; i < instances.length; i++) {
    const rsshubUrl = instances[i]
    const feedUrl = `${rsshubUrl}${normalizedRoute}`

    try {
      console.log(`[${i + 1}/${instances.length}] 尝试抓取RSS源: ${feedUrl}`)

      // 使用带超时的 Promise
      const feed = await Promise.race([
        parser.parseURL(feedUrl),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), INSTANCE_TIMEOUT)
        )
      ])

      const articles: WeChatArticle[] = feed.items.map(item => ({
        title: item.title || '无标题',
        url: item.link || '',
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        description: item.contentSnippet || item.content || ''
      }))

      console.log(`✅ 成功抓取 ${articles.length} 篇文章 (使用实例: ${rsshubUrl})`)
      return articles

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('未知错误')
      console.error(`❌ 实例 ${rsshubUrl} 失败:`, lastError.message)

      // 如果不是最后一个实例，继续尝试下一个
      if (i < instances.length - 1) {
        console.log(`⏭️ 切换到下一个实例...`)
        continue
      }
    }
  }

  // 所有实例都失败了
  throw new Error(`所有RSSHub实例都无法访问 (尝试了 ${instances.length} 个实例)。最后错误: ${lastError?.message}`)
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
