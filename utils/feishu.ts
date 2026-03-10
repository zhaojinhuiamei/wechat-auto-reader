import axios from 'axios'

export interface FeishuDocResult {
  docUrl: string
  success: boolean
  error?: string
}

/**
 * 获取飞书应用凭证
 */
async function getAppAccessToken(): Promise<string | null> {
  try {
    const appId = process.env.FEISHU_APP_ID
    const appSecret = process.env.FEISHU_APP_SECRET

    // 如果没有配置飞书应用，使用简化方案
    if (!appId || !appSecret) {
      console.log('未配置飞书应用，使用简化文档方案')
      return null
    }

    const response = await axios.post(
      'https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal',
      {
        app_id: appId,
        app_secret: appSecret
      }
    )

    return response.data.app_access_token

  } catch (error) {
    console.error('获取飞书凭证失败:', error)
    return null
  }
}

/**
 * 使用飞书开放平台API创建文档
 */
async function createFeishuDocViaAPI(
  markdownContent: string,
  title: string
): Promise<FeishuDocResult> {
  try {
    const token = await getAppAccessToken()

    if (!token) {
      throw new Error('无法获取飞书凭证')
    }

    // 1. 创建文档
    const createResponse = await axios.post(
      'https://open.feishu.cn/open-apis/docx/v1/documents',
      {
        title: title,
        folder_token: process.env.FEISHU_FOLDER_TOKEN || '' // 可选：指定文件夹
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const docId = createResponse.data.data.document.document_id
    const docUrl = createResponse.data.data.document.url

    // 2. 将Markdown内容转换为纯文本写入文档
    await writeContentToDoc(token, docId, markdownContent)

    return {
      docUrl,
      success: true
    }

  } catch (error) {
    console.error('创建飞书文档失败:', error)
    throw error
  }
}

/**
 * 将内容写入飞书文档
 */
async function writeContentToDoc(
  token: string,
  docId: string,
  content: string
): Promise<void> {
  try {
    // 将Markdown内容转换为飞书文档块
    const blocks = convertMarkdownToBlocks(content)

    // 批量写入块
    await axios.post(
      `https://open.feishu.cn/open-apis/docx/v1/documents/${docId}/blocks/batch_create`,
      {
        blocks: blocks
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('写入文档内容失败:', error)
    throw error
  }
}

/**
 * 将Markdown转换为飞书文档块格式（简化版）
 */
function convertMarkdownToBlocks(markdown: string): any[] {
  const lines = markdown.split('\n')
  const blocks: any[] = []

  for (const line of lines) {
    if (!line.trim()) continue

    // 检测标题
    if (line.startsWith('# ')) {
      blocks.push({
        block_type: 1, // 文本块
        text: {
          style: {
            bold: true,
            fontSize: 24
          },
          elements: [{ text_run: { content: line.replace('# ', '') } }]
        }
      })
    } else if (line.startsWith('## ')) {
      blocks.push({
        block_type: 1,
        text: {
          style: {
            bold: true,
            fontSize: 20
          },
          elements: [{ text_run: { content: line.replace('## ', '') } }]
        }
      })
    } else if (line.startsWith('### ')) {
      blocks.push({
        block_type: 1,
        text: {
          style: {
            bold: true,
            fontSize: 16
          },
          elements: [{ text_run: { content: line.replace('### ', '') } }]
        }
      })
    } else {
      // 普通文本
      blocks.push({
        block_type: 1,
        text: {
          elements: [{ text_run: { content: line } }]
        }
      })
    }
  }

  return blocks
}

/**
 * 简化方案：生成临时Markdown托管链接
 * 当没有配置飞书API时使用
 */
async function createSimpleMarkdownDoc(
  markdownContent: string,
  title: string
): Promise<FeishuDocResult> {
  try {
    // 方案：使用GitHub Gist或其他Markdown托管服务
    // 这里返回一个包含Markdown内容的base64编码链接
    const base64Content = Buffer.from(markdownContent).toString('base64')
    const docUrl = `data:text/markdown;base64,${base64Content}`

    console.log('⚠️ 使用简化文档方案（未配置飞书API）')
    console.log('📄 文档内容已生成，建议配置飞书API以获得更好体验')

    return {
      docUrl,
      success: true
    }

  } catch (error) {
    console.error('创建简化文档失败:', error)
    throw error
  }
}

/**
 * 主函数：创建飞书文档
 * 会根据配置自动选择方案
 */
export async function createFeishuDoc(
  markdownContent: string,
  title: string
): Promise<FeishuDocResult> {
  try {
    // 检查是否配置了飞书API
    if (process.env.FEISHU_APP_ID && process.env.FEISHU_APP_SECRET) {
      console.log('使用飞书开放平台API创建文档')
      return await createFeishuDocViaAPI(markdownContent, title)
    } else {
      console.log('使用简化方案创建文档')
      return await createSimpleMarkdownDoc(markdownContent, title)
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

/**
 * 通过飞书Webhook发送通知
 */
export async function sendFeishuNotification(
  webhookUrl: string,
  title: string,
  content: string,
  docUrl: string
): Promise<void> {
  try {
    const payload = {
      msg_type: 'interactive',
      card: {
        header: {
          title: {
            tag: 'plain_text',
            content: `📰 ${title}`
          },
          template: 'blue'
        },
        elements: [
          {
            tag: 'div',
            text: {
              tag: 'lark_md',
              content: content
            }
          },
          {
            tag: 'hr'
          },
          {
            tag: 'action',
            actions: [
              {
                tag: 'button',
                text: {
                  tag: 'plain_text',
                  content: '📖 查看解读文档'
                },
                type: 'primary',
                url: docUrl
              }
            ]
          },
          {
            tag: 'note',
            elements: [
              {
                tag: 'plain_text',
                content: `生成时间: ${new Date().toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'})}`
              }
            ]
          }
        ]
      }
    }

    await axios.post(webhookUrl, payload)
    console.log('✅ 飞书通知已发送')

  } catch (error) {
    console.error('❌ 发送飞书通知失败:', error)
    throw error
  }
}

/**
 * 测试飞书Webhook连接
 */
export async function testFeishuWebhook(webhookUrl: string): Promise<boolean> {
  try {
    await axios.post(webhookUrl, {
      msg_type: 'text',
      content: {
        text: '🎉 飞书Webhook测试成功！\n微信公众号自动解读系统已就绪。'
      }
    })
    return true
  } catch (error) {
    console.error('测试飞书Webhook失败:', error)
    return false
  }
}
