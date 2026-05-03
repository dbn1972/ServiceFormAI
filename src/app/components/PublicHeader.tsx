import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';

export default function PublicHeader() {
  return (
    <nav className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <div className="font-bold text-lg">ServiceFormAI OS</div>
              <div className="text-xs text-muted-foreground hidden sm:block">Government of India</div>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-4">
            <Link to="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden md:inline-block">
              Features
            </Link>
            <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden md:inline-block">
              About
            </Link>
            <Link to="/help" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden md:inline-block">
              Help
            </Link>
            <ThemeToggle />
            <LanguageSelector />
            <Link to="/login" className="text-sm text-foreground hover:text-primary transition-colors">
              Log In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors hidden sm:inline-block"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
