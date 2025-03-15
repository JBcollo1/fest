import { useState } from "react";
import Sidebar from "../components/dashboard/Sidebar";
import UserProfile from "../components/dashboard/UserProfile";
import PurchasedTickets from "../components/dashboard/PurchasedTickets";
// import { OrganizedEvents } from "@/components/dashboard/OrganizedEvents";
// import { QRScanner } from "@/components/dashboard/QRScanner";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState("profile");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return <UserProfile />;
      case "tickets":
        return <PurchasedTickets />;
    //   case "organized":
    //     return <OrganizedEvents />;
    //   case "scanner":
    //     return <QRScanner />;
      default:
        return <UserProfile />;
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      <main className="flex-1 p-4 md:p-6 overflow-auto">
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