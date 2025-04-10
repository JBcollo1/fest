import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, Calendar, LogOut, Moon, Sun } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from '@/contexts/ThemeContext';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = async () => {
    await logout();
    location('/');
  };

  return (
    <header 
      className={`fixed top-0 w-full left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'glass bg-accent py-2' : 'glass bg-accent py-4'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <span className="text-xl font-display font-semibold">FikaEvents</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="font-medium hover:text-secondary transition-colors">
              Home
            </Link>
            
            <Link to="/about" className="font-medium hover:text-primary transition-colors">
              About
            </Link>
            <a href="/#safari" className="font-medium hover:text-primary transition-colors">
              Safari
            </a>
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              className={`rounded-full ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : ''}`}
              onClick={toggleTheme}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="rounded-full ">
                    <User className="h-4 w-4 mr-1" /> 
                    {user?.first_name || 'Account'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/d">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/d/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button 
                  asChild 
                  size="sm" 
                  variant="outline" 
                  className={`rounded-full ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : ''}`}
                >
                  <Link to="/signin">
                    <User className="h-4 w-4 mr-1" /> Sign In
                  </Link>
                </Button>
                <Button 
                  asChild 
                  size="sm" 
                  variant='outline'
                  className={`rounded-full ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : ''}`}
                >
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Togle */}
          <button 
            className="md:hidden p-2 rounded-md" 
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className={`md:hidden animate-slide-in-right ${isDarkMode ? 'bg-slate-900/95' : 'glass'}`}>
          <div className="container mx-auto px-4 py-6 space-y-8">
            <nav className="flex flex-col space-y-6">
              <Link to="/" className="font-medium text-lg hover:text-primary transition-colors">
                Home
              </Link>
              <a href="/#safari" className="font-medium hover:text-primary transition-colors">
              Safari
            </a>
              <Link to="/about" className="font-medium text-lg hover:text-primary transition-colors">
                About
              </Link>
              {isAuthenticated && (
                <Link to="/d" className="font-medium text-lg hover:text-primary transition-colors">
                  Dashboard
                </Link>
              )}
            </nav>
            <div className="flex flex-col space-y-4">
              <Button 
                variant="outline" 
                className={`justify-center ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : ''}`}
                onClick={toggleTheme}
                aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDarkMode ? (
                  <>
                    <Sun className="h-4 w-4 mr-2" /> Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 mr-2" /> Dark Mode
                  </>
                )}
              </Button>
              
              {isAuthenticated ? (
                <>
                  <Button 
                    asChild 
                    className={`justify-center ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : ''}`}
                  >
                    <Link to="/d">
                      <User className="h-4 w-4 mr-2" /> Dashboard
                    </Link>
                  </Button>
                  <Button 
                    asChild 
                    className={`justify-center ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : ''}`}
                  >
                    <Link to="/profile">
                      <User className="h-4 w-4 mr-2" /> Profile
                    </Link>
                  </Button>
                  <Button 
                    variant="destructive" 
                    className={`justify-center ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : ''}`}
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    asChild 
                    className={`justify-center ${isDarkMode ? 'bg-primary/90' : ''}`}
                  >
                    <Link to="/signin">
                      <User className="h-4 w-4 mr-2" /> Sign In
                    </Link>
                  </Button>
                  <Button 
                    asChild 
                    variant="outline" 
                    className={`justify-center ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : ''}`}
                  >
                    <Link to="/signup">Sign Up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;