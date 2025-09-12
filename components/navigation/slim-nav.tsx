'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FolderOpen, User, BarChart3, FileText, Activity, Users,
  Menu, X, LogOut, LayoutDashboard, Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CommandPalette } from '@/components/ui/command-palette';
import { useState } from 'react';
import { handleSignOut } from '@/app/actions/auth';
import WhoAmI from '@/app/_components/WhoAmI';

const navItems = [
  { href: '/', label: 'Mission Control', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderOpen },
  { href: '/my-work', label: 'My Work', icon: Briefcase },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/activity', label: 'Activity', icon: Activity },
  { href: '/team', label: 'Team', icon: Users },
];

interface SlimNavProps {
  projects?: Array<{ id: string; title: string; branch: string }>;
  users?: Array<{ id: string; name: string; email: string }>;
  currentUser?: { name: string; email: string };
}

export function SlimNav({ projects, users, currentUser }: SlimNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 bg-bg border-b border-border">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 sm:gap-3">
              <img 
                src="/Gogentic.ai.png" 
                alt="Gogentic AI" 
                className="h-10 sm:h-14 w-auto"
              />
              <span className="text-lg sm:text-xl font-semibold text-fg hidden sm:block">
                Gogentic Portal
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = item.href === '/' 
                ? pathname === '/'
                : pathname.startsWith(item.href);
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-brand/10 text-brand'
                      : 'text-muted hover:bg-surface hover:text-fg'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Command Palette */}
            <div className="hidden md:block">
              <CommandPalette projects={projects} users={users} />
            </div>

            {/* User Menu */}
            {currentUser && (
              <div className="hidden md:flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-fg">{currentUser.name}</p>
                  <p className="text-xs text-muted">{currentUser.email}</p>
                  <WhoAmI />
                </div>
                <button
                  onClick={() => handleSignOut()}
                  className="p-2 text-muted hover:text-fg transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-muted hover:text-fg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-bg">
          <div className="px-2 py-3 space-y-1">
            {navItems.map((item) => {
              const isActive = item.href === '/' 
                ? pathname === '/'
                : pathname.startsWith(item.href);
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-base font-medium transition-all duration-200',
                    isActive
                      ? 'bg-brand/10 text-brand'
                      : 'text-muted hover:bg-surface hover:text-fg'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
          {currentUser && (
            <div className="px-3 py-3 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-fg">{currentUser.name}</p>
                  <p className="text-xs text-muted">{currentUser.email}</p>
                </div>
                <button 
                  onClick={() => handleSignOut()}
                  className="p-2 text-muted hover:text-fg transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}