import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from '@/contexts/ThemeContext';

const NotFound = () => {
  const location = useLocation();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-background'} p-4`}>
      <div className={`${isDarkMode ? 'bg-slate-900/90 border border-slate-800' : 'glass'} rounded-xl p-10 max-w-md text-center`}>
        <div className={`w-20 h-20 ${isDarkMode ? 'bg-slate-800' : 'bg-muted'} rounded-full flex items-center justify-center mx-auto mb-6`}>
          <span className="text-4xl font-display font-bold">404</span>
        </div>
        <h1 className="text-2xl font-display font-bold mb-4">Page Not Found</h1>
        <p className={`mb-8 ${isDarkMode ? 'text-white/70' : 'text-muted-foreground'}`}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button asChild className="rounded-full">
          <Link to="/">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
