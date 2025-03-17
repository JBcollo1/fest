import { cn } from "@/lib/utils";
import {
  User,
  Ticket,
  CalendarDays,
  ScanLine,
  X,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";

const Sidebar = ({ activeSection, setActiveSection, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const menuItems = [
    { id: "profile", label: "Profile", icon: User },
    { id: "tickets", label: "My Tickets", icon: Ticket },
    { id: "organized", label: "Organized Events", icon: CalendarDays },
    { id: "scanner", label: "QR Scanner", icon: ScanLine },
  ];

  return (
    <>
      {/* Mobile menu toggle button - shown only on small screens */}
      <Button 
        variant="outline" 
        size="icon" 
        className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg z-40 md:hidden bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={() => setIsMobileMenuOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>
    
      {/* Sidebar overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    
      <aside
        className={cn(
          "fixed md:relative w-72 h-screen bg-card border-r border-border transition-all duration-300 ease-in-out z-50 shadow-md",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-2xl font-bold text-primary tracking-tight">Dashboard</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden hover:bg-muted rounded-full"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    activeSection === item.id 
                      ? "bg-primary text-primary-foreground font-medium shadow-sm" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5",
                    activeSection === item.id ? "" : "opacity-70"
                  )} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </nav>
          
          {/* Footer */}
          <div className="p-4 border-t border-border mt-auto">
            <div className="text-xs text-muted-foreground text-center">
              EventSync Dashboard v1.0
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;