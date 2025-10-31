import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { caseSchema } from '@/lib/validation';

// GET /api/cases - List cases with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const beneficiaryId = searchParams.get('beneficiaryId') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (beneficiaryId) {
      where.beneficiaryId = beneficiaryId;
    }

    // Role-based filtering
    if (user.role === 'VOLUNTEER' || user.role === 'FIELD_WORKER') {
      where.OR = [
        { createdById: user.id },
        { assignedTo: { some: { id: user.id } } },
      ];
    }

    const total = await prisma.case.count({ where });

    const cases = await prisma.case.findMany({
      where,
      skip,
      take: limit,
      include: {
        beneficiary: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            category: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            services: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      cases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching cases:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch cases' },
      { status: 500 }
    );
  }
}

// POST /api/cases - Create a new case
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['SUPER_ADMIN', 'ADMIN', 'STAFF', 'FIELD_WORKER']);

    const body = await request.json();

    // Validate input
    const validated = caseSchema.parse(body);

    // Check if beneficiary exists
    const beneficiary = await prisma.beneficiary.findUnique({
      where: { id: validated.beneficiaryId },
    });

    if (!beneficiary) {
      return NextResponse.json(
        { error: 'Beneficiary not found' },
        { status: 404 }
      );
    }

    // Create case
    const newCase = await prisma.case.create({
      data: {
        ...validated,
        createdById: user.id,
      },
      include: {
        beneficiary: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            category: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'CASE_CREATED',
        details: { caseId: newCase.id, beneficiaryId: validated.beneficiaryId },
        userId: user.id,
      },
    });

    return NextResponse.json(newCase, { status: 201 });
  } catch (error: any) {
    console.error('Error creating case:', error);

    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create case' },
      { status: 500 }
    );
  }
}
