import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  User,
  Ticket,
  Calendar,
  LogOut,
  X,
  QrCode,
  ShieldCheck,
  Menu,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const Sidebar = ({
  activeSection,
  setActiveSection,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) => {
  const { logout, user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (user && user.roles) {
      setIsAdmin(user.roles.includes("admin"));
      setIsOrganizer(user.roles.includes("organizer"));
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const NavItem = ({ icon, label, value }) => (
    <Button
      variant={activeSection === value ? "default" : "ghost"}
      className={cn(
        "w-full justify-start",
        activeSection === value
          ? "bg-primary text-primary-foreground"
          : "hover:bg-muted"
      )}
      onClick={() => {
        setActiveSection(value);
        closeMobileMenu();
      }}
    >
      {icon}
      {!isCollapsed && <span className="ml-2">{label}</span>}
    </Button>
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsMobileMenuOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>
      
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-card border-r border-border transition-all duration-300 ease-in-out md:relative",
          isCollapsed ? "w-10" : "w-64",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-4">
            {!isCollapsed && <h2 className="text-lg font-semibold">Dashboard</h2>}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={closeMobileMenu}
              >
                <X className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex"
                onClick={toggleSidebar}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-5 w-5" />
                ) : (
                  <ChevronLeft className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
          
          <ScrollArea className="flex-1 px-3">
            <div className="space-y-2 py-2">
              <NavItem
                icon={<User className="h-5 w-5" />}
                label="Profile"
                value="profile"
              />
              <NavItem
                icon={<Ticket className="h-5 w-5" />}
                label="My Tickets"
                value="tickets"
              />
              {isOrganizer && (
                <NavItem
                  icon={<Calendar className="h-5 w-5" />}
                  label="My Events"
                  value="organized"
                />
              )}
              {isAdmin && (
                <NavItem
                  icon={<ShieldCheck className="h-5 w-5" />}
                  label="Manage Organizers"
                  value="organizers"
                />
              )}
              <NavItem
                icon={<QrCode className="h-5 w-5" />}
                label="QR Scanner"
                value="scanner"
              />
            </div>
          </ScrollArea>
          
          <div className="p-4">
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start",
                isCollapsed && "px-2"
              )}
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              {!isCollapsed && <span className="ml-2">Logout</span>}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;