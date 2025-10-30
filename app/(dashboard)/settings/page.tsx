import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and application preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Settings</CardTitle>
          <CardDescription>
            Update your profile and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Settings configuration will be implemented here
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
