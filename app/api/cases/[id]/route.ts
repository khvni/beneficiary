import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { caseSchema } from '@/lib/validation';

// GET /api/cases/[id] - Get a single case
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const caseData = await prisma.case.findUnique({
      where: { id: params.id },
      include: {
        beneficiary: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            category: true,
            phone: true,
            email: true,
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
        },
      },
    });

    if (!caseData) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (user.role === 'VOLUNTEER' || user.role === 'FIELD_WORKER') {
      const isAssigned = caseData.assignedTo.some(assignee => assignee.id === user.id);
      if (caseData.createdById !== user.id && !isAssigned) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(caseData);
  } catch (error: any) {
    console.error('Error fetching case:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch case' },
      { status: 500 }
    );
  }
}

// PATCH /api/cases/[id] - Update a case
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(['SUPER_ADMIN', 'ADMIN', 'STAFF', 'FIELD_WORKER']);

    const body = await request.json();

    // Check if case exists
    const existing = await prisma.case.findUnique({
      where: { id: params.id },
      include: {
        assignedTo: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (user.role === 'FIELD_WORKER') {
      const isAssigned = existing.assignedTo.some(assignee => assignee.id === user.id);
      if (existing.createdById !== user.id && !isAssigned) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
    }

    // Validate input (partial)
    const validated = caseSchema.partial().parse(body);

    // If status is being changed to RESOLVED, set resolvedAt
    let additionalData: any = {};
    if (validated.status === 'RESOLVED' && existing.status !== 'RESOLVED') {
      additionalData.resolvedAt = new Date();
    }

    // Update case
    const updatedCase = await prisma.case.update({
      where: { id: params.id },
      data: {
        ...validated,
        ...additionalData,
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
        action: 'CASE_UPDATED',
        details: { caseId: updatedCase.id, changes: validated },
        userId: user.id,
      },
    });

    return NextResponse.json(updatedCase);
  } catch (error: any) {
    console.error('Error updating case:', error);

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
      { error: 'Failed to update case' },
      { status: 500 }
    );
  }
}

// DELETE /api/cases/[id] - Delete a case
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(['SUPER_ADMIN', 'ADMIN']);

    const caseData = await prisma.case.findUnique({
      where: { id: params.id },
    });

    if (!caseData) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    // Delete case
    await prisma.case.delete({
      where: { id: params.id },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'CASE_DELETED',
        details: { caseId: params.id },
        userId: user.id,
      },
    });

    return NextResponse.json({ message: 'Case deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting case:', error);

    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to delete case' },
      { status: 500 }
    );
  }
}
