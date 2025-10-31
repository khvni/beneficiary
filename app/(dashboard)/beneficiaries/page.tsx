import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';

async function getBeneficiaries({
  page = 1,
  search = '',
  category = '',
  status = '',
}: {
  page?: number;
  search?: string;
  category?: string;
  status?: string;
}) {
  const limit = 10;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (category) {
    where.category = category;
  }

  if (status) {
    where.status = status;
  }

  const [beneficiaries, total] = await Promise.all([
    prisma.beneficiary.findMany({
      where,
      skip,
      take: limit,
      include: {
        createdBy: {
          select: {
            name: true,
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
    }),
    prisma.beneficiary.count({ where }),
  ]);

  return {
    beneficiaries,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
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

interface BeneficiariesPageProps {
  searchParams: {
    page?: string;
    search?: string;
    category?: string;
    status?: string;
  };
}

export default async function BeneficiariesPage({
  searchParams,
}: BeneficiariesPageProps) {
  const page = parseInt(searchParams.page || '1');
  const search = searchParams.search || '';
  const category = searchParams.category || '';
  const status = searchParams.status || '';

  const { beneficiaries, pagination } = await getBeneficiaries({
    page,
    search,
    category,
    status,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Beneficiaries</h1>
          <p className="text-muted-foreground">
            Manage and view all beneficiaries in the system
          </p>
        </div>
        <Button asChild>
          <Link href="/beneficiaries/new">
            <Plus className="mr-2 h-4 w-4" />
            New Beneficiary
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Beneficiary List</CardTitle>
          <CardDescription>
            Total: {pagination.total} beneficiaries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                name="search"
                defaultValue={search}
                className="pl-8"
                onChange={(e) => {
                  const url = new URL(window.location.href);
                  if (e.target.value) {
                    url.searchParams.set('search', e.target.value);
                  } else {
                    url.searchParams.delete('search');
                  }
                  url.searchParams.set('page', '1');
                  window.location.href = url.toString();
                }}
              />
            </div>

            <Select
              defaultValue={category}
              onValueChange={(value) => {
                const url = new URL(window.location.href);
                if (value) {
                  url.searchParams.set('category', value);
                } else {
                  url.searchParams.delete('category');
                }
                url.searchParams.set('page', '1');
                window.location.href = url.toString();
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="HOMELESS">Homeless</SelectItem>
                <SelectItem value="ELDERLY">Elderly</SelectItem>
                <SelectItem value="DISABLED">Disabled</SelectItem>
                <SelectItem value="LOW_INCOME">Low Income</SelectItem>
                <SelectItem value="REFUGEE">Refugee</SelectItem>
                <SelectItem value="ORPHAN">Orphan</SelectItem>
                <SelectItem value="SICK">Sick</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select
              defaultValue={status}
              onValueChange={(value) => {
                const url = new URL(window.location.href);
                if (value) {
                  url.searchParams.set('status', value);
                } else {
                  url.searchParams.delete('status');
                }
                url.searchParams.set('page', '1');
                window.location.href = url.toString();
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
                <SelectItem value="DECEASED">Deceased</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                window.location.href = '/beneficiaries';
              }}
            >
              Clear Filters
            </Button>
          </div>

          {/* Table */}
          {beneficiaries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No beneficiaries found. Get started by creating your first beneficiary.
              </p>
              <Button asChild variant="outline">
                <Link href="/beneficiaries/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Beneficiary
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Cases</TableHead>
                      <TableHead>Services</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {beneficiaries.map((beneficiary) => (
                      <TableRow key={beneficiary.id}>
                        <TableCell>
                          <Link
                            href={`/beneficiaries/${beneficiary.id}`}
                            className="font-medium hover:underline"
                          >
                            {beneficiary.firstName} {beneficiary.lastName}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{beneficiary.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[beneficiary.status]}>
                            {beneficiary.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={priorityColors[beneficiary.priority]}>
                            {beneficiary.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {beneficiary.phone && <div>{beneficiary.phone}</div>}
                            {beneficiary.email && (
                              <div className="text-muted-foreground text-xs">
                                {beneficiary.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{beneficiary._count.cases}</TableCell>
                        <TableCell>{beneficiary._count.services}</TableCell>
                        <TableCell>
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/beneficiaries/${beneficiary.id}`}>
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1}
                      asChild={pagination.page > 1}
                    >
                      {pagination.page > 1 ? (
                        <Link
                          href={{
                            pathname: '/beneficiaries',
                            query: {
                              ...searchParams,
                              page: pagination.page - 1,
                            },
                          }}
                        >
                          Previous
                        </Link>
                      ) : (
                        <span>Previous</span>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === pagination.totalPages}
                      asChild={pagination.page < pagination.totalPages}
                    >
                      {pagination.page < pagination.totalPages ? (
                        <Link
                          href={{
                            pathname: '/beneficiaries',
                            query: {
                              ...searchParams,
                              page: pagination.page + 1,
                            },
                          }}
                        >
                          Next
                        </Link>
                      ) : (
                        <span>Next</span>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
