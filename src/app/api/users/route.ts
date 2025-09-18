// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for creating a user (flexible - only email required)
const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  age: z.number().min(18).max(80).optional(),
  income: z.number().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  currency: z.string().optional(),
  gender: z.enum(['male', 'female']).optional().transform(val => 
    val ? val.toUpperCase() as 'MALE' | 'FEMALE' : undefined
  ), // Accept lowercase, convert to uppercase for Prisma
  smoker: z.boolean().optional(),
  maritalStatus: z.string().optional(),
  dependents: z.number().min(0).optional(),
  mortgage: z.number().min(0).optional(),
  studentLoans: z.number().min(0).optional(),
  preferredContact: z.string().optional(),
  timezone: z.string().optional(),
  source: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Received registration data:', body);
    
    const data = createUserSchema.parse(body);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Auto-set currency based on country if not provided
    let currency = data.currency;
    if (data.country && !currency) {
      currency = getCurrencyForCountry(data.country);
    }

    const user = await db.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        age: data.age,
        income: data.income,
        state: data.state,
        country: data.country,
        currency: currency || '$',
        gender: data.gender,
        smoker: data.smoker ?? false,
        maritalStatus: data.maritalStatus,
        dependents: data.dependents,
        mortgage: data.mortgage,
        studentLoans: data.studentLoans,
        preferredContact: data.preferredContact,
        timezone: data.timezone,
        source: data.source || 'website',
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
        status: 'active',
        emailVerified: false,
        phoneVerified: false,
      },
    });

    console.log('User created successfully:', user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
      },
      message: 'User registered successfully'
    });

  } catch (error: any) {
    console.error('User creation error:', error);

    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return NextResponse.json(
        { 
          error: 'Invalid input data', 
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    // Handle Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    if (error.code === 'P1001') {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create user', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint for health check
export async function GET() {
  try {
    const userCount = await db.user.count();
    
    return NextResponse.json({
      status: 'healthy',
      userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message
    }, { status: 503 });
  }
}

// Helper function to determine currency from country
function getCurrencyForCountry(country: string): string {
  const currencyMap: { [key: string]: string } = {
    'kenya': 'KSh',
    'tanzania': 'Tsh',
    'uganda': 'Ush',
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


// // src/app/api/users/profile/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { db } from '@/lib/db';
// import { z } from 'zod';


// const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// const updateProfileSchema = z.object({
//   userId: z.string(),
//   firstName: z.string().optional(),
//   lastName: z.string().optional(),
//   phone: z.string().optional(),
//   age: z.number().min(18).max(80).optional(),
//   income: z.number().optional(),
//   state: z.string().optional(),
//   country: z.string().optional(), // NEW: Added country field
//   gender: z.enum(['male', 'female']).optional(),
//   smoker: z.boolean().optional(),
//   maritalStatus: z.string().optional(),
//   dependents: z.number().min(0).optional(),
//   mortgage: z.number().min(0).optional(),
//   studentLoans: z.number().min(0).optional(),
//   preferredContact: z.enum(['email', 'phone', 'text']).optional(),
//   timezone: z.string().optional(),
//   currency: z.string().optional(), // NEW: Added currency preference
// });


// const createUserSchema = z.object({
//   email: z.string().email(),
//   phone: z.string(),
//   firstName: z.string(),
//   lastName: z.string(),
// });

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const data = createUserSchema.parse(body);

//     const user = await db.user.create({
//       data: {
//         email: data.email,
//         phone: data.phone,
//         firstName: data.firstName,
//         lastName: data.lastName,
//       },
//     });

//     return NextResponse.json({
//       success: true,
//       user,
//     });
//   } catch (error) {
//     console.error('User creation error:', error);

//     if (error instanceof z.ZodError) {
//       return NextResponse.json(
//         { error: 'Invalid input', details: error.errors },
//         { status: 400 }
//       );
//     }

//     return NextResponse.json(
//       { error: 'Failed to create user' },
//       { status: 500 }
//     );
//   }
// }

// export async function PUT(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const { userId, ...profileData } = updateProfileSchema.parse(body);

//     // Check if user exists
//     const existingUser = await db.user.findUnique({
//       where: { id: userId },
//     });

//     if (!existingUser) {
//       return NextResponse.json(
//         { error: 'User not found' },
//         { status: 404 }
//       );
//     }

//     // Auto-set currency based on country if not provided
//     if (profileData.country && !profileData.currency) {
//       profileData.currency = getCurrencyForCountry(profileData.country);
//     }

//     // Update user profile
//     const updatedUser = await db.user.update({
//       where: { id: userId },
//       data: {
//         ...profileData,
//         updatedAt: new Date(),
//       },
//       select: {
//         id: true,
//         email: true,
//         firstName: true,
//         lastName: true,
//         phone: true,
//         age: true,
//         income: true,
//         state: true,
//         country: true, // NEW
//         currency: true, // NEW
//         gender: true,
//         smoker: true,
//         maritalStatus: true,
//         dependents: true,
//         mortgage: true,
//         studentLoans: true,
//         preferredContact: true,
//         timezone: true,
//         updatedAt: true,
//         createdAt: true,
//       }
//     });

//     return NextResponse.json({
//       success: true,
//       user: updatedUser,
//       message: 'Profile updated successfully'
//     });

//   } catch (error) {
//     console.error('Profile update error:', error);
    
//     if (error instanceof z.ZodError) {
//       return NextResponse.json(
//         { error: 'Invalid input', details: error.errors },
//         { status: 400 }
//       );
//     }
    
//     return NextResponse.json(
//       { error: 'Failed to update profile' },
//       { status: 500 }
//     );
//   }
// }

// export async function GET(req: NextRequest) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const userId = searchParams.get('userId');

//     if (!userId) {
//       return NextResponse.json(
//         { error: 'User ID is required' },
//         { status: 400 }
//       );
//     }

//     const user = await db.user.findUnique({
//       where: { id: userId },
//       select: {
//         id: true,
//         email: true,
//         firstName: true,
//         lastName: true,
//         phone: true,
//         age: true,
//         income: true,
//         state: true,
//         country: true, // NEW
//         currency: true, // NEW
//         gender: true,
//         smoker: true,
//         maritalStatus: true,
//         dependents: true,
//         mortgage: true,
//         studentLoans: true,
//         preferredContact: true,
//         timezone: true,
//         status: true,
//         emailVerified: true,
//         phoneVerified: true,
//         createdAt: true,
//         updatedAt: true,
//         lastActiveAt: true,
//       }
//     });

//     if (!user) {
//       return NextResponse.json(
//         { error: 'User not found' },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json({
//       success: true,
//       user
//     });

//   } catch (error) {
//     console.error('Profile fetch error:', error);
//     return NextResponse.json(
//       { error: 'Failed to fetch profile' },
//       { status: 500 }
//     );
//   }
// }

// // Helper function to determine currency from country
// function getCurrencyForCountry(country: string): string {
//   const currencyMap: { [key: string]: string } = {
//     'kenya': 'KSh',
//     'Tanzania': 'Tsh',
//     'Uganda': 'Ush',
//     'nigeria': '₦', 
//     'south africa': 'R',
//     'india': '₹',
//     'uk': '£',
//     'united kingdom': '£',
//     'germany': '€',
//     'france': '€',
//     'australia': 'A$',
//     'canada': 'C$',
//     'us': '$',
//     'usa': '$',
//     'united states': '$',
//     'brazil': 'R$',
//     'mexico': '$',
//     'philippines': '₱',
//   };
  
//   return currencyMap[country.toLowerCase()] || '$';
// }