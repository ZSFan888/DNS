# DNS

一个用于二级域名分发和真实 DNS 记录管理的 Cloudflare Pages 平台。

## 功能
- 管理根域名池。
- 申请二级域名。
- 自助管理 A / AAAA / CNAME / TXT / MX / SRV 记录。
- 同步 Cloudflare DNS。
- 记录审计日志。

## 部署
请查看 [DEPLOY.md](./DEPLOY.md)。


## Runtime notes
- D1 is bound as DB in Pages.
- Pages Functions should receive the session cookie dns_session.
- CF_API_TOKEN must only have DNS edit access for the selected zones.

## Pages setup
See [PAGES-SETUP.md](./PAGES-SETUP.md).
