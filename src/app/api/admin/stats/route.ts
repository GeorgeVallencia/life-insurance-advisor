// src/app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30'; // days
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    
    // Get total leads
    const totalLeads = await db.lead.count();
    
    // Get new leads in period
    const newLeads = await db.lead.count({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    });
    
    // Get converted leads
    const convertedLeads = await db.lead.count({
      where: {
        status: 'converted',
      },
    });
    
    // Calculate conversion rate
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(2) : 0;
    
    // Get total revenue (sum of premiums for converted leads)
    const revenueData = await db.lead.aggregate({
      where: {
        status: 'converted',
        premium: {
          not: null,
        },
      },
      _sum: {
        premium: true,
      },
    });
    
    const totalRevenue = revenueData._sum.premium || 0;
    
    // Get average deal size
    const avgDealSize = convertedLeads > 0 ? totalRevenue / convertedLeads : 0;
    
    // Get leads by status for chart
    const leadsByStatus = await db.lead.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
    });
    
    // Get leads by source
    const leadsBySource = await db.lead.groupBy({
      by: ['source'],
      _count: {
        _all: true,
      },
    });
    
    // Get daily lead creation for the past 30 days
    const dailyLeads = await db.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as count
      FROM leads 
      WHERE createdAt >= ${startDate}
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `;
    
    // Get top performers (leads with highest scores)
    const topLeads = await db.lead.findMany({
      where: {
        status: {
          not: 'lost',
        },
      },
      orderBy: {
        score: 'desc',
      },
      take: 10,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        score: true,
        status: true,
        quoteAmount: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      totalLeads,
      newLeads,
      convertedLeads,
      conversionRate: parseFloat(conversionRate),
      totalRevenue,
      avgDealSize: Math.round(avgDealSize),
      leadsByStatus,
      leadsBySource,
      dailyLeads,
      topLeads,
    });
    
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}