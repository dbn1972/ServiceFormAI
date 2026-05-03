# 📐 ServiceFormAI OS: Asset & Design Guidelines
**Logo, Banner, Image Specifications**  
**Date:** April 30, 2026  
**Version:** 1.0

---

## 🎯 Overview

This guide provides specifications for all visual assets used in ServiceFormAI OS, ensuring optimal display across all devices and platforms.

---

## 📱 Responsive Breakpoints

### **Device Specifications**

| Device | Width | Height | Scale | Use Case |
|--------|-------|--------|-------|----------|
| **Mobile (Small)** | 375px | 667px | 1x, 2x | iPhone SE, Small Android |
| **Mobile (Medium)** | 414px | 896px | 2x, 3x | iPhone 12/13/14, Standard Android |
| **Tablet** | 768px | 1024px | 2x | iPad, Android tablets |
| **Desktop (HD)** | 1440px | 900px | 1x | Standard laptops |
| **Desktop (Full HD)** | 1920px | 1080px | 1x | Large monitors |
| **Desktop (4K)** | 3840px | 2160px | 2x | High-res displays |

### **Breakpoints in CSS**
```css
/* Mobile first */
@media (min-width: 640px)  { /* Mobile landscape / Small tablet */ }
@media (min-width: 768px)  { /* Tablet portrait */ }
@media (min-width: 1024px) { /* Tablet landscape / Small desktop */ }
@media (min-width: 1280px) { /* Desktop */ }
@media (min-width: 1536px) { /* Large desktop */ }
```

---

## 🏢 Logo Specifications

### **Department Logo**

**Primary Logo (Square)**
- **Format:** PNG (with transparency) or SVG (preferred)
- **Size:** 512×512px (1x), 1024×1024px (2x for retina)
- **Aspect Ratio:** 1:1 (square)
- **File Size:** Max 2MB (PNG), Max 500KB (SVG)
- **Color Space:** RGB (for screen)
- **Background:** Transparent

**Use Cases:**
- Header navigation (64×64px displayed)
- Favicon (16×16px, 32×32px, 48×48px)
- App icons (180×180px for iOS, 192×192px for Android)
- Social media profile pictures

**Example:**
```
Logo-Square-512.png   (512×512px, ~150KB)
Logo-Square-1024.png  (1024×1024px, ~400KB, for retina)
Logo.svg              (Vector, ~50KB, preferred)
```

---

**Horizontal Logo (Wide)**
- **Format:** PNG or SVG
- **Size:** 1200×400px (3:1 ratio)
- **Aspect Ratio:** 3:1 to 4:1 recommended
- **File Size:** Max 2MB
- **Background:** Transparent

**Use Cases:**
- Email headers
- PDF certificates
- Print materials
- Wide banner placements

**Example:**
```
Logo-Horizontal-1200x400.png
Logo-Horizontal.svg
```

---

### **Logo Clear Space**

Maintain clear space around logo equal to **X** (height of logo):

```
┌─────────────────────────┐
│         X               │
│    X ┌─────┐ X          │
│      │LOGO │            │
│    X └─────┘ X          │
│         X               │
└─────────────────────────┘
```

Minimum clear space: **20px on all sides**

---

### **Logo Safe Zones**

**Display Sizes:**
```
Minimum size:  40×40px (mobile)
Small:         48×48px (tablet)
Medium:        64×64px (desktop header)
Large:         128×128px (splash screens)
Extra Large:   256×256px (app stores)
```

**Text next to logo:**
- Minimum spacing between logo and text: **12px**
- Logo should never be smaller than text height

---

## 🖼️ Banner & Hero Images

### **Hero Banner (Homepage)**

**Desktop**
- **Size:** 1920×600px (recommended), 1920×800px (tall)
- **Aspect Ratio:** 16:5 (3.2:1) or 16:6 (2.67:1)
- **Format:** JPG (photos), PNG (with text), WebP (optimized)
- **File Size:** Max 500KB (compressed)
- **Safe Zone:** Center 1400×400px for critical content

**Tablet**
- **Size:** 1024×512px
- **Aspect Ratio:** 2:1
- **File Size:** Max 300KB

**Mobile**
- **Size:** 768×512px or 640×480px
- **Aspect Ratio:** 3:2 or 4:3
- **File Size:** Max 200KB

**Example Assets:**
```
hero-desktop-1920x600.jpg   (max 500KB)
hero-tablet-1024x512.jpg    (max 300KB)
hero-mobile-768x512.jpg     (max 200KB)
```

---

### **Service Card Thumbnails**

**Standard Size**
- **Size:** 400×300px (4:3 ratio)
- **Format:** JPG or PNG
- **File Size:** Max 100KB
- **Retina:** 800×600px (for 2x displays)

**Wide Format**
- **Size:** 600×400px (3:2 ratio)
- **Format:** JPG or PNG
- **File Size:** Max 150KB

