import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, generateToken } from '@/lib/auth';
import { findUserByEmail } from '@/lib/db';

interface LoginRequest {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    // 验证必填字段
    if (!email || !password) {
      return NextResponse.json(
        { error: '请填写邮箱和密码' },
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

    // 查找用户
    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 401 }
      );
    }

    // 验证密码
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '密码错误' },
        { status: 401 }
      );
    }

    // 生成 JWT token
    const token = generateToken(user.id);

    // 返回成功响应
    return NextResponse.json(
      {
        success: true,
        message: '登录成功',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        token,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('登录错误:', error);
    
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