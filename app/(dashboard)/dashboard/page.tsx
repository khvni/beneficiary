import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, HeartHandshake, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

async function getDashboardStats() {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalBeneficiaries,
    newBeneficiariesThisWeek,
    activeCases,
    servicesThisMonth,
    servicesLastMonth,
    beneficiariesByCategory,
    recentActivity,
  ] = await Promise.all([
    prisma.beneficiary.count({ where: { status: 'ACTIVE' } }),
    prisma.beneficiary.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.case.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    prisma.service.count({ where: { date: { gte: startOfMonth } } }),
    prisma.service.count({
      where: {
        date: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
    }),
    prisma.beneficiary.groupBy({
      by: ['category'],
      where: { status: 'ACTIVE' },
      _count: true,
    }),
    prisma.beneficiary.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        category: true,
        createdAt: true,
        createdBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    }),
  ]);

  const growthRate =
    servicesLastMonth > 0
      ? ((servicesThisMonth - servicesLastMonth) / servicesLastMonth) * 100
      : servicesThisMonth > 0
      ? 100
      : 0;

  return {
    totalBeneficiaries,
    newBeneficiariesThisWeek,
    activeCases,
    servicesThisMonth,
    growthRate: Math.round(growthRate),
    beneficiariesByCategory,
    recentActivity,
  };
}

const categoryLabels: Record<string, string> = {
  HOMELESS: 'Homeless',
  ELDERLY: 'Elderly',
  DISABLED: 'Disabled',
  LOW_INCOME: 'Low Income',
  REFUGEE: 'Refugee',
  ORPHAN: 'Orphan',
  SICK: 'Sick',
  OTHER: 'Other',
};

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to MyFundAction Beneficiary Management System
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Beneficiaries
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBeneficiaries}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.newBeneficiariesThisWeek} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Cases
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCases}</div>
            <p className="text-xs text-muted-foreground">
              Pending resolution
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Services This Month
            </CardTitle>
            <HeartHandshake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.servicesThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Across all types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Growth Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.growthRate > 0 ? '+' : ''}
              {stats.growthRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              From last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Beneficiaries by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Beneficiaries by Category</CardTitle>
            <CardDescription>Active beneficiaries breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.beneficiariesByCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No beneficiaries yet</p>
            ) : (
              <div className="space-y-4">
                {stats.beneficiariesByCategory.map((item: any) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{categoryLabels[item.category]}</Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-medium">{item._count}</div>
                      <div className="w-32 bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${(item._count / stats.totalBeneficiaries) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest beneficiary registrations</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {stats.recentActivity.map((beneficiary) => (
                  <Link
                    key={beneficiary.id}
                    href={`/beneficiaries/${beneficiary.id}`}
                    className="flex items-start justify-between hover:bg-accent p-2 rounded-md transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {beneficiary.firstName} {beneficiary.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {categoryLabels[beneficiary.category]} • Created by{' '}
                        {beneficiary.createdBy.name}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(beneficiary.createdAt), 'PP')}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
