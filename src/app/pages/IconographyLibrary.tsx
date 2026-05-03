// @ts-nocheck -- IconographyLibrary intentionally imports all icons for display
import { Home, User, Bell, Search, Settings, FileText, Calendar, Mail, Phone, MapPin, Camera, Download, Upload, Edit, Trash2, Plus, Minus, Check, X, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, ArrowRight, ArrowLeft, Menu, Filter, Star, Heart, Share, Info, AlertTriangle, AlertCircle, CheckCircle, XCircle, Clock, Shield, Lock, Unlock, Eye, EyeOff, Sun, Moon, Wifi, WifiOff, Battery, BatteryCharging, Volume2, VolumeX, Play, Pause, SkipForward, SkipBack, Zap, TrendingUp, TrendingDown, BarChart3, PieChart, Layers, Grid, List, Folder, File, Image, Video, Music, Code, Package, Globe, Smartphone, Tablet, Monitor, Printer, CreditCard, Wallet, ShoppingCart, Tag, Gift, Award, Trophy, Target, Flag, Bookmark, Link, Copy, Clipboard, Save, RefreshCw, RotateCw, RotateCcw, ZoomIn, ZoomOut, Maximize, Minimize, Send, Inbox, Archive, LogIn, LogOut, UserPlus, Users, MessageCircle, MessageSquare, HelpCircle, ThumbsUp, ThumbsDown } from 'lucide-react';

