export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            微信公众号自动解读系统
          </h1>
          <p className="text-xl text-gray-600">
            自动抓取、AI解读、飞书通知 - 全流程自动化
          </p>
        </div>

        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className="text-4xl mb-3">🤖</div>
              <h3 className="font-bold mb-2">全自动抓取</h3>
              <p className="text-sm text-gray-600">每天自动检查公众号更新</p>
            </div>

            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-4xl mb-3">🧠</div>
              <h3 className="font-bold mb-2">AI深度解读</h3>
              <p className="text-sm text-gray-600">Claude AI智能分析文章</p>
            </div>

            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <div className="text-4xl mb-3">📄</div>
              <h3 className="font-bold mb-2">飞书推送</h3>
              <p className="text-sm text-gray-600">自动生成文档并通知</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">快速开始</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>注册并登录系统</li>
                <li>添加要监控的公众号</li>
                <li>配置飞书Webhook</li>
                <li>等待每日自动更新</li>
              </ol>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <p className="text-sm">
                <strong>注意：</strong>本项目仍在开发中。当前展示为架构设计和核心功能实现。
              </p>
            </div>

            <div className="flex gap-4">
              <a
                href="/dashboard"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-center transition"
              >
                进入控制台
              </a>

              <a
                href="https://github.com/yourusername/wechat-auto-reader"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg text-center transition"
              >
                查看文档
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-gray-600">
          <p>完全开源 | 完全免费 | 易于部署</p>
          <p className="mt-2">Made with ❤️ by Claude Code</p>
        </div>
      </div>
    </main>
  )
}
