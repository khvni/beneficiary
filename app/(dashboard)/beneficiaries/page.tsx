import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default async function BeneficiariesPage() {
  // TODO: Fetch beneficiaries from database with pagination

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
            All registered beneficiaries with search and filter options
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
