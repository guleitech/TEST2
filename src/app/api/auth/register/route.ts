import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, generateToken } from '@/lib/auth';
import { findUserByEmail, findUserByUsername, createUser } from '@/lib/db';

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json();
    const { username, email, password } = body;

    // 验证必填字段
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: '请填写所有必填字段' },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '邮箱格式不正确' },
        { status: 400 }
      );
    }

    // 验证密码长度
    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码长度至少6位' },
        { status: 400 }
      );
    }

    // 检查邮箱是否已注册
    const existingEmailUser = await findUserByEmail(email);
    if (existingEmailUser) {
      return NextResponse.json(
        { error: '该邮箱已被注册' },
        { status: 400 }
      );
    }

    // 检查用户名是否已存在
    const existingUsernameUser = await findUserByUsername(username);
    if (existingUsernameUser) {
      return NextResponse.json(
        { error: '该用户名已被使用' },
        { status: 400 }
      );
    }

    // 加密密码
    const hashedPassword = await hashPassword(password);

    // 创建新用户
    const userId = await createUser(username, email, hashedPassword);

    // 生成 JWT token
    const token = generateToken(userId);

    // 返回成功响应
    return NextResponse.json(
      {
        success: true,
        message: '注册成功',
        user: {
          id: userId,
          username,
          email,
        },
        token,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('注册错误:', error);
    
    // 判断是否为数据库配置错误
    if (error instanceof Error && error.message.includes('数据库未配置')) {
      return NextResponse.json(
        { error: '数据库配置错误，请联系管理员' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}