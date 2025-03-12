
import { cn } from "@/lib/utils";
import {
  User,
  Ticket,
  CalendarDays,
  ScanLine,
  X
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
      <aside
        className={`fixed md:relative w-64 h-screen bg-card border-r border-border transition-transform duration-300 ease-in-out z-50 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-4 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-primary">Dashboard</h2>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  activeSection === item.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>
    );
  };

export default Sidebar