# Cloudflare Pages 部署

## 目标
将这个 DNS 多租户平台部署为一个 Cloudflare Pages 项目，前端和 API 放在同一个仓库里。

## 项目结构
- Frontend/Public: 静态页面与控制台
- Frontend/Public/_worker.js: Pages Functions 入口
- src/: API 逻辑与 D1 访问
- wrangler.toml: 本地开发参考配置

## 需要的 Cloudflare 资源
- Pages 项目
- D1 数据库
- CF_API_TOKEN 环境变量

## Pages 配置
- Build command: 留空
- Build output directory: Frontend/Public
- Framework preset: None
- Functions / bindings: 通过 Pages 后台添加 D1 绑定与环境变量

## 本地开发
1. 安装依赖。
2. 运行 wrangler pages dev Frontend/Public。
3. 访问本地预览地址测试控制台。

## 生产部署
1. 把仓库推到 GitHub。
2. 在 Cloudflare Pages 连接这个仓库。
3. 设置生产环境变量 CF_API_TOKEN。
4. 添加 D1 绑定名为 DB。
5. 部署后直接访问 Pages 域名。

## 权限建议
- CF_API_TOKEN 只授予目标 Zone 的 DNS 编辑权限。
- 生产环境不要使用全局 API Key。
- 保留词与配额建议在后续版本加上。

## 验证步骤
- 添加一个 root domain。
- 申请一个 subdomain。
- 创建一条 A 或 CNAME 记录。
- 确认 Cloudflare DNS 侧同步成功。


## Auth
- Add ADMIN_PASSWORD and AUTH_SECRET in Pages environment variables.
- Bind D1 database as DB and run the schema to create sessions table.
- Login returns a session id saved in a cookie named dns_session.

## Roles
- Current scaffold stores admin sessions in D1.
- Extend sessions.role to add user roles later.
- Logout endpoint: POST /api/auth/logout.

## Access Control
- Admin sessions are stored in D1.
- Use subdomain_access to grant non-admin users access to specific subdomains.
- Add a bind-access endpoint for manual grants.

## User Console
- The dashboard includes an admin tab and a user tab.
- Use the bind-access form to grant a user access to a subdomain.
- In the next step, enforce canAccessSubdomain in record endpoints.

## Audit Log
- Add the audit_logs table and bind D1.
- Admins can view audit logs in the dashboard.
- Record create/update/delete actions should call logAudit.
