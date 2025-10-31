import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { serviceSchema } from '@/lib/validation';

// GET /api/services/[id] - Get a single service
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const service = await prisma.service.findUnique({
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

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (user.role === 'VOLUNTEER' || user.role === 'FIELD_WORKER') {
      if (service.providedById !== user.id) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(service);
  } catch (error: any) {
    console.error('Error fetching service:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch service' },
      { status: 500 }
    );
  }
}

// PATCH /api/services/[id] - Update a service
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(['SUPER_ADMIN', 'ADMIN', 'STAFF', 'FIELD_WORKER']);

    const body = await request.json();

    // Check if service exists
    const existing = await prisma.service.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (user.role === 'FIELD_WORKER') {
      if (existing.providedById !== user.id) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
    }

    // Validate input (partial)
    const validated = serviceSchema.partial().parse(body);

    // Update service
    const service = await prisma.service.update({
      where: { id: params.id },
      data: validated,
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
        action: 'SERVICE_UPDATED',
        details: { serviceId: service.id, changes: validated },
        userId: user.id,
      },
    });

    return NextResponse.json(service);
  } catch (error: any) {
    console.error('Error updating service:', error);

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
      { error: 'Failed to update service' },
      { status: 500 }
    );
  }
}

// DELETE /api/services/[id] - Delete a service
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(['SUPER_ADMIN', 'ADMIN']);

    const service = await prisma.service.findUnique({
      where: { id: params.id },
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Delete service
    await prisma.service.delete({
      where: { id: params.id },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'SERVICE_DELETED',
        details: { serviceId: params.id },
        userId: user.id,
      },
    });

    return NextResponse.json({ message: 'Service deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting service:', error);

    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    );
  }
}
