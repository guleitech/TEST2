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
function getDB(): D1Database | undefined {
  // Cloudflare Pages 运行环境
  if (typeof globalThis !== 'undefined' && 'env' in globalThis) {
    const globalEnv = (globalThis as unknown as { env: { DB: D1Database } }).env;
    if (globalEnv?.DB) {
      return globalEnv.DB;
    }
  }
  // 本地开发环境
  return process.env.DB as unknown as D1Database | undefined;
}
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
