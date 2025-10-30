'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, FileText, HeartHandshake, Settings, LayoutDashboard, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Beneficiaries', href: '/beneficiaries', icon: Users },
  { name: 'Cases', href: '/cases', icon: FileText },
  { name: 'Services', href: '/services', icon: HeartHandshake },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col h-full">
      <div className="flex items-center h-16 px-4 border-b">
        <h1 className="text-xl font-bold text-primary">MyFundAction</h1>
      </div>

      <div className="flex-1 py-4">
        <ul className="space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="p-4 border-t">
        <form action="/api/auth/signout" method="POST">
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start"
          >
            <LogOut className="mr-2 h-5 w-5" />
            Logout
          </Button>
        </form>
      </div>
    </nav>
  );
}
