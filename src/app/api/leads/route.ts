// src/app/api/leads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// Validation schemas
const createLeadSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(10),
  sessionId: z.string(),
  userProfile: z.object({
    age: z.number().optional(),
    income: z.number().optional(),
    dependents: z.number().optional(),
    coverageAmount: z.number().optional(),
    mortgage: z.number().optional(),
    studentLoans: z.number().optional(),
    maritalStatus: z.string().optional(),
    gender: z.enum(['MALE', 'FEMALE']).optional(),
    smoker: z.boolean().optional(),
    state: z.string().optional(),
    concerns: z.array(z.string()).optional(),
  }).optional(),
  quotes: z.array(z.object({
    carrier: z.string(),
    monthlyPremium: z.number(),
    annualPremium: z.number(),
    coverageAmount: z.number(),
    term: z.number(),
    productName: z.string(),
    quoteId: z.string(),
  })).optional(),
});

const updateLeadSchema = z.object({
  id: z.number(),
  status: z.enum(['NEW', 'CONTACTED', 'CONVERTED', 'LOST']).optional(),
  notes: z.string().optional(),
  assignedTo: z.string().optional(),
  followUpDate: z.string().optional(), // ISO date string
});

// POST - Create new lead
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = createLeadSchema.parse(body);

    // Check for duplicate email
    const existingLead = await db.lead.findUnique({
      where: { email: validatedData.email }
    });

    if (existingLead) {
      return NextResponse.json(
        { error: 'Lead with this email already exists' },
        { status: 409 }
      );
    }

    // Create lead with transaction to include quotes and activities
    const lead = await db.$transaction(async (tx) => {
      // Create the lead
      const newLead = await tx.lead.create({
        data: {
          sessionId: validatedData.sessionId,
          email: validatedData.email,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          phone: validatedData.phone,
          age: validatedData.userProfile?.age,
          income: validatedData.userProfile?.income,
          dependents: validatedData.userProfile?.dependents,
          coverageAmount: validatedData.userProfile?.coverageAmount,
          mortgage: validatedData.userProfile?.mortgage,
          studentLoans: validatedData.userProfile?.studentLoans,
          maritalStatus: validatedData.userProfile?.maritalStatus,
          gender: validatedData.userProfile?.gender,
          smoker: validatedData.userProfile?.smoker,
          state: validatedData.userProfile?.state,
          concerns: validatedData.userProfile?.concerns,
          source: 'website',
          status: 'NEW'
        }
      });

      // Create initial activity log
      await tx.leadActivity.create({
        data: {
          leadId: newLead.id,
          activityType: 'created',
          description: 'Lead created from website chat',
          performedBy: 'system'
        }
      });

      // Create quotes if provided
      if (validatedData.quotes && validatedData.quotes.length > 0) {
        await tx.leadQuote.createMany({
          data: validatedData.quotes.map(quote => ({
            leadId: newLead.id,
            carrier: quote.carrier,
            monthlyPremium: quote.monthlyPremium,
            annualPremium: quote.annualPremium,
            coverageAmount: quote.coverageAmount,
            term: quote.term,
            productName: quote.productName,
            quoteId: quote.quoteId,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          }))
        });

        await tx.leadActivity.create({
          data: {
            leadId: newLead.id,
            activityType: 'quotes_generated',
            description: `Generated ${validatedData.quotes.length} insurance quotes`,
            performedBy: 'system',
            metadata: { quoteCount: validatedData.quotes.length }
          }
        });
      }

      return newLead;
    });

    console.log('New lead created:', {
      id: lead.id,
      email: lead.email,
      sessionId: lead.sessionId,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      lead,
      message: 'Lead created successfully'
    });

  } catch (error) {
    console.error('Lead creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data provided', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}

// GET - Fetch leads with filtering and pagination
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const assignedTo = searchParams.get('assignedTo');

    // Build where clause
    const where: Prisma.LeadWhereInput = {
      deletedAt: null // Only show non-deleted leads
    };

    if (status && status !== 'all') {
      where.status = status as any;
    }

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } }
      ];
    }

    const skip = (page - 1) * limit;

    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          quotes: {
            orderBy: { monthlyPremium: 'asc' },
            take: 3 // Get top 3 best quotes
          },
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 1 // Get latest activity
          },
          _count: {
            select: {
              quotes: true,
              activities: true
            }
          }
        }
      }),
      db.lead.count({ where })
    ]);

    // Calculate metrics
    const metrics = await db.lead.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { status: true }
    });

    const statusCounts = metrics.reduce((acc, item) => {
      acc[item.status.toLowerCase()] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    const totalLeads = metrics.reduce((sum, item) => sum + item._count.status, 0);
    const convertedLeads = statusCounts.converted || 0;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads * 100) : 0;

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      metrics: {
        totalLeads,
        convertedLeads,
        conversionRate: Math.round(conversionRate * 10) / 10,
        newLeads: statusCounts.new || 0,
        contactedLeads: statusCounts.contacted || 0,
        lostLeads: statusCounts.lost || 0
      }
    });

  } catch (error) {
    console.error('Lead fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

// PUT - Update lead
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = updateLeadSchema.parse(body);

    const existingLead = await db.lead.findUnique({
      where: { id: validatedData.id }
    });

    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Update lead with transaction for activity logging
    const updatedLead = await db.$transaction(async (tx) => {
      const updateData: Prisma.LeadUpdateInput = {};
      const activities: Array<{
        leadId: number;
        activityType: string;
        description: string;
        performedBy: string;
      }> = [];

      // Handle status change
      if (validatedData.status && validatedData.status !== existingLead.status) {
        updateData.status = validatedData.status;
        
        if (validatedData.status === 'CONVERTED') {
          updateData.conversionDate = new Date();
        }

        activities.push({
          leadId: validatedData.id,
          activityType: 'status_change',
          description: `Status changed from ${existingLead.status} to ${validatedData.status}`,
          performedBy: 'agent' // You can get this from auth context
        });
      }

      // Handle other updates
      if (validatedData.notes !== undefined) {
        updateData.notes = validatedData.notes;
        
        if (validatedData.notes && validatedData.notes.trim()) {
          activities.push({
            leadId: validatedData.id,
            activityType: 'note',
            description: validatedData.notes,
            performedBy: 'agent'
          });
        }
      }

      if (validatedData.assignedTo !== undefined) {
        updateData.assignedTo = validatedData.assignedTo;
        
        activities.push({
          leadId: validatedData.id,
          activityType: 'assignment',
          description: `Lead assigned to ${validatedData.assignedTo}`,
          performedBy: 'system'
        });
      }

      if (validatedData.followUpDate) {
        updateData.followUpDate = new Date(validatedData.followUpDate);
        
        activities.push({
          leadId: validatedData.id,
          activityType: 'follow_up_scheduled',
          description: `Follow-up scheduled for ${new Date(validatedData.followUpDate).toLocaleDateString()}`,
          performedBy: 'agent'
        });
      }

      // Update lead
      const lead = await tx.lead.update({
        where: { id: validatedData.id },
        data: updateData,
        include: {
          quotes: true,
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      });

      // Create activity logs
      if (activities.length > 0) {
        await tx.leadActivity.createMany({
          data: activities
        });
      }

      return lead;
    });

    console.log('Lead updated:', {
      leadId: validatedData.id,
      email: existingLead.email,
      changes: Object.keys(validatedData).filter(key => key !== 'id'),
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      lead: updatedLead,
      message: 'Lead updated successfully'
    });

  } catch (error) {
    console.error('Lead update error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data provided', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete lead
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get('id') || '0');

    if (!id) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    const existingLead = await db.lead.findUnique({
      where: { id }
    });

    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Soft delete with activity log
    await db.$transaction(async (tx) => {
      await tx.lead.update({
        where: { id },
        data: { deletedAt: new Date() }
      });

      await tx.leadActivity.create({
        data: {
          leadId: id,
          activityType: 'deleted',
          description: 'Lead soft deleted',
          performedBy: 'admin'
        }
      });
    });

    console.log('Lead soft deleted:', {
      leadId: id,
      email: existingLead.email,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true,
      message: 'Lead deleted successfully'
    });

  } catch (error) {
    console.error('Lead deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    );
  }
}