import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export interface ArticleAnalysis {
  summary: string
  keyPoints: string[]
  insights: string[]
  markdownContent: string
}

/**
 * 使用Claude解读文章内容
 * @param articleTitle - 文章标题
 * @param articleContent - 文章内容
 * @returns 解读结果
 */
export async function analyzeArticle(
  articleTitle: string,
  articleContent: string
): Promise<ArticleAnalysis> {
  try {
    const prompt = `请解读以下微信公众号文章，生成结构化的Markdown文档：

# 文章标题
${articleTitle}

# 文章内容
${articleContent}

请按以下格式输出Markdown文档：

# ${articleTitle}

## 📋 核心内容摘要
[用2-3段话总结文章的核心内容]

## 🔑 关键要点
- [要点1]
- [要点2]
- [要点3]
...

## 💡 深度解读
[对文章进行深度分析和解读]

## 🎯 关键洞察
- [洞察1]
- [洞察2]
...

## 📊 数据/图表分析（如有）
[如果文章包含重要数据或图表，进行分析]

---
**文档生成时间**: ${new Date().toLocaleString('zh-CN')}
**来源**: 微信公众号自动解读`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : ''

    // 解析响应
    const summary = extractSection(responseText, '核心内容摘要')
    const keyPoints = extractList(responseText, '关键要点')
    const insights = extractList(responseText, '关键洞察')

    return {
      summary,
      keyPoints,
      insights,
      markdownContent: responseText
    }

  } catch (error) {
    console.error('Claude解读失败:', error)
    throw new Error(`文章解读失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

// 辅助函数：从Markdown中提取特定section
function extractSection(markdown: string, sectionTitle: string): string {
  const regex = new RegExp(`##\\s*[📋🔍💡]?\\s*${sectionTitle}\\s*\\n([\\s\\S]*?)(?=\\n##|$)`, 'i')
  const match = markdown.match(regex)
  return match ? match[1].trim() : ''
}

// 辅助函数：从Markdown中提取列表项
function extractList(markdown: string, sectionTitle: string): string[] {
  const section = extractSection(markdown, sectionTitle)
  const items = section.match(/^[-*]\s+(.+)$/gm) || []
  return items.map(item => item.replace(/^[-*]\s+/, '').trim())
}
