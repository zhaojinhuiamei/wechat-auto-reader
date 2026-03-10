import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { fetchWeChatArticles } from '@/utils/rss'
import { analyzeArticle } from '@/utils/claude'
import { createFeishuDoc, sendFeishuNotification } from '@/utils/feishu'

// Vercel Cron Job验证
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('CRON_SECRET未配置')
    return false
  }

  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  console.log('=== 定时任务开始 ===')

  // 验证请求来源
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 创建任务日志
  const { data: cronLog } = await supabaseAdmin
    .from('cron_logs')
    .insert({
      job_type: 'daily_check',
      status: 'started'
    })
    .select()
    .single()

  const logId = cronLog?.id

  try {
    let totalArticlesFound = 0
    let totalArticlesProcessed = 0

    // 1. 获取所有激活的公众号配置
    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from('wechat_accounts')
      .select(`
        id,
        user_id,
        account_name,
        rsshub_route,
        users (
          email
        ),
        feishu_configs!inner (
          webhook_url,
          is_active
        )
      `)
      .eq('is_active', true)
      .eq('feishu_configs.is_active', true)

    if (accountsError) {
      throw new Error(`获取公众号配置失败: ${accountsError.message}`)
    }

    console.log(`找到 ${accounts?.length || 0} 个激活的监控配置`)

    // 2. 遍历每个公众号
    for (const account of accounts || []) {
      try {
        console.log(`\n处理公众号: ${account.account_name}`)

        // 获取最新文章
        const articles = await fetchWeChatArticles(account.rsshub_route)
        totalArticlesFound += articles.length

        // 3. 筛选出未处理的文章
        for (const article of articles) {
          // 检查文章是否已存在
          const { data: existing } = await supabaseAdmin
            .from('articles')
            .select('id')
            .eq('url', article.url)
            .single()

          if (existing) {
            console.log(`文章已存在，跳过: ${article.title}`)
            continue
          }

          // 4. 创建文章记录
          const { data: articleRecord } = await supabaseAdmin
            .from('articles')
            .insert({
              user_id: account.user_id,
              wechat_account_id: account.id,
              title: article.title,
              url: article.url,
              published_at: article.publishedAt,
              status: 'processing'
            })
            .select()
            .single()

          if (!articleRecord) {
            console.error('创建文章记录失败')
            continue
          }

          try {
            // 5. 解读文章
            console.log(`开始解读文章: ${article.title}`)
            const analysis = await analyzeArticle(article.title, article.description || '')

            // 6. 生成飞书文档
            console.log('生成飞书文档...')
            const feishuResult = await createFeishuDoc(
              analysis.markdownContent,
              article.title
            )

            if (!feishuResult.success) {
              throw new Error(feishuResult.error || '生成飞书文档失败')
            }

            // 7. 更新文章记录
            await supabaseAdmin
              .from('articles')
              .update({
                status: 'completed',
                summary: analysis.summary,
                feishu_doc_url: feishuResult.docUrl,
                processed_at: new Date().toISOString()
              })
              .eq('id', articleRecord.id)

            // 8. 发送飞书通知
            const webhookUrl = (account.feishu_configs as any)?.[0]?.webhook_url
            if (webhookUrl) {
              await sendFeishuNotification(
                webhookUrl,
                article.title,
                `📰 公众号：${account.account_name}\n\n${analysis.summary.substring(0, 200)}...`,
                feishuResult.docUrl
              )
            }

            totalArticlesProcessed++
            console.log(`✅ 文章处理完成: ${article.title}`)

          } catch (error) {
            console.error(`处理文章失败: ${article.title}`, error)

            // 更新文章为失败状态
            await supabaseAdmin
              .from('articles')
              .update({
                status: 'failed',
                error_message: error instanceof Error ? error.message : '未知错误',
                processed_at: new Date().toISOString()
              })
              .eq('id', articleRecord.id)
          }
        }

      } catch (error) {
        console.error(`处理公众号失败: ${account.account_name}`, error)
      }
    }

    // 更新任务日志为完成
    if (logId) {
      await supabaseAdmin
        .from('cron_logs')
        .update({
          status: 'completed',
          articles_found: totalArticlesFound,
          articles_processed: totalArticlesProcessed,
          completed_at: new Date().toISOString()
        })
        .eq('id', logId)
    }

    console.log('=== 定时任务完成 ===')
    console.log(`发现文章: ${totalArticlesFound}`)
    console.log(`处理文章: ${totalArticlesProcessed}`)

    return NextResponse.json({
      success: true,
      articlesFound: totalArticlesFound,
      articlesProcessed: totalArticlesProcessed
    })

  } catch (error) {
    console.error('定时任务执行失败:', error)

    // 更新任务日志为失败
    if (logId) {
      await supabaseAdmin
        .from('cron_logs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : '未知错误',
          completed_at: new Date().toISOString()
        })
        .eq('id', logId)
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}
