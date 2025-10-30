import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default async function ServicesPage() {
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

      <Card>
        <CardHeader>
          <CardTitle>Service History</CardTitle>
          <CardDescription>
            Complete record of all services provided
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No services logged yet. Service records will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
