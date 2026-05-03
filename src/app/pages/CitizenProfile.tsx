import { useState, useEffect } from 'react';
import { User, Mail, Phone, Shield, Edit, Camera, CheckCircle, Bell, Lock, Loader2, AlertTriangle, Save, X } from 'lucide-react';
import { consumerService } from '../services/api/consumer.service';

interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  consumer_source: string;
  created_at: string;
}

export default function CitizenProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    consumerService.getProfile().then((p) => {
      setProfile(p);
      setForm({ name: p.name || '', email: p.email || '', phone: p.phone || '' });
    }).catch(() => setError('Failed to load profile')).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await consumerService.updateProfile(form);
      setProfile((prev) => prev ? { ...prev, ...updated } : null);
      setEditing(false);
    } catch {
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const initials = profile?.name
    ? profile.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-8 text-center max-w-md">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and account settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl p-6 sticky top-8">
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="w-32 h-32 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center text-white text-4xl font-bold mb-4">
                    {initials}
                  </div>
                  <button className="absolute bottom-2 right-2 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90">
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                <h2 className="text-xl font-semibold mb-1">{profile?.name || 'Citizen'}</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Source: {profile?.consumer_source || 'direct'}
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-success">
                  <Shield className="w-4 h-4" />
                  <span>Verified Account</span>
                </div>
              </div>

              <div className="border-t border-border pt-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="font-medium">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '-'}
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-6 mt-6 space-y-3">
                <button className="w-full py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80 flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4" />
                  Change Password
                </button>
              </div>
            </div>
          </div>

          {/* Right - Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-success text-success-foreground rounded-lg text-sm font-medium hover:bg-success/90 flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save
                    </button>
                    <button
                      onClick={() => { setEditing(false); setForm({ name: profile?.name || '', email: profile?.email || '', phone: profile?.phone || '' }); }}
                      className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80 flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Full Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium">{profile?.name || '-'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Email Address</label>
                  {editing ? (
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium">{profile?.email || '-'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Mobile Number</label>
                  {editing ? (
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full px-3 py-2 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium">{profile?.phone || '-'}</span>
                      {profile?.phone && <CheckCircle className="w-4 h-4 text-success ml-auto" />}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-6">Preferences</h3>
              <div className="space-y-4">
                {[
                  { label: 'Email Notifications', sublabel: 'Receive updates via email', icon: Bell, checked: true },
                  { label: 'SMS Notifications', sublabel: 'Receive updates via SMS', icon: Phone, checked: true },
                  { label: 'Two-Factor Authentication', sublabel: 'Extra security for your account', icon: Shield, checked: false },
                ].map((pref) => (
                  <div key={pref.label} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <pref.icon className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{pref.label}</p>
                        <p className="text-xs text-muted-foreground">{pref.sublabel}</p>
                      </div>
                    </div>
                    <label className="relative inline-block w-12 h-6">
                      <input type="checkbox" className="sr-only peer" defaultChecked={pref.checked} />
                      <div className="w-full h-full bg-muted rounded-full peer-checked:bg-primary transition-colors cursor-pointer" />
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
