// Cloudflare D1 数据库操作工具

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseResult {
  results: User[];
  success: boolean;
  meta?: {
    changes: number;
    last_row_id: number;
    rows_read: number;
    rows_written: number;
  };
}

// 获取 D1 数据库实例
function getDB(): D1Database {
  // 在 Cloudflare Workers/Pages 环境中，DB 绑定通过 env.DB 访问
  
  // 方式 1: 通过 getRequestContext（推荐方式，用于 Next.js on Cloudflare）
  try {
    // 动态导入 @cloudflare/next-on-pages 的 getRequestContext
    // 这是 Cloudflare Pages Functions 中访问环境变量的标准方式
    const { getRequestContext } = require('@cloudflare/next-on-pages');
    const ctx = getRequestContext();
    if (ctx?.env?.DB) {
      return ctx.env.DB;
    }
  } catch {
    // 如果不在 Cloudflare 环境中，继续尝试其他方式
  }
  
  // 方式 2: 通过全局 env 对象（Cloudflare Workers）
  if (typeof globalThis !== 'undefined' && 'env' in globalThis) {
    const globalEnv = (globalThis as unknown as { env: { DB: D1Database } }).env;
    if (globalEnv?.DB) {
      return globalEnv.DB;
    }
  }
  
  // 方式 3: 通过环境变量（用于本地开发测试）
  // 注意：这种方式仅用于测试，生产环境应该通过 Cloudflare 绑定
  if (process.env.DB) {
    return process.env.DB as unknown as D1Database;
  }
  
  // 如果数据库未配置，提供清晰的错误信息
  throw new Error(
    '数据库未配置：请确保已正确配置 Cloudflare D1 数据库。\n' +
    '配置步骤：\n' +
    '1. 在 Cloudflare Dashboard 创建 D1 数据库\n' +
    '2. 在 wrangler.toml 中添加 D1 绑定配置\n' +
    '3. 确保 binding 名称为 "DB"\n' +
    '4. 运行 schema.sql 创建数据表'
  );
}

// 通过邮箱查找用户
export async function findUserByEmail(email: string): Promise<User | null> {
  const db = getDB();
  const result = await db.prepare(
    'SELECT * FROM users WHERE email = ?'
  ).bind(email).first<User>();
  
  return result || null;
}

// 通过用户名查找用户
export async function findUserByUsername(username: string): Promise<User | null> {
  const db = getDB();
  const result = await db.prepare(
    'SELECT * FROM users WHERE username = ?'
  ).bind(username).first<User>();
  
  return result || null;
}

// 通过 ID 查找用户
export async function findUserById(id: number): Promise<User | null> {
  const db = getDB();
  const result = await db.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).bind(id).first<User>();
  
  return result || null;
}

// 创建新用户
export async function createUser(
  username: string,
  email: string,
  hashedPassword: string
): Promise<number> {
  const db = getDB();
  const result = await db.prepare(
    'INSERT INTO users (username, email, password) VALUES (?, ?, ?)'
  ).bind(username, email, hashedPassword).run();
  
  if (!result.success) {
    throw new Error('用户创建失败');
  }
  
  return result.meta.last_row_id;
}

// 更新用户信息
export async function updateUser(
  id: number,
  updates: Partial<Pick<User, 'username' | 'email' | 'password'>>
): Promise<boolean> {
  const db = getDB();
  const fields: string[] = [];
  const values: string[] = [];
  
  if (updates.username) {
    fields.push('username = ?');
    values.push(updates.username);
  }
  if (updates.email) {
    fields.push('email = ?');
    values.push(updates.email);
  }
  if (updates.password) {
    fields.push('password = ?');
    values.push(updates.password);
  }
  
  if (fields.length === 0) {
    return false;
  }
  
  fields.push('updated_at = datetime("now")');
  values.push(String(id));
  
  const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
  const result = await db.prepare(query).bind(...values).run();
  
  return result.success;
}