**Square Format**
- **Size:** 400×400px (1:1 ratio)
- **Format:** JPG or PNG
- **File Size:** Max 100KB

**Critical:** All service thumbnails should maintain consistent aspect ratio across the platform.

---

## 📄 Document Icons

### **Document Type Icons**

**Size:** 64×64px (displayed), 128×128px (source)
**Format:** SVG (preferred) or PNG with transparency
**Style:** Line icons, 2px stroke, rounded corners

**Common Types:**
- PDF: Red (#DC2626)
- JPG/PNG: Blue (#2563EB)
- DOC/DOCX: Navy (#1E3A8A)
- XLS/XLSX: Green (#059669)
- ZIP: Gray (#6B7280)

---

## 👤 Profile Images & Avatars

### **User Avatars**

**Sizes (all square 1:1):**
- **Thumbnail:** 40×40px (chat, comments)
- **Small:** 64×64px (lists)
- **Medium:** 128×128px (profile cards)
- **Large:** 256×256px (profile page)

**Format:** JPG or PNG
**File Size:** Max 200KB
**Processing:** Auto-crop to circle

**Fallback:** Initials on colored background (if no image)

---

## 🎨 Background Patterns

### **Page Backgrounds**

**Full-width background:**
- **Size:** 1920×1080px minimum
- **Pattern:** Tileable (if repeating)
- **File Size:** Max 300KB
- **Opacity:** 5-15% recommended
- **Format:** PNG (with transparency) or SVG

**Subtle textures:**
- **Size:** 200×200px to 500×500px (tileable)
- **File Size:** Max 50KB
- **Format:** PNG or WebP

---

## 📊 Charts & Infographics

### **Chart Images**

**Size:** 800×600px (standard), 1200×900px (detailed)
**Format:** PNG or SVG
**File Size:** Max 300KB
**DPI:** 72 (screen), 300 (print)

### **Infographics**

**Width:** 800px to 1200px
**Height:** Variable (maintain readability)
**Format:** PNG or SVG
**File Size:** Max 500KB

---

## 📱 App & Platform Icons

### **Favicon**

**Sizes Required:**
- 16×16px (browser tab)
- 32×32px (bookmark bar)
- 48×48px (Windows)
- 96×96px (Android Chrome)
- 180×180px (iOS Safari)
- 192×192px (Android home screen)
- 512×512px (PWA splash)

**Format:** ICO (multi-size) or PNG
**File:** `favicon.ico` and individual PNGs

---

### **Social Media Share Images**

**Open Graph (Facebook, LinkedIn)**
- **Size:** 1200×630px
- **Aspect Ratio:** 1.91:1
- **Format:** JPG or PNG
- **File Size:** Max 300KB
- **Safe Zone:** Avoid text in outer 10% of image

**Twitter Card**
- **Size:** 1200×675px (or 1200×630px)
- **Aspect Ratio:** 16:9 or 1.91:1
- **Format:** JPG or PNG
- **File Size:** Max 300KB

**WhatsApp Link Preview**
- **Size:** 400×400px (square)
- **Format:** JPG
- **File Size:** Max 100KB

---

## 🖨️ Print Materials

### **PDF Certificates**

**Page Size:** A4 (210×297mm) or Letter (8.5×11 inches)
**DPI:** 300
**Color Space:** CMYK (for print)
**Bleed:** 3mm on all sides
**Safe Zone:** 10mm margin from edge

### **Letterhead**

**Size:** A4 (210×297mm)
**Header Logo:** Max 150mm wide × 40mm tall
**Footer:** Max 200mm wide × 30mm tall
**DPI:** 300

---

## 🎨 Color Guidelines

### **Logo Colors**

**Primary Logo:**
- Full color (on light backgrounds)
- White version (on dark/colored backgrounds)
- Black version (for print/monochrome)
- Single color (department brand color)

**Do NOT:**
- Distort or stretch logo
- Add effects (shadows, gradients, etc.)
- Change colors (except approved variations)
- Rotate or skew logo

---

### **Brand Color Usage**

**Primary Color:** Headers, buttons, links
**Secondary Color:** Accents, highlights
**Neutral Colors:** Text, backgrounds
**Semantic Colors:**
- Success: #10B981 (green)
- Warning: #F59E0B (amber)
- Error: #EF4444 (red)
- Info: #3B82F6 (blue)

---

## 📐 Accessibility Guidelines

### **Contrast Ratios (WCAG 2.1 AA)**

**Text:**
- Normal text (16px+): Min 4.5:1 contrast
- Large text (24px+): Min 3:1 contrast
- UI elements: Min 3:1 contrast

**Logo:**
- Should work on both light and dark backgrounds
- Provide high-contrast version if needed

---

### **Image Alt Text**

**Required for:**
- All informational images
- Charts and graphs
- Infographics
- Icons with meaning

**Not required for:**
- Purely decorative images
- Images with adjacent text description

**Format:**
```html
<img src="logo.png" alt="Maharashtra State Government logo" />
<img src="chart.png" alt="Bar chart showing 92% approval rate for 2026" />
<img src="decorative-pattern.png" alt="" role="presentation" />
```

---

## 📦 File Naming Conventions

### **Logo Files**
```
logo-square-512.png
logo-square-1024.png
logo-horizontal-1200x400.png
logo-white-512.png
logo-black-512.png
logo.svg
```

### **Banner Files**
```
hero-desktop-1920x600.jpg
hero-tablet-1024x512.jpg
hero-mobile-768x512.jpg
service-thumbnail-scholarship-400x300.jpg
```

### **Icons**
```
icon-pdf-64.svg
icon-document-128.png
icon-user-avatar-256.jpg
```

**Naming Pattern:**
```
[type]-[variant]-[size].[ext]
```

---

## ✅ Pre-Publication Checklist

Before publishing, verify:

### **Logo**
- [ ] Square logo uploaded (512×512px minimum)
- [ ] Logo has transparent background
- [ ] Logo displays correctly on light and dark backgrounds
- [ ] File size under 2MB

### **Banners**
- [ ] Desktop banner (1920×600px)
- [ ] Tablet banner (1024×512px)
- [ ] Mobile banner (768×512px)
- [ ] All banners compressed (under 500KB each)

### **Responsive Testing**
- [ ] Mobile preview (375px) looks good
- [ ] Tablet preview (768px) looks good
- [ ] Desktop preview (1440px) looks good
- [ ] Text is readable on all devices
- [ ] Images don't overflow or distort

### **Accessibility**
- [ ] Alt text added to all images
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Logo works in grayscale
- [ ] Text over images is readable

### **Performance**
- [ ] All images compressed/optimized
- [ ] Total page size under 3MB
- [ ] Images use modern formats (WebP, SVG)
- [ ] Lazy loading enabled for below-fold images

---

## 🛠️ Recommended Tools

### **Image Optimization**
- **TinyPNG** - PNG/JPG compression (https://tinypng.com)
- **Squoosh** - Modern format conversion (https://squoosh.app)
- **ImageOptim** - Mac app for batch optimization
- **SVGOMG** - SVG optimization (https://jakearchibald.github.io/svgomg/)

### **Design Tools**
- **Figma** - UI design and export
- **Adobe Illustrator** - Logo creation (SVG)
- **Photoshop** - Photo editing and optimization
- **Canva** - Quick graphics and social media images

### **Testing Tools**
- **Responsive Preview** - Built into ServiceFormAI (see below)
- **Chrome DevTools** - Device emulation
- **WebAIM Contrast Checker** - Color contrast testing
- **PageSpeed Insights** - Performance testing

---

## 📱 Using Responsive Preview

ServiceFormAI includes built-in responsive preview:

**Access from:**
1. Service Creation Wizard → Step 5 (Review)
2. White-Label Settings → Preview sidebar
3. Template Browser → Preview button

**Features:**
- ✅ Mobile preview (375px - iPhone SE)
- ✅ Tablet preview (768px - iPad)
- ✅ Desktop preview (1440px - Standard)
- ✅ Fullscreen preview
- ✅ Real-time device switching
- ✅ Exact pixel dimensions shown

**Keyboard Shortcuts:**
- `M` - Switch to Mobile
- `T` - Switch to Tablet
- `D` - Switch to Desktop
- `F` - Fullscreen mode

---

## 📊 Quick Reference Table

| Asset Type | Size | Format | Max Size | Use |
|------------|------|--------|----------|-----|
| **Logo Square** | 512×512px | PNG/SVG | 2MB | Headers, icons |
| **Logo Horizontal** | 1200×400px | PNG/SVG | 2MB | Emails, print |
| **Hero Desktop** | 1920×600px | JPG/WebP | 500KB | Homepage banner |
| **Hero Mobile** | 768×512px | JPG/WebP | 200KB | Mobile banner |
| **Service Thumbnail** | 400×300px | JPG/PNG | 100KB | Service cards |
| **Avatar** | 128×128px | JPG/PNG | 200KB | User profiles |
| **Favicon** | 192×192px | PNG | 50KB | Browser icon |
| **OG Image** | 1200×630px | JPG/PNG | 300KB | Social sharing |
| **PDF Certificate** | A4, 300 DPI | PDF | 2MB | Certificates |

---

## 🎯 Summary

**Key Takeaways:**
1. ✅ Logo: 512×512px square, PNG/SVG, transparent
2. ✅ Banners: Responsive sizes (1920, 1024, 768px wide)
3. ✅ Compress all images (JPG <500KB, PNG <300KB)
4. ✅ Test on all 3 devices before publishing
5. ✅ Maintain 4.5:1 color contrast
6. ✅ Use modern formats (WebP, SVG)

**Built-in Tools:**
- Responsive preview at every step
- Image size validation
- Compression recommendations
- Accessibility checks

---

*For live preview, use ServiceFormAI's built-in Responsive Preview component*
