// src/app/api/users/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';


const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

const updateProfileSchema = z.object({
  userId: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  age: z.number().min(18).max(80).optional(),
  income: z.number().optional(),
  state: z.string().optional(),
  country: z.string().optional(), // NEW: Added country field
  gender: z.enum(['male', 'female']).optional(),
  smoker: z.boolean().optional(),
  maritalStatus: z.string().optional(),
  dependents: z.number().min(0).optional(),
  mortgage: z.number().min(0).optional(),
  studentLoans: z.number().min(0).optional(),
  preferredContact: z.enum(['email', 'phone', 'text']).optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(), // NEW: Added currency preference
});


const createUserSchema = z.object({
  email: z.string().email(),
  phone: z.string(),
  firstName: z.string(),
  lastName: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createUserSchema.parse(body);

    const user = await db.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('User creation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, ...profileData } = updateProfileSchema.parse(body);

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Auto-set currency based on country if not provided
    if (profileData.country && !profileData.currency) {
      profileData.currency = getCurrencyForCountry(profileData.country);
    }

    // Update user profile
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        ...profileData,
        updatedAt: new Date(),
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
        country: true, // NEW
        currency: true, // NEW
        gender: true,
        smoker: true,
        maritalStatus: true,
        dependents: true,
        mortgage: true,
        studentLoans: true,
        preferredContact: true,
        timezone: true,
        updatedAt: true,
        createdAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        age: true,
        income: true,
        state: true,
        country: true, // NEW
        currency: true, // NEW
        gender: true,
        smoker: true,
        maritalStatus: true,
        dependents: true,
        mortgage: true,
        studentLoans: true,
        preferredContact: true,
        timezone: true,
        status: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
        updatedAt: true,
        lastActiveAt: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// Helper function to determine currency from country
function getCurrencyForCountry(country: string): string {
  const currencyMap: { [key: string]: string } = {
    'kenya': 'KSh',
    'Tanzania': 'Tsh',
    'Uganda': 'Ush',
    'nigeria': '₦', 
    'south africa': 'R',
    'india': '₹',
    'uk': '£',
    'united kingdom': '£',
    'germany': '€',
    'france': '€',
    'australia': 'A$',
    'canada': 'C$',
    'us': '$',
    'usa': '$',
    'united states': '$',
    'brazil': 'R$',
    'mexico': '$',
    'philippines': '₱',
  };
  
  return currencyMap[country.toLowerCase()] || '$';
}