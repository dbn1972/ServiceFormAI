import { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, FileText, Check, Filter, Search, Loader2 } from 'lucide-react';
import { consumerService, type NotificationItem } from '../services/api/consumer.service';

export default function NotificationsCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    consumerService.getNotifications().then((res) => {
      setNotifications(res.data);
    }).catch(() => {
      setError('Failed to load notifications');
    }).finally(() => setLoading(false));
  }, []);

  const handleMarkAllRead = async () => {
    await consumerService.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const filtered = notifications.filter((n) =>
    !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.message.toLowerCase().includes(search.toLowerCase())
  );

  const unreadCount = filtered.filter((n) => !n.read).length;

  const getIcon = (n: NotificationItem) => {
    if (n.meta?.status === 'APPROVED') return <CheckCircle className="w-5 h-5 text-success" />;
    if (n.meta?.status === 'REJECTED') return <AlertTriangle className="w-5 h-5 text-destructive" />;
    if (n.meta?.status === 'PENDING_DOCUMENTS') return <AlertTriangle className="w-5 h-5 text-warning" />;
    if (n.type === 'application_update') return <FileText className="w-5 h-5 text-primary" />;
    return <Info className="w-5 h-5 text-info" />;
  };

  return (
    <div className="min-h-full bg-background p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with all your service activities</p>
        </div>

        {/* Header Actions */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1 relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button className="flex-1 md:flex-none px-4 py-3 bg-muted text-muted-foreground border border-border rounded-lg text-sm font-medium hover:bg-muted/80 flex items-center justify-center gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <button
                onClick={handleMarkAllRead}
                className="flex-1 md:flex-none px-4 py-3 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm font-medium hover:bg-primary/20 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Mark All Read
              </button>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-2xl font-bold mb-1">{unreadCount}</p>
            <p className="text-sm text-muted-foreground">Unread</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-2xl font-bold mb-1">{filtered.length}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <Bell className="w-6 h-6 text-primary mb-1" />
            <p className="text-sm text-muted-foreground">Application Updates</p>
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((n) => (
              <div
                key={n.id}
                className={`border-l-4 rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                  !n.read ? 'bg-primary/5 border-primary' : 'bg-card border-border'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                    {getIcon(n)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h4 className="font-semibold text-sm">{n.title}</h4>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(n.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                    {n.meta?.trackingNumber && (
                      <p className="text-xs text-primary mt-1">#{n.meta.trackingNumber}</p>
                    )}
                  </div>
                  {!n.read && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="text-center mt-8">
            <button
              onClick={() => consumerService.getNotifications().then((r) => setNotifications(r.data))}
              className="px-6 py-3 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80"
            >
              Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

