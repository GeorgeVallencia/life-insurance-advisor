// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  age: z.number().min(18).max(80).optional(),
  income: z.number().optional(),
  state: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
  smoker: z.boolean().optional(),
  password: z.string().min(6).optional(), // Optional for now
  source: z.string().optional(),
  utmSource: z.string().nullable().optional(),
  utmMedium: z.string().nullable().optional(),
  utmCampaign: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Transform null values to undefined for optional fields
    const cleanedBody = {
      ...body,
      utmSource: body.utmSource || undefined,
      utmMedium: body.utmMedium || undefined,
      utmCampaign: body.utmCampaign || undefined,
    };
    
    const { 
      email, firstName, lastName, phone, age, income, state, gender, smoker,
      password, source, utmSource, utmMedium, utmCampaign 
    } = registerSchema.parse(cleanedBody);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 12);
    }

    // Create user
    const user = await db.user.create({
      data: {
        email,
        firstName,
        lastName,
        phone,
        age,
        income,
        state,
        gender,
        smoker: smoker || false,
        source,
        utmSource: utmSource || undefined,
        utmMedium: utmMedium || undefined,
        utmCampaign: utmCampaign || undefined,
        lastActiveAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        age: true,
        income: true,
        state: true,
        gender: true,
        smoker: true,
        createdAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      user,
      message: 'User registered successfully'
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}