export default function IconographyLibrary() {
  const iconCategories = [
    {
      name: 'Navigation',
      icons: [
        { name: 'Home', icon: Home, usage: 'Homepage, dashboard' },
        { name: 'Menu', icon: Menu, usage: 'Mobile menu toggle' },
        { name: 'Search', icon: Search, usage: 'Search fields, discovery' },
        { name: 'ChevronRight', icon: ChevronRight, usage: 'Next, forward navigation' },
        { name: 'ChevronLeft', icon: ChevronLeft, usage: 'Back, previous' },
        { name: 'ChevronUp', icon: ChevronUp, usage: 'Collapse, scroll up' },
        { name: 'ChevronDown', icon: ChevronDown, usage: 'Expand, dropdown' },
        { name: 'ArrowRight', icon: ArrowRight, usage: 'Proceed, continue' },
        { name: 'ArrowLeft', icon: ArrowLeft, usage: 'Go back, cancel' },
      ],
    },
    {
      name: 'User & Account',
      icons: [
        { name: 'User', icon: User, usage: 'Profile, citizen account' },
        { name: 'Users', icon: Users, usage: 'Multiple users, groups' },
        { name: 'UserPlus', icon: UserPlus, usage: 'Registration, add user' },
        { name: 'Settings', icon: Settings, usage: 'Account settings, preferences' },
        { name: 'LogIn', icon: LogIn, usage: 'Sign in, authentication' },
        { name: 'LogOut', icon: LogOut, usage: 'Sign out, exit' },
        { name: 'Shield', icon: Shield, usage: 'Security, verification' },
        { name: 'Lock', icon: Lock, usage: 'Privacy, locked content' },
        { name: 'Unlock', icon: Unlock, usage: 'Access granted, unlocked' },
      ],
    },
    {
      name: 'Communication',
      icons: [
        { name: 'Bell', icon: Bell, usage: 'Notifications, alerts' },
        { name: 'Mail', icon: Mail, usage: 'Email, messages' },
        { name: 'MessageCircle', icon: MessageCircle, usage: 'Chat, comments' },
        { name: 'MessageSquare', icon: MessageSquare, usage: 'Feedback, dialogue' },
        { name: 'Phone', icon: Phone, usage: 'Call, contact number' },
        { name: 'Send', icon: Send, usage: 'Submit, send message' },
        { name: 'Inbox', icon: Inbox, usage: 'Inbox, received items' },
      ],
    },
    {
      name: 'Status & Feedback',
      icons: [
        { name: 'CheckCircle', icon: CheckCircle, usage: 'Success, verified, approved' },
        { name: 'XCircle', icon: XCircle, usage: 'Error, rejected, failed' },
        { name: 'AlertCircle', icon: AlertCircle, usage: 'Warning, important info' },
        { name: 'AlertTriangle', icon: AlertTriangle, usage: 'Caution, risk' },
        { name: 'Info', icon: Info, usage: 'Information, help text' },
        { name: 'HelpCircle', icon: HelpCircle, usage: 'Help, support, FAQ' },
        { name: 'Clock', icon: Clock, usage: 'Pending, waiting, time' },
        { name: 'Zap', icon: Zap, usage: 'Fast, instant, power' },
      ],
    },
    {
      name: 'Documents & Files',
      icons: [
        { name: 'FileText', icon: FileText, usage: 'Documents, certificates' },
        { name: 'File', icon: File, usage: 'Generic file' },
        { name: 'Folder', icon: Folder, usage: 'Directory, collection' },
        { name: 'Upload', icon: Upload, usage: 'Upload document' },
        { name: 'Download', icon: Download, usage: 'Download file' },
        { name: 'Save', icon: Save, usage: 'Save draft, bookmark' },
        { name: 'Archive', icon: Archive, usage: 'Archive, store' },
        { name: 'Clipboard', icon: Clipboard, usage: 'Copy, paste' },
      ],
    },
    {
      name: 'Actions',
      icons: [
        { name: 'Plus', icon: Plus, usage: 'Add, create new' },
        { name: 'Minus', icon: Minus, usage: 'Remove, subtract' },
        { name: 'Edit', icon: Edit, usage: 'Edit, modify' },
        { name: 'Trash2', icon: Trash2, usage: 'Delete, remove' },
        { name: 'Check', icon: Check, usage: 'Confirm, select' },
        { name: 'X', icon: X, usage: 'Close, cancel, dismiss' },
        { name: 'Filter', icon: Filter, usage: 'Filter results' },
        { name: 'RefreshCw', icon: RefreshCw, usage: 'Refresh, reload' },
        { name: 'Copy', icon: Copy, usage: 'Duplicate, copy' },
        { name: 'Share', icon: Share, usage: 'Share, export' },
      ],
    },
    {
      name: 'Data & Analytics',
      icons: [
        { name: 'BarChart3', icon: BarChart3, usage: 'Statistics, analytics' },
        { name: 'PieChart', icon: PieChart, usage: 'Distribution, breakdown' },
        { name: 'TrendingUp', icon: TrendingUp, usage: 'Growth, increase' },
        { name: 'TrendingDown', icon: TrendingDown, usage: 'Decline, decrease' },
        { name: 'Target', icon: Target, usage: 'Goal, objective' },
        { name: 'Award', icon: Award, usage: 'Achievement, certification' },
        { name: 'Trophy', icon: Trophy, usage: 'Success, winner' },
      ],
    },
    {
      name: 'Location & Maps',
      icons: [
        { name: 'MapPin', icon: MapPin, usage: 'Location, address' },
        { name: 'Globe', icon: Globe, usage: 'Website, international' },
        { name: 'Flag', icon: Flag, usage: 'Report, mark' },
      ],
    },
    {
      name: 'Devices',
      icons: [
        { name: 'Smartphone', icon: Smartphone, usage: 'Mobile app, phone' },
        { name: 'Tablet', icon: Tablet, usage: 'Tablet view' },
        { name: 'Monitor', icon: Monitor, usage: 'Desktop, screen' },
        { name: 'Camera', icon: Camera, usage: 'Take photo, scan' },
        { name: 'Printer', icon: Printer, usage: 'Print document' },
      ],
    },
    {
      name: 'Financial',
      icons: [
        { name: 'Wallet', icon: Wallet, usage: 'DigiLocker, wallet' },
        { name: 'CreditCard', icon: CreditCard, usage: 'Payment, card' },
        { name: 'ShoppingCart', icon: ShoppingCart, usage: 'Services cart' },
        { name: 'Tag', icon: Tag, usage: 'Price, label' },
        { name: 'Gift', icon: Gift, usage: 'Benefit, reward' },
      ],
    },
    {
      name: 'Appearance',
      icons: [
        { name: 'Sun', icon: Sun, usage: 'Light mode' },
        { name: 'Moon', icon: Moon, usage: 'Dark mode' },
        { name: 'Eye', icon: Eye, usage: 'View, visible' },
        { name: 'EyeOff', icon: EyeOff, usage: 'Hide, invisible' },
        { name: 'Star', icon: Star, usage: 'Favorite, rating' },
        { name: 'Heart', icon: Heart, usage: 'Like, favorite' },
      ],
    },
    {
      name: 'System',
      icons: [
        { name: 'Wifi', icon: Wifi, usage: 'Connected, online' },
        { name: 'WifiOff', icon: WifiOff, usage: 'Offline, no connection' },
        { name: 'Battery', icon: Battery, usage: 'Power, battery level' },
        { name: 'BatteryCharging', icon: BatteryCharging, usage: 'Charging' },
        { name: 'Volume2', icon: Volume2, usage: 'Sound on' },
        { name: 'VolumeX', icon: VolumeX, usage: 'Muted' },
      ],
    },
  ];

  return (
    <div className="min-h-full bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Iconography Library</h1>
          <p className="text-muted-foreground">Complete icon set with usage guidelines</p>
        </div>

        {/* Icon System Overview */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Icon System Guidelines</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Library</h3>
              <p className="text-sm text-muted-foreground mb-2">Lucide React</p>
              <code className="text-xs bg-muted px-2 py-1 rounded">npm install lucide-react</code>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Default Size</h3>
              <p className="text-sm text-muted-foreground mb-2">20px × 20px (w-5 h-5)</p>
              <p className="text-xs text-muted-foreground">Scale: 16px, 20px, 24px, 32px</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Stroke Width</h3>
              <p className="text-sm text-muted-foreground mb-2">2px (default)</p>
              <p className="text-xs text-muted-foreground">Consistent across all icons</p>
            </div>
          </div>
        </div>

        {/* Size Examples */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Icon Sizes</h2>
          <div className="flex items-end gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mb-3">
                <Home className="w-4 h-4" />
              </div>
              <p className="text-sm font-medium mb-1">Small</p>
              <p className="text-xs text-muted-foreground">16px (w-4 h-4)</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mb-3">
                <Home className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium mb-1">Default</p>
              <p className="text-xs text-muted-foreground">20px (w-5 h-5)</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mb-3">
                <Home className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium mb-1">Medium</p>
              <p className="text-xs text-muted-foreground">24px (w-6 h-6)</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mb-3">
                <Home className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium mb-1">Large</p>
              <p className="text-xs text-muted-foreground">32px (w-8 h-8)</p>
            </div>
          </div>
        </div>

        {/* Color Usage */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Color Usage</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Primary', color: 'text-primary', bg: 'bg-primary/10' },
              { name: 'Success', color: 'text-success', bg: 'bg-success/10' },
              { name: 'Warning', color: 'text-warning', bg: 'bg-warning/10' },
              { name: 'Destructive', color: 'text-destructive', bg: 'bg-destructive/10' },
              { name: 'Muted', color: 'text-muted-foreground', bg: 'bg-muted' },
              { name: 'Foreground', color: 'text-foreground', bg: 'bg-muted' },
              { name: 'Info', color: 'text-info', bg: 'bg-info/10' },
              { name: 'White', color: 'text-white', bg: 'bg-primary' },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className={`w-16 h-16 ${item.bg} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                  <CheckCircle className={`w-6 h-6 ${item.color}`} />
                </div>
                <p className="text-sm font-medium">{item.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Icon Categories */}
        {iconCategories.map((category, catIndex) => (
          <div key={catIndex} className="bg-card border border-border rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6">{category.name}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {category.icons.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-xs font-medium text-center mb-1">{item.name}</p>
                    <p className="text-xs text-muted-foreground text-center">{item.usage}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Usage Examples */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-6">Usage Examples</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">In Buttons</h3>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add New
                </button>
                <button className="px-4 py-2 bg-success text-success-foreground rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">In Cards</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-border rounded-lg">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-1">Documents</h4>
                  <p className="text-sm text-muted-foreground">8 verified</p>
                </div>
                <div className="p-4 border border-border rounded-lg">
                  <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center mb-3">
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                  <h4 className="font-semibold mb-1">Approved</h4>
                  <p className="text-sm text-muted-foreground">12 applications</p>
                </div>
                <div className="p-4 border border-border rounded-lg">
                  <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center mb-3">
                    <Clock className="w-5 h-5 text-warning" />
                  </div>
                  <h4 className="font-semibold mb-1">Pending</h4>
                  <p className="text-sm text-muted-foreground">3 items</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">In Navigation</h3>
              <nav className="space-y-2">
                {[
                  { icon: Home, label: 'Dashboard' },
                  { icon: FileText, label: 'Applications' },
                  { icon: Wallet, label: 'DigiLocker' },
                  { icon: Settings, label: 'Settings' },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={index}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
