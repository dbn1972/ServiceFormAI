import { FileText, CheckCircle, Clock, AlertTriangle, TrendingUp, Calendar, Award, Target, ChevronRight, Flag } from 'lucide-react';
import { useState, useEffect } from 'react';
import { producerService } from '../services/api/producer.service';

export default function OfficerDashboard() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    producerService.getTenantAnalytics()
      .then((data) => setAnalytics(data))
      .catch(() => setAnalytics(null))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (val: number | undefined) => (loading ? '...' : String(val ?? 0));

  return (
    <div className="min-h-full bg-muted/30 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Officer Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, Rajesh Kumar • Education Department</p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-muted text-muted-foreground border border-border rounded-lg text-sm font-medium hover:bg-muted/80 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Today
              </button>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
                View Queue
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Date Range Tabs */}
          <div className="flex gap-2">
            {['Today', 'This Week', 'This Month', 'All Time'].map((tab, index) => (
              <button
                key={index}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  index === 0
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Personal Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Applications', value: fmt(analytics?.totalApplications), icon: FileText, color: 'primary', trend: 'All time' },
            { label: 'Approved', value: fmt(analytics?.approved), icon: CheckCircle, color: 'success', trend: 'All time' },
            { label: 'Pending Review', value: fmt(analytics?.pendingReview), icon: Clock, color: 'warning', trend: 'Awaiting action' },
            { label: 'Active Services', value: fmt(analytics?.totalServices), icon: AlertTriangle, color: 'destructive', trend: 'Published services' },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-${stat.color}/10 rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${stat.color}`} />
                  </div>
                </div>
                <p className="text-3xl font-bold mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                <p className="text-xs text-muted-foreground">{stat.trend}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left - Priority & Recent */}
          <div className="lg:col-span-2 space-y-6">
            {/* SLA Alerts */}
            <div className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-2 border-destructive/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">SLA Alerts</h2>
                  <p className="text-sm text-muted-foreground">5 applications approaching deadline</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  {
                    id: 'APP-2026-7834',
                    service: 'Merit Scholarship',
                    citizen: 'Priya Sharma',
                    hoursLeft: 6,
                    deadline: 'Today, 6:00 PM',
                  },
                  {
                    id: 'APP-2026-7901',
                    service: 'Income Certificate',
                    citizen: 'Amit Patel',
                    hoursLeft: 18,
                    deadline: 'Tomorrow, 12:00 PM',
                  },
                  {
                    id: 'APP-2026-7845',
                    service: 'Trade License',
                    citizen: 'Rajesh Kumar',
                    hoursLeft: 24,
                    deadline: 'Apr 30, 10:00 AM',
                  },
                ].map((app, index) => (
                  <div key={index} className="bg-card border border-destructive/20 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{app.service}</h3>
                          <span className="text-xs px-2 py-0.5 bg-destructive/20 text-destructive rounded-full font-medium">
                            {app.hoursLeft}h left
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{app.id} • {app.citizen}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Due: {app.deadline}
                      </p>
                      <button className="px-3 py-1 bg-destructive text-destructive-foreground rounded text-xs font-medium hover:bg-destructive/90">
                        Review Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Applications */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Recently Assigned</h2>
                <button className="text-sm text-primary hover:underline">View All Queue</button>
              </div>

              <div className="space-y-3">
                {[
                  {
                    id: 'APP-2026-8012',
                    service: 'Scholarship Application',
                    citizen: 'Sneha Reddy',
                    submitted: '2 hours ago',
                    documents: 8,
                    verified: 8,
                    status: 'new',
                  },
                  {
                    id: 'APP-2026-8001',
                    service: 'Birth Certificate',
                    citizen: 'Ramesh Gupta',
                    submitted: '4 hours ago',
                    documents: 3,
                    verified: 3,
                    status: 'in-review',
                  },
                  {
                    id: 'APP-2026-7998',
                    service: 'Caste Certificate',
                    citizen: 'Deepa Nair',
                    submitted: '6 hours ago',
                    documents: 5,
                    verified: 4,
                    status: 'in-review',
                  },
                ].map((app, index) => (
                  <div key={index} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{app.service}</h3>
                          {app.status === 'new' && (
                            <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full font-medium">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{app.id} • {app.citizen}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Submitted {app.submitted}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-success" />
                            {app.verified}/{app.documents} docs verified
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
                      Open Application
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance This Week */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-6">Your Performance This Week</h2>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-success/10 rounded-lg">
                  <p className="text-3xl font-bold text-success mb-1">42</p>
                  <p className="text-xs text-muted-foreground">Approved</p>
                </div>
                <div className="text-center p-4 bg-warning/10 rounded-lg">
                  <p className="text-3xl font-bold text-warning mb-1">8</p>
                  <p className="text-xs text-muted-foreground">Deficiencies</p>
                </div>
                <div className="text-center p-4 bg-destructive/10 rounded-lg">
                  <p className="text-3xl font-bold text-destructive mb-1">3</p>
                  <p className="text-xs text-muted-foreground">Rejected</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Approval Rate</span>
                    <span className="font-semibold">79%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-success" style={{ width: '79%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Avg. Processing Time</span>
                    <span className="font-semibold">4.2 days</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: '60%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">SLA Compliance</span>
                    <span className="font-semibold">94%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-info" style={{ width: '94%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Daily Goal */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Daily Goal</h3>
                  <p className="text-xs text-muted-foreground">10 applications</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span className="font-semibold">8/10</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-300" style={{ width: '80%' }}></div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Great work! Just 2 more to reach your daily target.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">This Month</span>
                  <span className="font-semibold">156 applications</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg. Response</span>
                  <span className="font-semibold">3.8 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Department Rank</span>
                  <span className="font-semibold flex items-center gap-1">
                    #3
                    <TrendingUp className="w-4 h-4 text-success" />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Citizen Rating</span>
                  <span className="font-semibold">4.8/5.0</span>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Recent Achievements</h3>
              <div className="space-y-3">
                {[
                  {
                    title: '100 Applications Milestone',
                    date: 'Apr 20, 2026',
                    icon: Award,
                    color: 'success',
                  },
                  {
                    title: 'Zero SLA Breach Week',
                    date: 'Apr 15, 2026',
                    icon: Flag,
                    color: 'primary',
                  },
                  {
                    title: 'Top Performer - March',
                    date: 'Mar 31, 2026',
                    icon: Award,
                    color: 'warning',
                  },
                ].map((achievement, index) => {
                  const Icon = achievement.icon;
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className={`w-10 h-10 bg-${achievement.color}/10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 text-${achievement.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{achievement.title}</p>
                        <p className="text-xs text-muted-foreground">{achievement.date}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Notifications</h3>
                <span className="w-6 h-6 bg-destructive rounded-full flex items-center justify-center text-xs text-white font-bold">
                  5
                </span>
              </div>
              <div className="space-y-3">
                {[
                  { message: 'New application assigned', time: '10 min ago', unread: true },
                  { message: 'Citizen responded to deficiency', time: '1 hour ago', unread: true },
                  { message: 'SLA approaching for APP-7834', time: '2 hours ago', unread: true },
                ].map((notif, index) => (
                  <div key={index} className={`flex items-start gap-3 p-3 rounded-lg ${notif.unread ? 'bg-primary/10' : 'bg-muted/50'}`}>
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notif.unread ? 'bg-primary' : 'bg-muted'}`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{notif.message}</p>
                      <p className="text-xs text-muted-foreground">{notif.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80">
                View All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
