# 用户认证系统部署指南

## 项目概述
这是一个基于 Next.js 的用户登录注册模块，使用 Cloudflare D1 数据库存储用户数据。

## 技术栈
- **前端**: Next.js 16 + React 19 + TypeScript
- **UI**: shadcn/ui + Tailwind CSS 4
- **数据库**: Cloudflare D1 (SQLite)
- **认证**: bcryptjs 密码加密 + JWT token

## 部署步骤

### 1. 创建 Cloudflare D1 数据库

在 Cloudflare Dashboard 中：
1. 进入 Workers & Pages > D1 SQL Database
2. 点击 "Create database"
3. 数据库名称：`user_auth`
4. 记录生成的 Database ID

### 2. 执行数据库 Schema

在 Cloudflare Dashboard 的 D1 控制台或使用 wrangler CLI：

```bash
wrangler d1 execute user_auth --file=./src/lib/db/schema.sql
```

或在 Dashboard 的 Console 中手动执行 `src/lib/db/schema.sql` 中的 SQL 语句。

### 3. 配置 wrangler.toml

参考 `wrangler.example.toml` 创建 `wrangler.toml`：

```toml
name = "user-auth-app"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "user_auth"
database_id = "YOUR_ACTUAL_DATABASE_ID"

[vars]
JWT_SECRET = "your-secret-key-at-least-32-characters"
```

**重要**: 请将 `YOUR_ACTUAL_DATABASE_ID` 替换为实际的数据库 ID。

### 4. 配置环境变量

在 Cloudflare Dashboard > Settings > Environment Variables 中添加：

- `JWT_SECRET`: 用于生成 JWT token 的密钥（建议至少 32 字符）

或在 `.env` 文件中配置（本地开发）：

```env
JWT_SECRET=your_jwt_secret_here_at_least_32_characters
```

### 5. 部署到 Cloudflare Pages

使用 wrangler 部署：

```bash
# 构建
pnpm run build

# 部署
wrangler pages deploy
```

或在 Cloudflare Dashboard 直接连接 Git 仓库自动部署。

## API 接口说明

### 注册接口
- **URL**: `/api/auth/register`
- **方法**: POST
- **参数**: 
  - `username`: 用户名（必填）
  - `email`: 邮箱（必填）
  - `password`: 密码（必填，至少6位）
- **返回**: 
  - 成功：用户信息和 JWT token
  - 失败：错误信息

### 登录接口
- **URL**: `/api/auth/login`
- **方法**: POST
- **参数**: 
  - `email`: 邮箱（必填）
  - `password`: 密码（必填）
- **返回**: 
  - 成功：用户信息和 JWT token
  - 失败：错误信息

## 安全建议

1. **JWT_SECRET**: 使用强随机字符串，不要硬编码在配置文件中
2. **密码**: 用户密码使用 bcrypt 加密存储，盐值轮数为 10
3. **Token 有效期**: 默认 7 天，可根据需求调整
4. **数据验证**: 所有输入都经过验证和清理

## 故障排查

### 数据库连接失败
- 检查 wrangler.toml 中的 D1 绑定配置
- 确认 binding 名称为 "DB"
- 验证 database_id 是否正确

### Token 验证失败
- 检查 JWT_SECRET 环境变量是否配置
- 确保 token 未过期

## 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev
```

注意：本地开发环境无法连接 Cloudflare D1，需要部署到 Cloudflare Pages 才能使用数据库功能。

## 访问地址
部署后可通过 Cloudflare Pages 提供的域名访问，例如：`https://your-app.pages.dev`