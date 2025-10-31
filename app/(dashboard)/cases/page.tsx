import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

async function getCases() {
  const cases = await prisma.case.findMany({
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
          name: true,
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
    take: 50,
  });

  return cases;
}

const caseStatusColors = {
  OPEN: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
};

const priorityColors = {
  LOW: 'bg-blue-100 text-blue-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

export default async function CasesPage() {
  const cases = await getCases();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cases</h1>
          <p className="text-muted-foreground">
            Manage and track all cases in the system
          </p>
        </div>
        <Button asChild>
          <Link href="/cases/new">
            <Plus className="mr-2 h-4 w-4" />
            New Case
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Cases</CardTitle>
          <CardDescription>
            Total: {cases.length} cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cases.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No cases found. Create your first case.
              </p>
              <Button asChild variant="outline">
                <Link href="/cases/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Case
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {cases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  className="border rounded-lg p-4 hover:border-primary transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Link
                        href={`/cases/${caseItem.id}`}
                        className="text-lg font-medium hover:underline"
                      >
                        {caseItem.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={caseStatusColors[caseItem.status]}>
                          {caseItem.status}
                        </Badge>
                        <Badge className={priorityColors[caseItem.priority]}>
                          {caseItem.priority}
                        </Badge>
                        <Badge variant="outline">{caseItem.type}</Badge>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">
                    {caseItem.description.substring(0, 200)}
                    {caseItem.description.length > 200 && '...'}
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <Link
                        href={`/beneficiaries/${caseItem.beneficiary.id}`}
                        className="hover:underline"
                      >
                        {caseItem.beneficiary.firstName} {caseItem.beneficiary.lastName}
                      </Link>
                      <span>•</span>
                      <span>{caseItem._count.services} services</span>
                      <span>•</span>
                      <span>{format(new Date(caseItem.createdAt), 'PP')}</span>
                    </div>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/cases/${caseItem.id}`}>View</Link>
                    </Button>
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
