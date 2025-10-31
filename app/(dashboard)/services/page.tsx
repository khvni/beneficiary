import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

async function getServices() {
  const services = await prisma.service.findMany({
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
        },
      },
      providedBy: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      date: 'desc',
    },
    take: 100,
  });

  return services;
}

const serviceTypeLabels: Record<string, string> = {
  FOOD_DISTRIBUTION: 'Food Distribution',
  SHELTER_ADMISSION: 'Shelter Admission',
  SHELTER_EXIT: 'Shelter Exit',
  MEDICAL_CHECKUP: 'Medical Checkup',
  COUNSELING: 'Counseling',
  EDUCATION: 'Education',
  FINANCIAL_AID: 'Financial Aid',
  RESCUE: 'Rescue',
  OTHER: 'Other',
};

export default async function ServicesPage() {
  const services = await getServices();

  // Group services by month
  const servicesByMonth = services.reduce((acc, service) => {
    const monthKey = format(new Date(service.date), 'MMMM yyyy');
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(service);
    return acc;
  }, {} as Record<string, typeof services>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground">
            Track all services provided to beneficiaries
          </p>
        </div>
        <Button asChild>
          <Link href="/services/new">
            <Plus className="mr-2 h-4 w-4" />
            Log Service
          </Link>
        </Button>
      </div>

      {services.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No services logged yet. Start logging services.
              </p>
              <Button asChild variant="outline">
                <Link href="/services/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Log Service
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        Object.entries(servicesByMonth).map(([month, monthServices]) => (
          <Card key={month}>
            <CardHeader>
              <CardTitle>{month}</CardTitle>
              <CardDescription>
                {monthServices.length} services provided
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {monthServices.map((service) => (
                  <div
                    key={service.id}
                    className="border-b last:border-0 pb-3 last:pb-0"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">
                            {serviceTypeLabels[service.type]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(service.date), 'PPP')}
                          </span>
                        </div>

                        {service.description && (
                          <p className="text-sm mt-1">{service.description}</p>
                        )}

                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <Link
                            href={`/beneficiaries/${service.beneficiary.id}`}
                            className="hover:underline"
                          >
                            {service.beneficiary.firstName} {service.beneficiary.lastName}
                          </Link>
                          <span>•</span>
                          <span>By: {service.providedBy.name}</span>
                          {service.quantity && (
                            <>
                              <span>•</span>
                              <span>Qty: {service.quantity}</span>
                            </>
                          )}
                          {service.location && (
                            <>
                              <span>•</span>
                              <span>{service.location}</span>
                            </>
                          )}
                        </div>

                        {service.case && (
                          <div className="mt-1">
                            <Link
                              href={`/cases/${service.case.id}`}
                              className="text-xs text-primary hover:underline"
                            >
                              Related to: {service.case.title}
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
