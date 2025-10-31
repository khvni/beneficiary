import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { serviceSchema } from '@/lib/validation';

// GET /api/services - List services with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type') || '';
    const beneficiaryId = searchParams.get('beneficiaryId') || '';
    const caseId = searchParams.get('caseId') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (beneficiaryId) {
      where.beneficiaryId = beneficiaryId;
    }

    if (caseId) {
      where.caseId = caseId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Role-based filtering
    if (user.role === 'VOLUNTEER' || user.role === 'FIELD_WORKER') {
      where.providedById = user.id;
    }

    const total = await prisma.service.count({ where });

    const services = await prisma.service.findMany({
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
        case: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        providedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json({
      services,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching services:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

// POST /api/services - Create a new service
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['SUPER_ADMIN', 'ADMIN', 'STAFF', 'FIELD_WORKER']);

    const body = await request.json();

    // Validate input
    const validated = serviceSchema.parse(body);

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

    // Check if case exists (if provided)
    if (validated.caseId) {
      const caseData = await prisma.case.findUnique({
        where: { id: validated.caseId },
      });

      if (!caseData) {
        return NextResponse.json(
          { error: 'Case not found' },
          { status: 404 }
        );
      }
    }

    // Create service
    const service = await prisma.service.create({
      data: {
        ...validated,
        providedById: user.id,
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
        case: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        providedBy: {
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
        action: 'SERVICE_CREATED',
        details: {
          serviceId: service.id,
          beneficiaryId: validated.beneficiaryId,
          type: validated.type,
        },
        userId: user.id,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error: any) {
    console.error('Error creating service:', error);

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
      { error: 'Failed to create service' },
      { status: 500 }
    );
  }
}
