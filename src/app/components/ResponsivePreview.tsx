/**
 * Responsive Preview Component
 * Shows mobile, tablet, and desktop views before publishing
 */

import { useState } from 'react';
import { Smartphone, Tablet, Monitor, Maximize2, Eye } from 'lucide-react';

interface ResponsivePreviewProps {
  children: React.ReactNode;
  title?: string;
  url?: string;
}

type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'fullscreen';

const DEVICE_SPECS = {
  mobile: {
    width: 375,
    height: 667,
    label: 'iPhone SE',
    icon: Smartphone,
  },
  tablet: {
    width: 768,
    height: 1024,
    label: 'iPad',
    icon: Tablet,
  },
  desktop: {
    width: 1440,
    height: 900,
    label: 'Desktop',
    icon: Monitor,
  },
  fullscreen: {
    width: '100%',
    height: '100%',
    label: 'Full Screen',
    icon: Maximize2,
  },
};

export default function ResponsivePreview({
  children,
  title = 'Preview',
  url,
}: ResponsivePreviewProps) {
  const [device, setDevice] = useState<DeviceType>('desktop');

  const currentDevice = DEVICE_SPECS[device];
  const Icon = currentDevice.icon;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Preview Header */}
      <div className="border-b border-border bg-muted/30">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">{title}</h3>
            </div>
            {url && (
              <div className="text-xs text-muted-foreground font-mono bg-muted px-3 py-1.5 rounded">
                {url}
              </div>
            )}
          </div>

          {/* Device Selector */}
          <div className="flex items-center gap-2">
            {(Object.keys(DEVICE_SPECS) as DeviceType[]).map((deviceType) => {
              const spec = DEVICE_SPECS[deviceType];
              const DeviceIcon = spec.icon;
              const isActive = device === deviceType;

              return (
                <button
                  key={deviceType}
                  onClick={() => setDevice(deviceType)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <DeviceIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{spec.label}</span>
                  {typeof spec.width === 'number' && (
                    <span className="text-xs opacity-75 hidden md:inline">
                      {spec.width}×{spec.height}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="p-8 bg-muted/20 min-h-[600px] flex items-center justify-center">
        <div
          className={`bg-white shadow-2xl transition-all duration-300 ${
            device === 'fullscreen' ? 'w-full h-full' : 'rounded-xl overflow-hidden'
          }`}
          style={{
            width: device !== 'fullscreen' ? `${currentDevice.width}px` : '100%',
            height: device !== 'fullscreen' ? `${currentDevice.height}px` : '100%',
            maxWidth: '100%',
            maxHeight: device === 'mobile' ? '667px' : device === 'tablet' ? '800px' : 'none',
          }}
        >
          {/* Device Chrome (for mobile/tablet) */}
          {(device === 'mobile' || device === 'tablet') && (
            <div className="bg-gray-900 p-2 flex items-center justify-center">
              <div className="w-16 h-1 bg-gray-700 rounded-full" />
            </div>
          )}

          {/* Content */}
          <div
            className="overflow-auto"
            style={{
              height:
                device === 'mobile'
                  ? '647px'
                  : device === 'tablet'
                  ? '1004px'
                  : device === 'desktop'
                  ? '900px'
                  : '100%',
            }}
          >
            {children}
          </div>
        </div>
      </div>

      {/* Device Info Footer */}
      <div className="border-t border-border bg-muted/30 px-6 py-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">Viewing on:</span>
            <span className="font-medium flex items-center gap-2">
              <Icon className="w-4 h-4" />
              {currentDevice.label}
            </span>
          </div>
          {typeof currentDevice.width === 'number' && (
            <div className="text-muted-foreground">
              {currentDevice.width} × {currentDevice.height}px
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact version for quick preview
 */
export function QuickDevicePreview({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Mobile */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Smartphone className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Mobile (375px)</span>
        </div>
        <div className="border-2 border-gray-300 rounded-lg overflow-hidden" style={{ width: '187px', height: '333px', margin: '0 auto' }}>
          <div className="bg-gray-900 p-1 flex items-center justify-center">
            <div className="w-8 h-0.5 bg-gray-700 rounded-full" />
          </div>
          <div className="overflow-auto h-[313px] scale-50 origin-top-left" style={{ width: '375px', height: '667px' }}>
            {children}
          </div>
        </div>
      </div>

      {/* Tablet */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Tablet className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Tablet (768px)</span>
        </div>
        <div className="border-2 border-gray-300 rounded-lg overflow-hidden" style={{ width: '192px', height: '256px', margin: '0 auto' }}>
          <div className="overflow-auto h-full scale-25 origin-top-left" style={{ width: '768px', height: '1024px' }}>
            {children}
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Monitor className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Desktop (1440px)</span>
        </div>
        <div className="border-2 border-gray-300 rounded-lg overflow-hidden" style={{ width: '240px', height: '150px', margin: '0 auto' }}>
          <div className="overflow-auto h-full scale-[0.1667] origin-top-left" style={{ width: '1440px', height: '900px' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
