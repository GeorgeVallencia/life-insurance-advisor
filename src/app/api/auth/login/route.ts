// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().optional(), // Optional for backwards compatibility
  sessionId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, sessionId } = loginSchema.parse(body);

    // Find user
    const user = await db.user.findUnique({
      where: { email },
      include: {
        _count: {
          select: {
            conversations: true,
            quotes: true,
            leads: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please check your email or create a new account.' },
        { status: 404 }
      );
    }

    // For now, we'll skip password verification since your current flow doesn't use passwords
    // In a production app, you'd verify the password here:
    // if (password && user.password) {
    //   const isValidPassword = await bcrypt.compare(password, user.password);
    //   if (!isValidPassword) {
    //     return NextResponse.json(
    //       { error: 'Invalid password' },
    //       { status: 401 }
    //     );
    //   }
    // }

    // Update last active
    await db.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() }
    });

    // Link existing session to user if provided
    if (sessionId) {
      try {
        await db.conversation.updateMany({
          where: { sessionId, userId: null },
          data: { userId: user.id }
        });
      } catch (error) {
        console.error('Error linking session to user:', error);
        // Don't fail the login if session linking fails
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        profile: {
          age: user.age,
          income: user.income,
          state: user.state,
          gender: user.gender,
          smoker: user.smoker,
          maritalStatus: user.maritalStatus,
          dependents: user.dependents,
          mortgage: user.mortgage,
          studentLoans: user.studentLoans,
        },
        stats: user._count,
        createdAt: user.createdAt,
        lastActiveAt: user.lastActiveAt,
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}