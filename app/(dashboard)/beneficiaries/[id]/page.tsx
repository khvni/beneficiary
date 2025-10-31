import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  AlertCircle,
  Edit,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

async function getBeneficiary(id: string) {
  const beneficiary = await prisma.beneficiary.findUnique({
    where: { id },
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
      _count: {
        select: {
          cases: true,
          services: true,
        },
      },
    },
  });

  return beneficiary;
}

const statusColors = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  ARCHIVED: 'bg-yellow-100 text-yellow-800',
  DECEASED: 'bg-red-100 text-red-800',
};

const priorityColors = {
  LOW: 'bg-blue-100 text-blue-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

const caseStatusColors = {
  OPEN: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
};

export default async function BeneficiaryDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const beneficiary = await getBeneficiary(params.id);

  if (!beneficiary) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {beneficiary.firstName} {beneficiary.lastName}
          </h1>
          <p className="text-muted-foreground">
            Beneficiary ID: {beneficiary.id}
          </p>
        </div>
        <Button asChild>
          <Link href={`/beneficiaries/${beneficiary.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      {/* Status and Priority */}
      <div className="flex gap-2">
        <Badge className={statusColors[beneficiary.status]}>
          {beneficiary.status}
        </Badge>
        <Badge className={priorityColors[beneficiary.priority]}>
          Priority: {beneficiary.priority}
        </Badge>
        <Badge variant="outline">
          {beneficiary.category}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {beneficiary.dateOfBirth && (
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Date of Birth</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(beneficiary.dateOfBirth), 'PPP')}
                  </p>
                </div>
              </div>
            )}
            {beneficiary.gender && (
              <div>
                <p className="text-sm font-medium">Gender</p>
                <p className="text-sm text-muted-foreground">{beneficiary.gender}</p>
              </div>
            )}
            {beneficiary.nationality && (
              <div>
                <p className="text-sm font-medium">Nationality</p>
                <p className="text-sm text-muted-foreground">{beneficiary.nationality}</p>
              </div>
            )}
            {beneficiary.idNumber && (
              <div>
                <p className="text-sm font-medium">ID Number</p>
                <p className="text-sm text-muted-foreground">{beneficiary.idNumber}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {beneficiary.phone && (
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{beneficiary.phone}</p>
                </div>
              </div>
            )}
            {beneficiary.email && (
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{beneficiary.email}</p>
                </div>
              </div>
            )}
            {(beneficiary.address || beneficiary.city || beneficiary.state) && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">
                    {beneficiary.address && <span>{beneficiary.address}<br /></span>}
                    {beneficiary.city && <span>{beneficiary.city}, </span>}
                    {beneficiary.state && <span>{beneficiary.state} </span>}
                    {beneficiary.postcode}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        {(beneficiary.emergencyName || beneficiary.emergencyPhone) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {beneficiary.emergencyName && (
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-sm text-muted-foreground">{beneficiary.emergencyName}</p>
                </div>
              )}
              {beneficiary.emergencyPhone && (
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{beneficiary.emergencyPhone}</p>
                </div>
              )}
              {beneficiary.emergencyRelation && (
                <div>
                  <p className="text-sm font-medium">Relationship</p>
                  <p className="text-sm text-muted-foreground">{beneficiary.emergencyRelation}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {beneficiary.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{beneficiary.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Cases */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cases ({beneficiary._count.cases})</CardTitle>
              <CardDescription>All cases associated with this beneficiary</CardDescription>
            </div>
            <Button asChild size="sm">
              <Link href={`/cases/new?beneficiaryId=${beneficiary.id}`}>
                New Case
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {beneficiary.cases.length === 0 ? (
            <p className="text-sm text-muted-foreground">No cases found.</p>
          ) : (
            <div className="space-y-4">
              {beneficiary.cases.map((caseItem) => (
                <div key={caseItem.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Link
                      href={`/cases/${caseItem.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {caseItem.title}
                    </Link>
                    <Badge className={caseStatusColors[caseItem.status]}>
                      {caseItem.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {caseItem.description.substring(0, 150)}
                    {caseItem.description.length > 150 && '...'}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Type: {caseItem.type}</span>
                    <span>Created: {format(new Date(caseItem.createdAt), 'PP')}</span>
                    <span>By: {caseItem.createdBy.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Services ({beneficiary._count.services})</CardTitle>
              <CardDescription>Last 10 services provided</CardDescription>
            </div>
            <Button asChild size="sm">
              <Link href={`/services/new?beneficiaryId=${beneficiary.id}`}>
                Log Service
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {beneficiary.services.length === 0 ? (
            <p className="text-sm text-muted-foreground">No services found.</p>
          ) : (
            <div className="space-y-3">
              {beneficiary.services.map((service) => (
                <div key={service.id} className="border-b last:border-0 pb-3 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{service.type}</p>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {service.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                        <span>{format(new Date(service.date), 'PP')}</span>
                        <span>By: {service.providedBy.name}</span>
                        {service.quantity && <span>Qty: {service.quantity}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
