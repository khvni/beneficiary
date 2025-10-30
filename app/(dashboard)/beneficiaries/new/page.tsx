import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewBeneficiaryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Beneficiary</h1>
        <p className="text-muted-foreground">
          Register a new beneficiary in the system
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Beneficiary Information</CardTitle>
          <CardDescription>
            Fill in the details below to register a new beneficiary
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Beneficiary form will be implemented here
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
