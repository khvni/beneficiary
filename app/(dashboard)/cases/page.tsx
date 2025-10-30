import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default async function CasesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cases</h1>
          <p className="text-muted-foreground">
            Manage and track all beneficiary cases
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
          <CardTitle>Case List</CardTitle>
          <CardDescription>
            All cases with status tracking and assignment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No cases found. Cases will appear here once created.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
