import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '微信公众号自动解读系统',
  description: '自动抓取微信公众号文章，AI解读，生成飞书文档',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
