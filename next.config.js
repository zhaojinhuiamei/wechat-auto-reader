/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  // 配置Vercel Cron Jobs
  cron: [
    {
      path: '/api/cron/daily-check',
      schedule: '0 0 * * *' // 每天UTC 0:00（北京时间8:00）
    }
  ]
}

module.exports = nextConfig
