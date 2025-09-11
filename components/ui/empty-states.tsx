import { 
  FolderOpen, CheckSquare, FileText, Users, 
  Plus, Upload, Search, Inbox 
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  type: 'projects' | 'tasks' | 'reports' | 'team' | 'search' | 'general';
  title?: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

const emptyStateConfigs = {
  projects: {
    icon: FolderOpen,
    title: 'No projects yet',
    description: 'Create your first project to get started tracking work.',
    actionLabel: 'Create project' as string | undefined,
    actionHref: '/projects/new' as string | undefined,
  },
  tasks: {
    icon: CheckSquare,
    title: 'No tasks assigned',
    description: 'Tasks will appear here when assigned to you or when you create them.',
    actionLabel: 'Add task' as string | undefined,
    actionHref: undefined as string | undefined,
  },
  reports: {
    icon: FileText,
    title: 'No reports available',
    description: 'Reports will be generated once you have project activity.',
    actionLabel: undefined as string | undefined,
    actionHref: undefined as string | undefined,
  },
  team: {
    icon: Users,
    title: 'No team members',
    description: 'Invite team members to collaborate on projects.',
    actionLabel: 'Invite team' as string | undefined,
    actionHref: undefined as string | undefined,
  },
  search: {
    icon: Search,
    title: 'No results found',
    description: 'Try adjusting your search or filters to find what you\'re looking for.',
    actionLabel: undefined as string | undefined,
    actionHref: undefined as string | undefined,
  },
  general: {
    icon: Inbox,
    title: 'Nothing here yet',
    description: 'This area will populate as you add content.',
    actionLabel: undefined as string | undefined,
    actionHref: undefined as string | undefined,
  },
};

export function EmptyState({ 
  type, 
  title: customTitle, 
  description: customDescription,
  action: customAction,
  className 
}: EmptyStateProps) {
  const config = emptyStateConfigs[type];
  const Icon = config.icon;
  const title = customTitle || config.title;
  const description = customDescription || config.description;
  const action = customAction || (config.actionLabel ? {
    label: config.actionLabel,
    href: config.actionHref,
  } : undefined);

  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-6 text-center',
      className
    )}>
      <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted" />
      </div>
      <h3 className="text-lg font-medium text-fg mb-2">{title}</h3>
      <p className="text-sm text-muted max-w-sm mb-6">{description}</p>
      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {action.label}
          </button>
        )
      )}
    </div>
  );
}

interface InlineEmptyProps {
  message: string;
  className?: string;
}

export function InlineEmpty({ message, className }: InlineEmptyProps) {
  return (
    <div className={cn(
      'text-center py-8 text-sm text-muted',
      className
    )}>
      {message}
    </div>
  );
}