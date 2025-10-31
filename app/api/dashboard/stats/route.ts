import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Get date ranges
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Build where clause based on role
    const beneficiaryWhere: any = {};
    const caseWhere: any = {};
    const serviceWhere: any = {};

    if (user.role === 'VOLUNTEER' || user.role === 'FIELD_WORKER') {
      beneficiaryWhere.OR = [
        { createdById: user.id },
        { assignedToId: user.id },
      ];

      caseWhere.OR = [
        { createdById: user.id },
        { assignedTo: { some: { id: user.id } } },
      ];

      serviceWhere.providedById = user.id;
    }

    // Get counts in parallel
    const [
      totalBeneficiaries,
      newBeneficiariesThisWeek,
      activeCases,
      servicesThisMonth,
      servicesLastMonth,
      beneficiariesByCategory,
      servicesByType,
      recentActivity,
    ] = await Promise.all([
      // Total beneficiaries
      prisma.beneficiary.count({
        where: {
          ...beneficiaryWhere,
          status: 'ACTIVE',
        },
      }),

      // New beneficiaries this week
      prisma.beneficiary.count({
        where: {
          ...beneficiaryWhere,
          createdAt: {
            gte: startOfWeek,
          },
        },
      }),

      // Active cases
      prisma.case.count({
        where: {
          ...caseWhere,
          status: {
            in: ['OPEN', 'IN_PROGRESS'],
          },
        },
      }),

      // Services this month
      prisma.service.count({
        where: {
          ...serviceWhere,
          date: {
            gte: startOfMonth,
          },
        },
      }),

      // Services last month
      prisma.service.count({
        where: {
          ...serviceWhere,
          date: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
      }),

      // Beneficiaries by category
      prisma.beneficiary.groupBy({
        by: ['category'],
        where: {
          ...beneficiaryWhere,
          status: 'ACTIVE',
        },
        _count: true,
      }),

      // Services by type (this month)
      prisma.service.groupBy({
        by: ['type'],
        where: {
          ...serviceWhere,
          date: {
            gte: startOfMonth,
          },
        },
        _count: true,
      }),

      // Recent activity (beneficiaries)
      prisma.beneficiary.findMany({
        where: beneficiaryWhere,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          category: true,
          createdAt: true,
          createdBy: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      }),
    ]);

    // Calculate growth rate
    const growthRate = servicesLastMonth > 0
      ? ((servicesThisMonth - servicesLastMonth) / servicesLastMonth) * 100
      : servicesThisMonth > 0 ? 100 : 0;

    return NextResponse.json({
      summary: {
        totalBeneficiaries,
        newBeneficiariesThisWeek,
        activeCases,
        servicesThisMonth,
        growthRate: Math.round(growthRate),
      },
      beneficiariesByCategory: beneficiariesByCategory.map((item: any) => ({
        category: item.category,
        count: item._count,
      })),
      servicesByType: servicesByType.map((item: any) => ({
        type: item.type,
        count: item._count,
      })),
      recentActivity,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
