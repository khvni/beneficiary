import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { beneficiarySchema } from '@/lib/validation';

// GET /api/beneficiaries/[id] - Get a single beneficiary
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const beneficiary = await prisma.beneficiary.findUnique({
      where: { id: params.id },
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
        cases: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        services: {
          include: {
            providedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            date: 'desc',
          },
          take: 10,
        },
        documents: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!beneficiary) {
      return NextResponse.json(
        { error: 'Beneficiary not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (user.role === 'VOLUNTEER' || user.role === 'FIELD_WORKER') {
      if (beneficiary.createdById !== user.id && beneficiary.assignedToId !== user.id) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(beneficiary);
  } catch (error: any) {
    console.error('Error fetching beneficiary:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch beneficiary' },
      { status: 500 }
    );
  }
}

// PATCH /api/beneficiaries/[id] - Update a beneficiary
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(['SUPER_ADMIN', 'ADMIN', 'STAFF', 'FIELD_WORKER']);

    const body = await request.json();

    // Check if beneficiary exists
    const existing = await prisma.beneficiary.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Beneficiary not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (user.role === 'FIELD_WORKER') {
      if (existing.createdById !== user.id && existing.assignedToId !== user.id) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
    }

    // Validate input (partial)
    const validated = beneficiarySchema.partial().parse(body);

    // Check for duplicate ID number if changing
    if (validated.idNumber && validated.idNumber !== existing.idNumber) {
      const duplicate = await prisma.beneficiary.findUnique({
        where: { idNumber: validated.idNumber },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'A beneficiary with this ID number already exists' },
          { status: 400 }
        );
      }
    }

    // Update beneficiary
    const beneficiary = await prisma.beneficiary.update({
      where: { id: params.id },
      data: validated,
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
        action: 'BENEFICIARY_UPDATED',
        details: { beneficiaryId: beneficiary.id, changes: validated },
        userId: user.id,
      },
    });

    return NextResponse.json(beneficiary);
  } catch (error: any) {
    console.error('Error updating beneficiary:', error);

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
      { error: 'Failed to update beneficiary' },
      { status: 500 }
    );
  }
}

// DELETE /api/beneficiaries/[id] - Soft delete (archive) a beneficiary
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(['SUPER_ADMIN', 'ADMIN']);

    const beneficiary = await prisma.beneficiary.findUnique({
      where: { id: params.id },
    });

    if (!beneficiary) {
      return NextResponse.json(
        { error: 'Beneficiary not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting status to ARCHIVED
    const updated = await prisma.beneficiary.update({
      where: { id: params.id },
      data: {
        status: 'ARCHIVED',
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'BENEFICIARY_ARCHIVED',
        details: { beneficiaryId: updated.id },
        userId: user.id,
      },
    });

    return NextResponse.json({ message: 'Beneficiary archived successfully' });
  } catch (error: any) {
    console.error('Error deleting beneficiary:', error);

    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to delete beneficiary' },
      { status: 500 }
    );
  }
}
