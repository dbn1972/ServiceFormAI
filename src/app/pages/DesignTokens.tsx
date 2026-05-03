import { Ruler, Type, Layers, Grid, Box } from 'lucide-react';

export default function DesignTokens() {
  return (
    <div className="min-h-full bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Design Tokens & Specifications</h1>
          <p className="text-muted-foreground">Complete design system specifications for development handoff</p>
        </div>

        {/* Spacing System */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Ruler className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Spacing System</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">8px base unit system (4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px)</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'xs', px: '4px', rem: '0.25rem', usage: 'Tight spacing, icons' },
              { name: 'sm', px: '8px', rem: '0.5rem', usage: 'Compact elements' },
              { name: 'md', px: '16px', rem: '1rem', usage: 'Default spacing' },
              { name: 'lg', px: '24px', rem: '1.5rem', usage: 'Section spacing' },
              { name: 'xl', px: '32px', rem: '2rem', usage: 'Card padding' },
              { name: '2xl', px: '48px', rem: '3rem', usage: 'Page margins' },
              { name: '3xl', px: '64px', rem: '4rem', usage: 'Large sections' },
              { name: '4xl', px: '96px', rem: '6rem', usage: 'Hero spacing' },
            ].map((space, index) => (
              <div key={index} className="p-4 border border-border rounded-lg">
                <div className="mb-3">
                  <div className="bg-primary h-2 rounded" style={{ width: space.px }} />
                </div>
                <p className="font-semibold text-sm mb-1">{space.name}</p>
                <p className="text-xs text-muted-foreground mb-1">{space.px} / {space.rem}</p>
                <p className="text-xs text-muted-foreground">{space.usage}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Typography Scale */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Type className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Typography Scale</h2>
          </div>

          <div className="space-y-6">
            {[
              { name: 'Display', size: '48px', lineHeight: '1.2', weight: '700', usage: 'Hero headings', class: 'text-5xl' },
              { name: 'H1', size: '36px', lineHeight: '1.3', weight: '600', usage: 'Page titles', class: 'text-4xl' },
              { name: 'H2', size: '30px', lineHeight: '1.4', weight: '600', usage: 'Section headings', class: 'text-3xl' },
              { name: 'H3', size: '24px', lineHeight: '1.4', weight: '600', usage: 'Card titles', class: 'text-2xl' },
              { name: 'H4', size: '20px', lineHeight: '1.5', weight: '600', usage: 'Subsection headings', class: 'text-xl' },
              { name: 'Body Large', size: '18px', lineHeight: '1.6', weight: '400', usage: 'Intro text', class: 'text-lg' },
              { name: 'Body', size: '16px', lineHeight: '1.5', weight: '400', usage: 'Default text', class: 'text-base' },
              { name: 'Body Small', size: '14px', lineHeight: '1.5', weight: '400', usage: 'Secondary text', class: 'text-sm' },
              { name: 'Caption', size: '12px', lineHeight: '1.4', weight: '400', usage: 'Labels, helper text', class: 'text-xs' },
            ].map((type, index) => (
              <div key={index} className="flex items-baseline gap-6 pb-6 border-b border-border last:border-0">
                <div className="w-32">
                  <p className="font-semibold text-sm mb-1">{type.name}</p>
                  <p className="text-xs text-muted-foreground">{type.size}</p>
                </div>
                <div className="flex-1">
                  <p className={`${type.class} mb-2`} style={{ fontWeight: type.weight }}>
                    The quick brown fox jumps over the lazy dog
                  </p>
                  <div className="flex gap-6 text-xs text-muted-foreground">
                    <span>Line-height: {type.lineHeight}</span>
                    <span>Weight: {type.weight}</span>
                    <span>Usage: {type.usage}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Border Radius */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Box className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Border Radius</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              { name: 'None', value: '0px', class: 'rounded-none' },
              { name: 'SM', value: '4px', class: 'rounded' },
              { name: 'MD', value: '8px', class: 'rounded-lg' },
              { name: 'LG', value: '12px', class: 'rounded-xl' },
              { name: 'XL', value: '16px', class: 'rounded-2xl' },
              { name: '2XL', value: '24px', class: 'rounded-3xl' },
              { name: 'Full', value: '9999px', class: 'rounded-full' },
            ].map((radius, index) => (
              <div key={index} className="text-center">
                <div className={`w-20 h-20 bg-primary ${radius.class} mx-auto mb-3`} />
                <p className="font-semibold text-sm">{radius.name}</p>
                <p className="text-xs text-muted-foreground">{radius.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Shadows/Elevation */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Layers className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Elevation / Shadows</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { name: 'SM', shadow: '0 1px 2px rgba(0,0,0,0.05)', usage: 'Subtle lift' },
              { name: 'MD', shadow: '0 4px 6px rgba(0,0,0,0.1)', usage: 'Cards' },
              { name: 'LG', shadow: '0 10px 15px rgba(0,0,0,0.1)', usage: 'Dialogs' },
              { name: 'XL', shadow: '0 20px 25px rgba(0,0,0,0.15)', usage: 'Modals' },
            ].map((elev, index) => (
              <div key={index} className="p-6 bg-background rounded-xl" style={{ boxShadow: elev.shadow }}>
                <p className="font-semibold mb-1">{elev.name}</p>
                <p className="text-xs text-muted-foreground mb-3">{elev.usage}</p>
                <code className="text-xs bg-muted px-2 py-1 rounded">{elev.shadow}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Grid System */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Grid className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Grid System</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Breakpoints</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { name: 'Mobile', value: '< 768px', cols: '1 column' },
                  { name: 'Tablet', value: '768px - 1024px', cols: '2-3 columns' },
                  { name: 'Desktop', value: '1024px - 1440px', cols: '3-4 columns' },
                  { name: 'Wide', value: '> 1440px', cols: '4+ columns' },
                ].map((bp, index) => (
                  <div key={index} className="p-4 bg-muted rounded-lg">
                    <p className="font-semibold text-sm mb-1">{bp.name}</p>
                    <p className="text-xs text-muted-foreground mb-2">{bp.value}</p>
                    <p className="text-xs">{bp.cols}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Container Widths</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-3 bg-muted rounded-lg">
                  <span>Mobile</span>
                  <code className="text-xs bg-background px-2 py-1 rounded">100%</code>
                </div>
                <div className="flex justify-between p-3 bg-muted rounded-lg">
                  <span>Tablet (SM)</span>
                  <code className="text-xs bg-background px-2 py-1 rounded">640px</code>
                </div>
                <div className="flex justify-between p-3 bg-muted rounded-lg">
                  <span>Desktop (MD)</span>
                  <code className="text-xs bg-background px-2 py-1 rounded">768px</code>
                </div>
                <div className="flex justify-between p-3 bg-muted rounded-lg">
                  <span>Large (LG)</span>
                  <code className="text-xs bg-background px-2 py-1 rounded">1024px</code>
                </div>
                <div className="flex justify-between p-3 bg-muted rounded-lg">
                  <span>Extra Large (XL)</span>
                  <code className="text-xs bg-background px-2 py-1 rounded">1280px</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Component Specifications */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-6">Component Specifications</h2>

          <div className="space-y-6">
            <div className="border border-border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Button</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Height</p>
                  <p className="font-medium">44px (touch-friendly)</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Padding</p>
                  <p className="font-medium">16px horizontal, 12px vertical</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Border Radius</p>
                  <p className="font-medium">8px (rounded-lg)</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Font</p>
                  <p className="font-medium">16px, weight 500</p>
                </div>
              </div>
            </div>

            <div className="border border-border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Input Field</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Height</p>
                  <p className="font-medium">48px</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Padding</p>
                  <p className="font-medium">16px horizontal, 12px vertical</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Border</p>
                  <p className="font-medium">1px solid, 2px on focus</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Border Radius</p>
                  <p className="font-medium">8px (rounded-lg)</p>
                </div>
              </div>
            </div>

            <div className="border border-border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Card</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Padding</p>
                  <p className="font-medium">24px (1.5rem)</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Border</p>
                  <p className="font-medium">1px solid border-color</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Border Radius</p>
                  <p className="font-medium">12px (rounded-xl)</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Shadow</p>
                  <p className="font-medium">SM (optional)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
