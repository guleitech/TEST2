import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 密码加密
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// 密码验证
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// 生成 JWT token
export function generateToken(userId: number): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET 环境变量未配置');
  }
  
  return jwt.sign(
    { userId },
    secret,
    { expiresIn: '7d' } // token 有效期 7 天
  );
}

// 验证 JWT token
export function verifyToken(token: string): { userId: number } | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET 环境变量未配置');
  }
  
  try {
    const decoded = jwt.verify(token, secret) as { userId: number };
    return decoded;
  } catch {
    return null;
  }
}