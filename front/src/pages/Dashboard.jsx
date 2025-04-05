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
  
  const { user } = useAuth();
  const [isadmin, setIsadmin] = useState(false);
  
  useEffect(() => {
    if (user && user.roles) {
      setIsadmin(user.roles.includes("admin"));
    }
  }, [user]);
  
 return (
  <div className="relative flex flex-col min-h-screen pt-8">

      <Tabs defaultValue={activeSection} onValueChange={setActiveSection} className="flex-1 p-4 sm:p-6 mt-8 transition-all duration-300 ease-in-out">
        <div className="flex justify-center mb-8 overflow-x-auto">
          <TabsList className="bg-gray-100 flex flex-wrap sm:flex-nowrap">
            <TabsTrigger 
              value="profile" 
              className="data-[state=active]:bg-secondary data-[state=active]:text-white px-4 sm:px-8 py-3 flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              <span className=" sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger 
              value="tickets" 
              className="data-[state=active]:bg-ticketBlue data-[state=active]:text-white px-4 sm:px-8 py-3 flex items-center gap-2"
            >
              <Ticket className="h-4 w-4" />
              <span className=" sm:inline">My Tickets</span>
            </TabsTrigger>
            {isadmin && (
              <>
                <TabsTrigger 
                  value="organizers" 
                  className="data-[state=active]:bg-ticketBlue data-[state=active]:text-white px-4 sm:px-8 py-3 flex items-center gap-2"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span className=" sm:inline">Manage Organizers</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="organized" 
                  className="data-[state=active]:bg-ticketBlue data-[state=active]:text-white px-4 sm:px-8 py-3 flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span className=" sm:inline">My Events</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="scanner" 
                  className="data-[state=active]:bg-ticketBlue data-[state=active]:text-white px-4 sm:px-8 py-3 flex items-center gap-2"
                >
                  <QrCode className="h-4 w-4" />
                  <span className=" sm:inline">QR Scanner</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </div>
        
        <TabsContent value="profile" className="animate-fade-in">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-2xl font-bold text-ticketBlue mb-6">Your Profile</h2>
            <UserProfile />
          </div>
        </TabsContent>
        
        <TabsContent value="tickets" className="animate-fade-in">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-2xl font-bold text-ticketBlue mb-6">Your Tickets</h2>
            <PurchasedTickets />
          </div>
        </TabsContent>
        
        {isadmin && (
          <>
            <TabsContent value="organizers" className="animate-fade-in">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-2xl font-bold text-ticketBlue mb-6">Manage Organizers</h2>
                <OrganizerManagement />
              </div>
            </TabsContent>
            
            <TabsContent value="organized" className="animate-fade-in">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-2xl font-bold text-ticketBlue mb-6">My Events</h2>
                <OrganizedEvents />
              </div>
            </TabsContent>
            
            <TabsContent value="scanner" className="animate-fade-in">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-2xl font-bold text-ticketBlue mb-6">QR Scanner</h2>
                <QRScanner />
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default Dashboard;