import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
// import Sidebar from "../components/dashboard/Sidebar";
import UserProfile from "../components/dashboard/UserProfile";
import PurchasedTickets from "../components/dashboard/PurchasedTickets";
import OrganizerManagement from "../components/dashboard/OrganizerManagement";
import QRScanner from "../components/dashboard/QRScanner";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import OrganizedEvents from "../components/dashboard/OrganizedEvents";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { User, Ticket, ShieldCheck, Calendar, QrCode } from "lucide-react";

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState("profile");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const [isadmin, setIsadmin] = useState(false);
  
  useEffect(() => {
    if (user && user.roles) {
      setIsadmin(user.roles.includes("admin"));
    }
  }, [user]);
  
  return (
    <div className="relative flex flex-col min-h-screen pt-8">
      <main className="flex-1 p-4 sm:p-6 mt-8 transition-all duration-300 ease-in-out">
       
        
        <Tabs defaultValue={activeSection} onValueChange={setActiveSection} className="w-full">
          <TabsList className="flex flex-wrap justify-center mb-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              My Tickets
            </TabsTrigger>
            {isadmin && (
              <>
                <TabsTrigger value="organizers" className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Manage Organizers
                </TabsTrigger>
                <TabsTrigger value="organized" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  My Events
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="scanner" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              QR Scanner
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <UserProfile />
          </TabsContent>
          
          <TabsContent value="tickets">
            <PurchasedTickets />
          </TabsContent>
          
          {isadmin && (
            <>
              <TabsContent value="organizers">
                <OrganizerManagement />
              </TabsContent>
              
              <TabsContent value="organized">
                <OrganizedEvents />
              </TabsContent>
            </>
          )}
          
          <TabsContent value="scanner">
            <QRScanner />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;