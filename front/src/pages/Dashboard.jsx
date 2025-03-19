import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "../components/dashboard/Sidebar";
import UserProfile from "../components/dashboard/UserProfile";
import PurchasedTickets from "../components/dashboard/PurchasedTickets";
import OrganizerManagement from "../components/dashboard/OrganizerManagement";
import { QRScanner } from "@/components/dashboard/QRScanner";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import OrganizedEvents from "../components/dashboard/OrganizedEvents";

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState("profile");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user && user.roles) {
      setIsAdmin(user.roles.includes("Admin"));
    }
  }, [user]);

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return <UserProfile />;
      case "tickets":
        return <PurchasedTickets />;
      case "organizers":
        return isAdmin ? <OrganizerManagement /> : <UserProfile />;
      case "scanner":
        return <QRScanner />;
      case "organized":
        return <OrganizedEvents />;
   
      default:
        return <UserProfile />;
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      <main className="flex-1 p-6 transition-all duration-300 ease-in-out">
        <div className="md:hidden mb-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard;