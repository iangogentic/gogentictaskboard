'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { 
  Search, Plus, Filter, User, FolderOpen, BarChart3, 
  Activity, Users, ArrowRight, Hash, Tag 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandPaletteProps {
  projects?: Array<{ id: string; title: string; branch: string }>;
  users?: Array<{ id: string; name: string; email: string }>;
}

export function CommandPalette({ projects = [], users = [] }: CommandPaletteProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted bg-bg border border-border rounded-lg hover:bg-surface transition-colors"
      >
        <Search className="w-4 h-4" />
        <span>Search...</span>
        <kbd className="ml-auto px-2 py-0.5 text-xs bg-surface rounded">⌘K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-bg rounded-2xl shadow-2xl overflow-hidden">
            <Command className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted">
              <div className="flex items-center gap-3 px-4 border-b">
                <Search className="w-5 h-5 text-muted" />
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Type a command or search..."
                  className="flex-1 py-4 text-base outline-none placeholder:text-muted"
                />
              </div>
              <Command.List className="max-h-96 overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-muted">
                  No results found.
                </Command.Empty>

                {/* Pages */}
                <Command.Group heading="Pages">
                  <Command.Item
                    onSelect={() => runCommand(() => router.push('/projects'))}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-surface"
                  >
                    <FolderOpen className="w-4 h-4 text-muted" />
                    <span>Projects</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => router.push('/my-work'))}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-surface"
                  >
                    <User className="w-4 h-4 text-muted" />
                    <span>My Work</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => router.push('/dashboard'))}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-surface"
                  >
                    <BarChart3 className="w-4 h-4 text-muted" />
                    <span>Dashboard</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => router.push('/reports'))}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-surface"
                  >
                    <Activity className="w-4 h-4 text-muted" />
                    <span>Reports</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => router.push('/team'))}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-surface"
                  >
                    <Users className="w-4 h-4 text-muted" />
                    <span>Team</span>
                  </Command.Item>
                </Command.Group>

                {/* Projects */}
                {projects.length > 0 && (
                  <Command.Group heading="Projects">
                    {projects.slice(0, 5).map((project) => (
                      <Command.Item
                        key={project.id}
                        value={`project-${project.title}`}
                        onSelect={() => runCommand(() => router.push(`/projects/${project.id}`))}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-surface"
                      >
                        <Hash className="w-4 h-4 text-muted" />
                        <span className="flex-1">{project.title}</span>
                        <span className="text-xs text-muted bg-surface px-2 py-0.5 rounded">
                          {project.branch}
                        </span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {/* Actions */}
                <Command.Group heading="Actions">
                  <Command.Item
                    onSelect={() => runCommand(() => router.push('/projects/new'))}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-surface"
                  >
                    <Plus className="w-4 h-4 text-muted" />
                    <span>New Project</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => {
                      const params = new URLSearchParams({ status: 'BLOCKED' });
                      router.push(`/projects?${params}`);
                    })}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-surface"
                  >
                    <Filter className="w-4 h-4 text-muted" />
                    <span>Filter: Blocked</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => {
                      const params = new URLSearchParams({ branch: 'SOLUTIONS' });
                      router.push(`/projects?${params}`);
                    })}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-surface"
                  >
                    <Filter className="w-4 h-4 text-muted" />
                    <span>Filter: Branch = Solutions</span>
                  </Command.Item>
                </Command.Group>

                {/* Users */}
                {users.length > 0 && search.length > 0 && (
                  <Command.Group heading="Assign to">
                    {users.filter(u => 
                      u.name.toLowerCase().includes(search.toLowerCase())
                    ).slice(0, 3).map((user) => (
                      <Command.Item
                        key={user.id}
                        value={`user-${user.name}`}
                        onSelect={() => runCommand(() => {
                          console.log('Assign to', user.name);
                        })}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-surface"
                      >
                        <User className="w-4 h-4 text-muted" />
                        <span className="flex-1">{user.name}</span>
                        <span className="text-xs text-muted">{user.email}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}
              </Command.List>
            </Command>
          </div>
        </div>
      )}
    </>
  );
}