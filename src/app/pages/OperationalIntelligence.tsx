import { useState } from 'react';
import {
  Sparkles, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Clock, Users, Zap, RefreshCw, ChevronDown, Eye,
  ArrowRight, Target, Activity, Flame, Brain, Calendar,
  MapPin, Download, Bell, Info, CircleDot,
  FileText, Layers
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────
type InsightSeverity = 'critical' | 'warning' | 'positive' | 'info';
type Trend = 'up' | 'down' | 'flat';

interface AIInsight {
  id: string;
  severity: InsightSeverity;
  category: string;
  title: string;
  description: string;
  confidence: number;
  impact: string;
  action: string;
  detected: string;
}

interface FunnelStage {
  label: string;
  count: number;
  pct: number;
  dropPct?: number;
  avgDays: number;
}

interface BottleneckStage {
  stage: string;
  avgDwell: number;
  caseCount: number;
  severity: 'high' | 'medium' | 'low';
  root: string;
}

// ── Data ─────────────────────────────────────────────────────────────────────
const AI_INSIGHTS: AIInsight[] = [
  {
    id: 'INS-001',
    severity: 'critical',
    category: 'SLA Risk',
    title: 'Document verification bottleneck — 47 cases at 48h+ dwell time',
    description: 'Officer OFF-MH-2204 has 14 cases in document verification stage with zero activity in the last 48 hours. This officer\'s queue size is 2.1× the department average. SLA breach risk: HIGH for 8 cases within 72 hours.',
    confidence: 94,
    impact: 'Estimated 8 SLA breaches and ₹40,000 in penalty exposure if not actioned within 24 hours.',
    action: 'Redistribute 6 cases to available officers OFF-MH-2208 and OFF-MH-2209 (current queue: 4 each).',
    detected: '30 Apr 2026, 10:15 IST',
  },
  {
    id: 'INS-002',
    severity: 'warning',
    category: 'Demand Surge',
    title: 'Scholarship applications 38% above forecast for May 2026',
    description: 'Based on application trend data from last 14 days, the platform predicts a 38% surge in scholarship applications in May 2026 (academic year end). Current officer capacity is projected to be insufficient after 12 May.',
    confidence: 87,
    impact: 'Without intervention, SLA compliance will drop from 87% to ~61% in May.',
    action: 'Onboard 3 additional contract case workers by 8 May. Pre-approve 2 overtime shifts for existing staff.',
    detected: '30 Apr 2026, 09:00 IST',
  },
  {
    id: 'INS-003',
    severity: 'positive',
    category: 'Efficiency Win',
    title: 'DigiLocker prefill reduced average form completion time by 6.4 minutes',
    description: 'Citizen form completion time for scholarship applications dropped from 18.2 min (manual) to 11.8 min (DigiLocker prefill). Prefill adoption rate: 73% of new applicants.',
    confidence: 98,
    impact: 'Saving 152 hours of citizen time per week. Drop-off rate reduced by 22%.',
    action: 'Promote DigiLocker prefill adoption to remaining 27% via SMS nudge campaign.',
    detected: '29 Apr 2026, 14:00 IST',
  },
  {
    id: 'INS-004',
    severity: 'warning',
    category: 'Document Quality',
    title: 'Income certificate deficiency rate spiked to 34% in April',
    description: '34% of income certificate submissions in April triggered deficiency — up from 21% in March. Root cause analysis: Issuing tehsil offices in Nashik and Aurangabad divisions issuing certs with non-standard formats that fail validation rules.',
    confidence: 89,
    impact: 'Each deficiency adds avg 8 days to processing time. 156 applications affected.',
    action: 'Issue advisory to Nashik and Aurangabad tehsils. Update validation rules to accept legacy format codes.',
    detected: '28 Apr 2026, 16:30 IST',
  },
  {
    id: 'INS-005',
    severity: 'info',
    category: 'Geographic Insight',
    title: 'Pune and Nagpur districts have 3× higher digital adoption vs state average',
    description: 'Platform data shows Pune (78% web/app) and Nagpur (71% web/app) significantly outperforming state average (34%). Rural Marathwada districts are 91% CSC-operator-submitted.',
    confidence: 96,
    impact: 'CSC operators in Marathwada region are critical infrastructure — any CSC downtime directly impacts application submission rates.',
    action: 'Deploy offline CSC sync feature. Prioritise CSC operator training in Beed, Nanded, Osmanabad.',
    detected: '27 Apr 2026, 11:00 IST',
  },
  {
    id: 'INS-006',
    severity: 'positive',
    category: 'Fraud Prevention',
    title: 'Duplicate benefit detection prevented ₹4.2L in double disbursement',
    description: 'Cross-scheme deduplication engine flagged 23 applications in April where citizens were already receiving equivalent benefits from central schemes. All were automatically held pending officer review.',
    confidence: 91,
    impact: '₹4.2 lakh in potential duplicate disbursement prevented. All 23 cases appropriately rejected or redirected.',
    action: 'Update deduplication rules for PM Scholarship overlap — 4 edge cases still requiring manual rule definition.',
    detected: '26 Apr 2026, 08:00 IST',
  },
];

const FUNNEL_STAGES: FunnelStage[] = [
  { label: 'Service Discovery / Feed View', count: 18420, pct: 100, avgDays: 0 },
  { label: 'Eligibility Check Started', count: 11304, pct: 61.4, dropPct: 38.6, avgDays: 0 },
  { label: 'Consent Granted', count: 8934, pct: 48.5, dropPct: 20.9, avgDays: 0 },
  { label: 'Application Drafted', count: 6712, pct: 36.4, dropPct: 24.9, avgDays: 1.2 },
  { label: 'Application Submitted', count: 5891, pct: 32.0, dropPct: 12.2, avgDays: 2.1 },
  { label: 'Document Verification', count: 5234, pct: 28.4, dropPct: 11.1, avgDays: 6.8 },
  { label: 'Approval / Rejection', count: 4876, pct: 26.5, dropPct: 6.8, avgDays: 4.2 },
  { label: 'Certificate / Benefit Issued', count: 4512, pct: 24.5, dropPct: 7.5, avgDays: 1.1 },
];

const BOTTLENECKS: BottleneckStage[] = [
  { stage: 'Document Verification', avgDwell: 7.2, caseCount: 156, severity: 'high', root: 'Officer workload concentration — top 2 officers hold 48% of queue' },
  { stage: 'Tehsildar / District Approval', avgDwell: 4.8, caseCount: 89, severity: 'high', root: 'Single approval authority without backup; absent 3+ days blocks all cases' },
  { stage: 'Income Certificate Deficiency Response', avgDwell: 8.1, caseCount: 67, severity: 'high', root: 'Citizens not receiving deficiency SMS (deliverability ~78%)' },
  { stage: 'Field Inspection Scheduling', avgDwell: 5.6, caseCount: 34, severity: 'medium', root: 'No online inspection scheduling — manual phone coordination' },
  { stage: 'Payment / DBT Processing', avgDwell: 2.3, caseCount: 28, severity: 'medium', root: 'PFMS batch processing once daily — delay inherent in system' },
];

const GEO_DATA = [
  { district: 'Pune', apps: 1234, approved: 1089, slaPct: 94, channel: '78% Digital' },
  { district: 'Nagpur', apps: 876, approved: 801, slaPct: 91, channel: '71% Digital' },
  { district: 'Mumbai Suburban', apps: 1102, approved: 934, slaPct: 89, channel: '82% Digital' },
  { district: 'Nashik', apps: 634, approved: 521, slaPct: 82, channel: '54% Digital' },
  { district: 'Aurangabad', apps: 445, approved: 334, slaPct: 75, channel: '41% Digital' },
  { district: 'Beed', apps: 312, approved: 210, slaPct: 67, channel: '18% Digital (CSC-led)' },
  { district: 'Nanded', apps: 289, approved: 187, slaPct: 64, channel: '12% Digital (CSC-led)' },
  { district: 'Osmanabad', apps: 267, approved: 158, slaPct: 59, channel: '9% Digital (CSC-led)' },
];

const CHANNEL_PERF = [
  { channel: 'Web Portal', pct: 38, submissions: 2234, conversion: 78, avgTime: '11.8 min' },
  { channel: 'Mobile App', pct: 24, submissions: 1412, conversion: 72, avgTime: '14.2 min' },
  { channel: 'CSC Operator', pct: 31, submissions: 1823, conversion: 96, avgTime: '8.4 min' },
  { channel: 'WhatsApp Bot', pct: 4, submissions: 235, conversion: 61, avgTime: '22.1 min' },
  { channel: 'IVR / Phone', pct: 3, submissions: 187, conversion: 45, avgTime: '31.4 min' },
];

// ── Sub-components ────────────────────────────────────────────────────────────
function KPICard({ label, value, trend, trendVal, unit, icon: Icon, color, bg }: {
  label: string; value: string; trend: Trend; trendVal: string;
  unit?: string; icon: React.ElementType; color: string; bg: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <span className={`text-xs flex items-center gap-0.5 font-medium ${trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'}`}>
          {trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : trend === 'down' ? <TrendingDown className="w-3.5 h-3.5" /> : <CircleDot className="w-3.5 h-3.5" />}
          {trendVal}
        </span>
      </div>
      <p className={`text-3xl font-bold ${color}`}>{value}<span className="text-base font-normal text-muted-foreground ml-1">{unit}</span></p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

const SEVERITY_CONFIG: Record<InsightSeverity, { bg: string; border: string; icon: React.ElementType; iconColor: string; labelColor: string; label: string }> = {
  critical: { bg: 'bg-destructive/5', border: 'border-destructive/30', icon: Flame, iconColor: 'text-destructive', labelColor: 'text-destructive', label: 'Critical' },
  warning: { bg: 'bg-warning/5', border: 'border-warning/30', icon: AlertTriangle, iconColor: 'text-warning', labelColor: 'text-warning', label: 'Warning' },
  positive: { bg: 'bg-success/5', border: 'border-success/30', icon: CheckCircle, iconColor: 'text-success', labelColor: 'text-success', label: 'Positive' },
  info: { bg: 'bg-primary/5', border: 'border-primary/20', icon: Brain, iconColor: 'text-primary', labelColor: 'text-primary', label: 'Insight' },
};

function InsightCard({ insight }: { insight: AIInsight }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_CONFIG[insight.severity];
  const Icon = cfg.icon;
  return (
    <div className={`border-2 rounded-2xl overflow-hidden transition-all ${cfg.border} ${cfg.bg}`}>
      <button className="w-full text-left p-5" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/60`}>
            <Icon className={`w-5 h-5 ${cfg.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-white/60 ${cfg.labelColor}`}>{cfg.label}</span>
              <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-white/40">{insight.category}</span>
              <span className="text-xs text-muted-foreground">Confidence: <strong>{insight.confidence}%</strong></span>
            </div>
            <p className="text-sm font-semibold leading-snug">{insight.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{insight.detected}</p>
          </div>
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" /> : <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />}
        </div>
      </button>
      {expanded && (
        <div className="border-t border-current/10 p-5 space-y-4 bg-white/40">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Analysis</p>
            <p className="text-sm leading-relaxed">{insight.description}</p>
          </div>
          <div className={`p-3 rounded-xl border ${cfg.border}`}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Estimated Impact</p>
            <p className="text-sm">{insight.impact}</p>
          </div>
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1 flex items-center gap-1"><Zap className="w-3 h-3" /> Recommended Action</p>
            <p className="text-sm">{insight.action}</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:bg-primary/90 transition-colors">
              <CheckCircle className="w-3.5 h-3.5" /> Mark as Actioned
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-muted rounded-xl text-xs font-medium hover:bg-muted/80 transition-colors">
              <Bell className="w-3.5 h-3.5" /> Escalate
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-muted rounded-xl text-xs font-medium hover:bg-muted/80 transition-colors">
              <Eye className="w-3.5 h-3.5" /> Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function OperationalIntelligence() {
  const [activeTab, setActiveTab] = useState<'insights' | 'funnel' | 'bottlenecks' | 'geo' | 'channels' | 'forecast'>('insights');
  const [insightFilter, setInsightFilter] = useState<InsightSeverity | 'all'>('all');

  const filteredInsights = AI_INSIGHTS.filter(i => insightFilter === 'all' || i.severity === insightFilter);

  return (
    <div className="min-h-full bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-medium text-success uppercase tracking-wide">Live Intelligence · Auto-refreshes every 5 min</span>
            </div>
            <h1 className="text-3xl font-bold mb-1">Operational Intelligence</h1>
            <p className="text-muted-foreground text-sm">AI-powered insights, service delivery funnel analytics, bottleneck detection, and predictive demand forecasting.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
              <Download className="w-4 h-4" /> Export Report
            </button>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <KPICard label="Total Applications (MTD)" value="5,891" trend="up" trendVal="+12%" icon={FileText} color="text-primary" bg="bg-primary/10" />
          <KPICard label="Approval Rate" value="76.6" unit="%" trend="up" trendVal="+3.2%" icon={CheckCircle} color="text-success" bg="bg-success/10" />
          <KPICard label="Avg Processing Time" value="9.4" unit="days" trend="down" trendVal="-1.1d" icon={Clock} color="text-warning" bg="bg-warning/10" />
          <KPICard label="SLA Compliance" value="87.3" unit="%" trend="down" trendVal="-2.1%" icon={Target} color="text-warning" bg="bg-warning/10" />
          <KPICard label="Citizen Satisfaction" value="4.1" unit="/5" trend="up" trendVal="+0.2" icon={Sparkles} color="text-purple-600" bg="bg-purple-50" />
        </div>

        {/* AI Insight alert strip */}
        <div className="flex items-start gap-3 p-4 bg-destructive/5 border-2 border-destructive/30 rounded-xl mb-6">
          <Brain className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-destructive">
              AI detected {AI_INSIGHTS.filter(i => i.severity === 'critical').length} critical signal{AI_INSIGHTS.filter(i => i.severity === 'critical').length !== 1 ? 's' : ''} requiring immediate action
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{AI_INSIGHTS.filter(i => i.severity === 'critical' || i.severity === 'warning').length} total insights need attention · {AI_INSIGHTS.filter(i => i.severity === 'positive').length} positive signals detected</p>
          </div>
          <button onClick={() => setActiveTab('insights')} className="text-xs text-destructive hover:underline flex items-center gap-1 flex-shrink-0">
            View Insights <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-card border border-border rounded-xl mb-6 overflow-x-auto">
          {([
            { id: 'insights', label: 'AI Insights', icon: Brain },
            { id: 'funnel', label: 'Service Funnel', icon: Layers },
            { id: 'bottlenecks', label: 'Bottlenecks', icon: Activity },
            { id: 'geo', label: 'Geographic', icon: MapPin },
            { id: 'channels', label: 'Channels', icon: Zap },
            { id: 'forecast', label: 'Demand Forecast', icon: TrendingUp },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── AI Insights ── */}
        {activeTab === 'insights' && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 flex-wrap">
              {(['all', 'critical', 'warning', 'positive', 'info'] as const).map(f => {
                const count = f === 'all' ? AI_INSIGHTS.length : AI_INSIGHTS.filter(i => i.severity === f).length;
                const cfg = f === 'all' ? null : SEVERITY_CONFIG[f];
                return (
                  <button
                    key={f}
                    onClick={() => setInsightFilter(f)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all flex items-center gap-1.5 ${insightFilter === f ? 'bg-foreground text-background' : 'bg-card border border-border text-muted-foreground hover:bg-muted'}`}
                  >
                    {cfg && <cfg.icon className={`w-3.5 h-3.5 ${cfg.iconColor}`} />}
                    {f === 'all' ? `All Insights (${count})` : `${cfg?.label} (${count})`}
                  </button>
                );
              })}
            </div>
            <div className="space-y-4">
              {filteredInsights.map(insight => <InsightCard key={insight.id} insight={insight} />)}
            </div>
          </div>
        )}

        {/* ── Funnel ── */}
        {activeTab === 'funnel' && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-semibold">End-to-End Service Delivery Funnel</h2>
                <span className="text-xs text-muted-foreground">April 2026 · Scholarship services</span>
              </div>
              <div className="space-y-3">
                {FUNNEL_STAGES.map((stage, i) => (
                  <div key={stage.label}>
                    <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-xs font-bold">{i + 1}</span>
                        <span className="text-sm font-medium">{stage.label}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span><strong className="text-foreground">{stage.count.toLocaleString('en-IN')}</strong> citizens</span>
                        {stage.avgDays > 0 && <span>Avg dwell: <strong className="text-foreground">{stage.avgDays}d</strong></span>}
                        {stage.dropPct && (
                          <span className={`flex items-center gap-1 font-medium ${stage.dropPct > 20 ? 'text-destructive' : stage.dropPct > 10 ? 'text-warning' : 'text-muted-foreground'}`}>
                            {stage.dropPct > 15 && '↓'} {stage.dropPct}% drop-off
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden relative">
                        <div
                          className={`h-full rounded-lg transition-all duration-700 flex items-center pl-3 ${
                            stage.pct > 80 ? 'bg-primary' :
                            stage.pct > 50 ? 'bg-primary/70' :
                            stage.pct > 30 ? 'bg-primary/50' :
                            'bg-primary/30'
                          }`}
                          style={{ width: `${stage.pct}%` }}
                        >
                          <span className="text-xs text-white font-medium">{stage.pct}%</span>
                        </div>
                      </div>
                    </div>
                    {stage.dropPct && stage.dropPct > 20 && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-warning ml-8">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>High drop-off at this stage — investigate friction points</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-semibold mb-4">Conversion Benchmarks</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Discovery → Application', val: '32%', benchmark: '35%', ok: false },
                  { label: 'Application → Approval', val: '76.6%', benchmark: '75%', ok: true },
                  { label: 'DigiLocker Prefill Rate', val: '73%', benchmark: '80%', ok: false },
                  { label: 'First-submission Accuracy', val: '66%', benchmark: '70%', ok: false },
                ].map(b => (
                  <div key={b.label} className={`p-4 rounded-xl border-2 ${b.ok ? 'border-success/30 bg-success/5' : 'border-warning/30 bg-warning/5'}`}>
                    <p className={`text-2xl font-bold ${b.ok ? 'text-success' : 'text-warning'}`}>{b.val}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{b.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">Target: {b.benchmark}</p>
                    {!b.ok && <p className="text-xs text-warning mt-1 font-medium">Below target</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Bottlenecks ── */}
        {activeTab === 'bottlenecks' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-warning/5 border border-warning/20 rounded-xl">
              <Activity className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <p className="text-sm"><strong>AI Bottleneck Scanner:</strong> Analyzing average dwell time per stage to identify where cases get stuck. Stages with dwell time {'>'}50% of total SLA are flagged for intervention.</p>
            </div>
            {BOTTLENECKS.map((b, i) => (
              <div key={b.stage} className={`bg-card border-2 rounded-2xl p-5 ${b.severity === 'high' ? 'border-destructive/30' : b.severity === 'medium' ? 'border-warning/30' : 'border-border'}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                  <div className="flex items-start gap-4">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${b.severity === 'high' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>{i + 1}</span>
                    <div>
                      <p className="text-sm font-semibold">{b.stage}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>Avg dwell: <strong className={b.avgDwell > 5 ? 'text-destructive' : 'text-warning'}>{b.avgDwell} days</strong></span>
                        <span>{b.caseCount} cases currently stuck</span>
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium uppercase tracking-wide ${b.severity === 'high' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                    {b.severity} severity
                  </span>
                </div>

                {/* Dwell bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Dwell time vs 1-day ideal</span>
                    <span className={b.avgDwell > 5 ? 'text-destructive font-medium' : 'text-warning font-medium'}>{b.avgDwell}× above ideal</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${b.avgDwell > 5 ? 'bg-destructive' : 'bg-warning'}`} style={{ width: `${Math.min((b.avgDwell / 10) * 100, 100)}%` }} />
                  </div>
                </div>

                <div className="p-3 bg-muted/30 rounded-xl text-xs text-muted-foreground flex items-start gap-2 mb-3">
                  <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span><strong>Root Cause:</strong> {b.root}</span>
                </div>

                <div className="flex gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 text-primary rounded-xl text-xs font-medium hover:bg-primary/20 transition-colors">
                    <Zap className="w-3.5 h-3.5" /> Auto-Reassign
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-2 bg-muted rounded-xl text-xs font-medium hover:bg-muted/80 transition-colors">
                    <Bell className="w-3.5 h-3.5" /> Alert Officers
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Geographic ── */}
        {activeTab === 'geo' && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="text-base font-semibold">District-wise Performance — Maharashtra</h2>
              <p className="text-xs text-muted-foreground mt-1">Application volume, approval rates, SLA compliance, and digital channel adoption by district.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    {['District', 'Applications', 'Approved', 'Approval %', 'SLA Compliance', 'Channel Mix', 'Status'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {GEO_DATA.map(d => {
                    const approvalPct = Math.round((d.approved / d.apps) * 100);
                    return (
                      <tr key={d.district} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3.5 font-medium">{d.district}</td>
                        <td className="px-4 py-3.5">{d.apps.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3.5">{d.approved.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${approvalPct > 85 ? 'bg-success' : approvalPct > 70 ? 'bg-warning' : 'bg-destructive'}`} style={{ width: `${approvalPct}%` }} />
                            </div>
                            <span className="text-xs font-medium">{approvalPct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${d.slaPct >= 90 ? 'bg-success/10 text-success' : d.slaPct >= 75 ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'}`}>
                            {d.slaPct}%
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">{d.channel}</td>
                        <td className="px-4 py-3.5">
                          <div className={`w-3 h-3 rounded-full ${d.slaPct >= 90 ? 'bg-success' : d.slaPct >= 75 ? 'bg-warning' : 'bg-destructive'}`} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Channels ── */}
        {activeTab === 'channels' && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-base font-semibold mb-5">Channel Performance — April 2026</h2>
              <div className="space-y-5">
                {CHANNEL_PERF.map(c => (
                  <div key={c.channel}>
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <span className="text-sm font-medium">{c.channel}</span>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Submissions: <strong className="text-foreground">{c.submissions.toLocaleString('en-IN')}</strong></span>
                        <span>Conversion: <strong className={c.conversion > 80 ? 'text-success' : c.conversion > 60 ? 'text-warning' : 'text-destructive'}>{c.conversion}%</strong></span>
                        <span>Avg time: <strong className="text-foreground">{c.avgTime}</strong></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-6 bg-muted rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-lg flex items-center pl-3 transition-all duration-700"
                          style={{ width: `${c.pct}%` }}
                        >
                          <span className="text-xs text-white font-medium">{c.pct}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 bg-primary/5 border border-primary/20 rounded-2xl">
              <p className="text-sm font-semibold text-primary mb-2 flex items-center gap-2"><Brain className="w-4 h-4" /> AI Channel Insight</p>
              <p className="text-sm text-muted-foreground">CSC operators achieve 96% conversion (vs 78% web) because operators pre-screen applications before submission. Consider building a pre-submission checklist into web/app flows to close this gap.</p>
            </div>
          </div>
        )}

        {/* ── Forecast ── */}
        {activeTab === 'forecast' && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-semibold">Demand Forecast — May–July 2026</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">AI prediction confidence: 87% · Based on 24 months of historical data + academic calendar</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-3 h-3 bg-primary/40 rounded" /> Actual
                  <div className="w-3 h-3 bg-warning/60 rounded" /> Forecast
                  <div className="w-3 h-3 bg-primary/10 rounded" /> Confidence band
                </div>
              </div>

              {/* Bar chart */}
              <div className="space-y-3">
                {[
                  { month: 'Jan 2026', actual: 3200, forecast: null, isPast: true },
                  { month: 'Feb 2026', actual: 3800, forecast: null, isPast: true },
                  { month: 'Mar 2026', actual: 4200, forecast: null, isPast: true },
                  { month: 'Apr 2026', actual: 5891, forecast: null, isPast: true },
                  { month: 'May 2026', actual: null, forecast: 8100, isPast: false },
                  { month: 'Jun 2026', actual: null, forecast: 11400, isPast: false },
                  { month: 'Jul 2026', actual: null, forecast: 9200, isPast: false },
                ].map(m => {
                  const val = m.actual || m.forecast || 0;
                  const max = 12000;
                  return (
                    <div key={m.month} className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground w-20 flex-shrink-0">{m.month}</span>
                      <div className="flex-1 h-7 bg-muted rounded-lg overflow-hidden relative">
                        <div
                          className={`h-full rounded-lg flex items-center pl-3 transition-all duration-700 ${m.isPast ? 'bg-primary/70' : 'bg-warning/60'}`}
                          style={{ width: `${(val / max) * 100}%` }}
                        >
                          <span className="text-xs text-white font-medium">{val.toLocaleString('en-IN')}</span>
                        </div>
                        {!m.isPast && (
                          <div className="absolute inset-0 flex items-center justify-end pr-2">
                            <span className="text-xs text-warning font-medium">↑ Predicted</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Projected May Surge', val: '+38%', detail: 'vs April 2026', color: 'text-warning', bg: 'bg-warning/10', icon: TrendingUp },
                { label: 'Officer Capacity Gap (May)', val: '3 FTEs', detail: 'needed to maintain 95% SLA', color: 'text-destructive', bg: 'bg-destructive/10', icon: Users },
                { label: 'Peak Application Day', val: '30 Jun', detail: 'Last day of academic year', color: 'text-primary', bg: 'bg-primary/10', icon: Calendar },
              ].map(f => (
                <div key={f.label} className={`p-5 rounded-2xl border border-current/20 ${f.bg}`}>
                  <f.icon className={`w-5 h-5 ${f.color} mb-2`} />
                  <p className={`text-2xl font-bold ${f.color}`}>{f.val}</p>
                  <p className="text-xs font-medium mt-0.5">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.detail}</p>
                </div>
              ))}
            </div>

            <div className="p-5 bg-primary/5 border border-primary/20 rounded-2xl space-y-3">
              <p className="text-sm font-semibold text-primary flex items-center gap-2"><Zap className="w-4 h-4" /> AI Recommended Actions for May 2026</p>
              <div className="space-y-2">
                {[
                  'Onboard 3 additional contract case workers by 8 May 2026.',
                  'Pre-configure auto-escalation rules for cases >7 days without officer action.',
                  'Enable auto-batch DigiLocker verification to reduce manual doc checks.',
                  'Send proactive SMS to citizens with drafts — reduce abandonment before deadline.',
                  'Prepare CSC operator advisory — Marathwada districts expect 45% volume surge.',
                ].map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    {a}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
