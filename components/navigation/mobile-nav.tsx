'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, X, Home, FolderOpen, User, BarChart3, 
  FileText, Activity, Users, LogOut, ChevronRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Mission Control', icon: Home },
  { href: '/projects', label: 'Projects', icon: FolderOpen },
  { href: '/my-work', label: 'My Work', icon: User },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/activity', label: 'Activity', icon: Activity },
  { href: '/team', label: 'Team', icon: Users },
];

interface MobileNavProps {
  user?: {
    name: string;
    email: string;
  };
}

export function MobileNav({ user }: MobileNavProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-bg border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Link href="/" className="flex items-center gap-2">
            <img 
              src="/logo.svg" 
              alt="Gogentic AI" 
              className="h-8 w-8"
            />
            <span className="font-semibold text-fg">Gogentic</span>
          </Link>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-surface transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="w-6 h-6 text-fg" />
            ) : (
              <Menu className="w-6 h-6 text-fg" />
            )}
          </button>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out Menu */}
      <div className={cn(
        "lg:hidden fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-bg z-50",
        "transform transition-transform duration-300 ease-out",
        "shadow-2xl",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Menu Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-fg">Menu</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-surface transition-colors"
              >
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>
            
            {/* User Info */}
            {user && (
              <div className="p-3 bg-surface rounded-lg">
                <p className="font-medium text-fg">{user.name}</p>
                <p className="text-sm text-muted">{user.email}</p>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || 
                  (item.href !== '/' && pathname.startsWith(item.href));
                
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg transition-all",
                        isActive 
                          ? "bg-brand/10 text-brand font-medium" 
                          : "text-fg hover:bg-surface"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Menu Footer */}
          <div className="p-4 border-t border-border">
            <button
              onClick={() => {
                // Handle sign out
                console.log('Sign out');
              }}
              className="flex items-center gap-3 w-full p-3 text-fg hover:bg-surface rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}