import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { beneficiarySchema } from '@/lib/validation';
import { UserRole } from '@prisma/client';

// GET /api/beneficiaries - List beneficiaries with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Search by name, phone, or email
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { idNumber: { contains: search } },
      ];
    }

    // Filter by category
    if (category) {
      where.category = category;
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Role-based filtering
    if (user.role === 'VOLUNTEER' || user.role === 'FIELD_WORKER') {
      // Only see assigned beneficiaries
      where.OR = [
        { createdById: user.id },
        { assignedToId: user.id },
      ];
    }

    // Get total count
    const total = await prisma.beneficiary.count({ where });

    // Get beneficiaries with relations
    const beneficiaries = await prisma.beneficiary.findMany({
      where,
      skip,
      take: limit,
      include: {
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
            cases: true,
            services: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      beneficiaries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching beneficiaries:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch beneficiaries' },
      { status: 500 }
    );
  }
}

// POST /api/beneficiaries - Create a new beneficiary
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['SUPER_ADMIN', 'ADMIN', 'STAFF', 'FIELD_WORKER']);

    const body = await request.json();

    // Validate input
    const validated = beneficiarySchema.parse(body);

    // Check for duplicate ID number
    if (validated.idNumber) {
      const existing = await prisma.beneficiary.findUnique({
        where: { idNumber: validated.idNumber },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'A beneficiary with this ID number already exists' },
          { status: 400 }
        );
      }
    }

    // Create beneficiary
    const beneficiary = await prisma.beneficiary.create({
      data: {
        ...validated,
        createdById: user.id,
        assignedToId: validated.assignedToId || user.id,
      },
      include: {
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
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'BENEFICIARY_CREATED',
        details: { beneficiaryId: beneficiary.id },
        userId: user.id,
      },
    });

    return NextResponse.json(beneficiary, { status: 201 });
  } catch (error: any) {
    console.error('Error creating beneficiary:', error);

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
      { error: 'Failed to create beneficiary' },
      { status: 500 }
    );
  }
}
