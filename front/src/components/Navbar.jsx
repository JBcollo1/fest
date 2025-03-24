import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, User, Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useNavigate();

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

  return (
    <header 
      className={`fixed top-0 w-full left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'glass bg-accent py-2' : 'bg-accent py-4'
      }`}
    >
      <div className="container  mx-auto px-4 md:px-6">
        <div className="flex items-center  justify-between">
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
            <Button variant="outline" size="sm" className="rounded-full">
              <Search className="h-4 w-4 mr-1" /> Search
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-full">
              <Link to="/signin">
                <User className="h-4 w-4 mr-1" /> Sign In
              </Link>
            </Button>
            <Button asChild size="sm" variant='outline'className="rounded-full">
              <Link to="/signup">Sign Up</Link>
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
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
        <div className="md:hidden glass animate-slide-in-right">
          <div className="container mx-auto px-4 py-6 space-y-8">
            <nav className="flex flex-col space-y-6">
              <Link to="/" className="font-medium text-lg hover:text-primary transition-colors">
                Home
              </Link>
              <Link to="/events" className="font-medium text-lg hover:text-primary transition-colors">
                Events
              </Link>
              <Link to="/about" className="font-medium text-lg hover:text-primary transition-colors">
                About
              </Link>
              <Link to="/contact" className="font-medium text-lg hover:text-primary transition-colors">
                Contact
              </Link>
            </nav>
            <div className="flex flex-col space-y-4">
              <Button variant="outline" className="justify-center">
                <Search className="h-4 w-4 mr-2" /> Search Events
              </Button>
              <Button asChild className="justify-center">
                <Link to="/signin">
                  <User className="h-4 w-4 mr-2" /> Sign In
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-center">
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;