import { useState, useEffect, lazy, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
// import Sidebar from "../components/dashboard/Sidebar";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { User, Ticket, ShieldCheck, Calendar, QrCode } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

// Lazy load components
const UserProfile = lazy(() => import("../components/dashboard/UserProfile"));
const PurchasedTickets = lazy(() => import("../components/dashboard/PurchasedTickets"));
const OrganizerManagement = lazy(() => import("../components/dashboard/OrganizerManagement"));
const QRScanner = lazy(() => import("../components/dashboard/QRScanner"));
const OrganizedEvents = lazy(() => import("../components/dashboard/OrganizedEvents"));

const Dashboard = () => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("profile");
  
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const { isDarkMode } = useTheme();
  
  useEffect(() => {
    if (user && user.roles) {
      setIsAdmin(user.roles.includes("admin"));
      setIsOrganizer(user.roles.includes("organizer"));
    }
  }, [user]);
  
  // Set active tab based on URL parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    
    if (tabParam && ['profile', 'tickets', 'organized', 'organizers', 'scanner'].includes(tabParam)) {
      setActiveSection(tabParam);
    }
  }, [location.search]);

  // Loading component for lazy loaded tabs
  const LoadingFallback = () => (
    <div className="flex justify-center items-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ticketBlue"></div>
    </div>
  );
  
  return (
    <div className={`relative flex flex-col min-h-screen pt-8 ${isDarkMode ? 'bg-slate-950' : ''}`}>
      <Tabs defaultValue={activeSection} value={activeSection} onValueChange={setActiveSection} className="flex-1 p-4 sm:p-6 mt-8 transition-all duration-300 ease-in-out">
        <div className="flex justify-center mb-8 overflow-x-auto">
          <TabsList className={`flex flex-wrap sm:flex-nowrap ${isDarkMode ? 'bg-slate-900' : 'bg-gray-100'}`}>
            <TabsTrigger 
              value="profile" 
              className={`data-[state=active]:bg-secondary data-[state=active]:text-white px-4 sm:px-8 py-3 flex items-center gap-2 ${isDarkMode ? 'text-slate-300 hover:text-white' : ''}`}
            >
              <User className="h-4 w-4" />
              <span className="sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger 
              value="tickets" 
              className={`data-[state=active]:bg-secondary data-[state=active]:text-white px-4 sm:px-8 py-3 flex items-center gap-2 ${isDarkMode ? 'text-slate-300 hover:text-white' : ''}`}
            >
              <Ticket className="h-4 w-4" />
              <span className="sm:inline">My Tickets</span>
            </TabsTrigger>
            {(isAdmin || isOrganizer) && (
              <TabsTrigger 
                value="organized" 
                className={`data-[state=active]:bg-secondary data-[state=active]:text-white px-4 sm:px-8 py-3 flex items-center gap-2 ${isDarkMode ? 'text-slate-300 hover:text-white' : ''}`}
              >
                <Calendar className="h-4 w-4" />
                <span className="sm:inline">My Events</span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <>
                <TabsTrigger 
                  value="organizers" 
                  className={`data-[state=active]:bg-secondary data-[state=active]:text-white px-4 sm:px-8 py-3 flex items-center gap-2 ${isDarkMode ? 'text-slate-300 hover:text-white' : ''}`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span className="sm:inline">Manage Organizers</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="scanner" 
                  className={`data-[state=active]:bg-secondary data-[state=active]:text-white px-4 sm:px-8 py-3 flex items-center gap-2 ${isDarkMode ? 'text-slate-300 hover:text-white' : ''}`}
                >
                  <QrCode className="h-4 w-4" />
                  <span className="sm:inline">QR Scanner</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </div>
        
        <TabsContent value="profile" className="animate-fade-in">
          <div className={`rounded-xl shadow-sm p-6 ${isDarkMode ? 'bg-slate-950/90 border-slate-800' : 'bg-white border-gray-100'}`}>
            <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-ticketBlue'}`}>Your Profile</h2>
            <Suspense fallback={<LoadingFallback />}>
              <UserProfile />
            </Suspense>
          </div>
        </TabsContent>
        
        <TabsContent value="tickets" className="animate-fade-in">
          <div className={`rounded-xl shadow-sm p-6 ${isDarkMode ? 'bg-slate-950/90 border-slate-800' : 'bg-white border-gray-100'}`}>
            <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-ticketBlue'}`}>Your Tickets</h2>
            <Suspense fallback={<LoadingFallback />}>
              <PurchasedTickets />
            </Suspense>
          </div>
        </TabsContent>
        
        {(isAdmin || isOrganizer) && (
          <TabsContent value="organized" className="animate-fade-in">
            <div className={`rounded-xl shadow-sm p-6 ${isDarkMode ? 'bg-slate-950/90 border-slate-800' : 'bg-white border-gray-100'}`}>
              <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-ticketBlue'}`}>My Events</h2>
              <Suspense fallback={<LoadingFallback />}>
                <OrganizedEvents />
              </Suspense>
            </div>
          </TabsContent>
        )}
        
        {isAdmin && (
          <>
            <TabsContent value="organizers" className="animate-fade-in">
              <div className={`rounded-xl shadow-sm p-6 ${isDarkMode ? 'bg-slate-950/90 border-slate-800' : 'bg-white border-gray-100'}`}>
                <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-ticketBlue'}`}>Manage Organizers</h2>
                <Suspense fallback={<LoadingFallback />}>
                  <OrganizerManagement />
                </Suspense>
              </div>
            </TabsContent>
            
            <TabsContent value="scanner" className="animate-fade-in">
              <div className={`rounded-xl shadow-sm p-6 ${isDarkMode ? 'bg-slate-950/90 border-slate-800' : 'bg-white border-gray-100'}`}>
                <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-ticketBlue'}`}>QR Scanner</h2>
                <Suspense fallback={<LoadingFallback />}>
                  <QRScanner />
                </Suspense>
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default Dashboard;