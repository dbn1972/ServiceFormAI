/**
 * Skip Links Component
 * WCAG 2.1 Success Criterion 2.4.1 - Bypass Blocks
 * Allows keyboard users to skip repetitive navigation
 */

interface SkipLink {
  href: string;
  label: string;
}

const defaultLinks: SkipLink[] = [
  { href: '#main-content', label: 'Skip to main content' },
  { href: '#navigation', label: 'Skip to navigation' },
  { href: '#footer', label: 'Skip to footer' },
];

interface SkipLinksProps {
  links?: SkipLink[];
}

export default function SkipLinks({ links = defaultLinks }: SkipLinksProps) {
  return (
    <div className="skip-links-container">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="skip-to-main"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
