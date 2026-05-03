import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight, Hash, FileText, Settings, BarChart3, Sparkles } from 'lucide-react';
import { ALL_SERVICE_TEMPLATES } from '../data/serviceTemplates';

interface Command {
  id: string;
  title: string;
  subtitle?: string;
  icon?: any;
  action: () => void;
  category: 'navigation' | 'templates' | 'actions';
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Build command list
  const commands = useMemo<Command[]>(() => {
    const navigationCommands: Command[] = [
      {
        id: 'dashboard',
        title: 'Go to Dashboard',
        icon: BarChart3,
        action: () => navigate('/tenant/dashboard'),
        category: 'navigation',
        keywords: ['home', 'main', 'overview'],
      },
      {
        id: 'templates',
        title: 'Browse Templates',
        icon: Sparkles,
        action: () => navigate('/tenant/templates'),
        category: 'navigation',
        keywords: ['search', 'find', 'discover'],
      },
      {
        id: 'create',
        title: 'Create Service',
        icon: FileText,
        action: () => navigate('/tenant/service/create'),
        category: 'navigation',
        keywords: ['new', 'add', 'build'],
      },
      {
        id: 'workflow',
        title: 'Configure Workflow',
        icon: Settings,
        action: () => navigate('/tenant/service/workflow'),
        category: 'navigation',
        keywords: ['approval', 'automation', 'process'],
      },
      {
        id: 'analytics',
        title: 'View Analytics',
        icon: BarChart3,
        action: () => navigate('/tenant/analytics'),
        category: 'navigation',
        keywords: ['metrics', 'stats', 'performance', 'reports'],
      },
    ];

    const templateCommands: Command[] = ALL_SERVICE_TEMPLATES.map(template => ({
      id: `template-${template.id}`,
      title: template.name,
      subtitle: template.category,
      icon: Hash,
      action: () => {
        navigate(`/tenant/service/create?template=${template.id}`);
        onClose();
      },
      category: 'templates',
      keywords: [template.category, template.targetAudience, ...template.description.split(' ')],
    }));

    return [...navigationCommands, ...templateCommands];
  }, [navigate, onClose]);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      return commands.slice(0, 10); // Show top 10 by default
    }

    const lowerQuery = query.toLowerCase();
    return commands.filter(cmd => {
      const titleMatch = cmd.title.toLowerCase().includes(lowerQuery);
      const subtitleMatch = cmd.subtitle?.toLowerCase().includes(lowerQuery);
      const keywordsMatch = cmd.keywords?.some(kw => kw.toLowerCase().includes(lowerQuery));
      return titleMatch || subtitleMatch || keywordsMatch;
    }).slice(0, 10);
  }, [commands, query]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {
      navigation: [],
      templates: [],
      actions: [],
    };

    filteredCommands.forEach(cmd => {
      if (cmd.category in groups) {
        groups[cmd.category]!.push(cmd);
      }
    });

    return groups;
  }, [filteredCommands]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredCommands[selectedIndex];
        if (selected) {
          selected.action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const renderCommandGroup = (title: string, commands: Command[], startIndex: number) => {
    if (commands.length === 0) return null;

    return (
      <div key={title} className="mb-4 last:mb-0">
        <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
          {title}
        </div>
        <div>
          {commands.map((cmd, index) => {
            const absoluteIndex = startIndex + index;
            const Icon = cmd.icon;
            const isSelected = absoluteIndex === selectedIndex;

            return (
              <button
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  isSelected ? 'bg-primary/10' : 'hover:bg-muted'
                }`}
              >
                {Icon && <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{cmd.title}</p>
                  {cmd.subtitle && (
                    <p className="text-xs text-muted-foreground truncate">{cmd.subtitle}</p>
                  )}
                </div>
                {isSelected && <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  let currentIndex = 0;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-[20vh]"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl shadow-2xl max-w-2xl w-full max-h-[60vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search templates, pages, or actions..."
            className="flex-1 bg-transparent border-none outline-none text-base"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Command List */}
        <div className="flex-1 overflow-y-auto py-2">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              No results found for "{query}"
            </div>
          ) : (
            <>
              {(groupedCommands.navigation ?? []).length > 0 && (
                <>
                  {renderCommandGroup('Navigation', groupedCommands.navigation ?? [], currentIndex)}
                  {(() => { currentIndex += (groupedCommands.navigation ?? []).length; return null; })()}
                </>
              )}
              {(groupedCommands.templates ?? []).length > 0 && (
                <>
                  {renderCommandGroup('Templates', groupedCommands.templates ?? [], currentIndex)}
                  {(() => { currentIndex += (groupedCommands.templates ?? []).length; return null; })()}
                </>
              )}
              {(groupedCommands.actions ?? []).length > 0 && (
                <>
                  {renderCommandGroup('Actions', groupedCommands.actions ?? [], currentIndex)}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>
              <kbd className="px-2 py-1 bg-muted rounded border border-border">↑↓</kbd> Navigate
            </span>
            <span>
              <kbd className="px-2 py-1 bg-muted rounded border border-border">↵</kbd> Select
            </span>
            <span>
              <kbd className="px-2 py-1 bg-muted rounded border border-border">Esc</kbd> Close
            </span>
          </div>
          <span>{filteredCommands.length} results</span>
        </div>
      </div>
    </div>
  );
}
