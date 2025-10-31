import { BeneficiaryForm } from '@/components/beneficiary-form';

export default function NewBeneficiaryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Beneficiary</h1>
        <p className="text-muted-foreground">
          Add a new beneficiary to the system
        </p>
      </div>

      <BeneficiaryForm mode="create" />
    </div>
  );
}
