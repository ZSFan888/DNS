# Cloudflare Pages 配置填写指南

## 1. 创建项目
- 进入 Cloudflare Dashboard -> Workers & Pages -> Create application -> Pages -> Connect to Git。
- 选择 GitHub 上的 `ZSFan888/DNS` 仓库。
- 生产分支选择 `main`。

## 2. 构建设置
- Framework preset: `None`。
- Build command: 留空。
- Build output directory: `Frontend/Public`。
- Root directory: 留空，除非你把仓库做成 monorepo。

## 3. 环境变量
在 Production 和 Preview 都建议设置：
- `ADMIN_PASSWORD`: 管理员登录密码。
- `AUTH_SECRET`: 会话签名/校验用密钥。
- `CF_API_TOKEN`: Cloudflare DNS API Token。

## 4. D1 绑定
- 进入 Pages 项目 -> Settings -> Functions -> D1 bindings。
- 新建绑定名 `DB`。
- 选择你创建好的 D1 数据库。

## 5. D1 建表
- 打开 D1 SQL 页面。
- 执行 `src/schema.sql` 里的建表语句。

## 6. 部署后验证
- 访问 Pages 域名。
- 用管理员密码登录。
- 添加 root domain。
- 申请 subdomain。
- 创建一条 DNS 记录。
- 切到审计日志确认写入成功。

## 7. 常见问题
- 如果页面空白，先确认 `Frontend/Public/index.html` 是否是入口页。
- 如果 API 返回 401，检查 cookie `dns_session` 和 `ADMIN_PASSWORD`。
- 如果 DNS 同步失败，检查 `CF_API_TOKEN` 权限是否有目标 Zone 的 DNS 编辑权限。
