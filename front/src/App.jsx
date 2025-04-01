import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import EventDetail from "./pages/EventDetail";
import NotFound from "./pages/NotFound";
import SignIn from "./pages/Signin";
import SignUp from "./pages/Signup";
import About from "./pages/About";
import Events from "./pages/Event";
import Navbar from "./components/Navbar";
import Footer from "./components/footer";
import Dashboard from "./pages/Dashboard";
import Safari from './pages/Safari';
import CookieConsent from './components/CookieConsent';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Navbar/>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/event/:id" element={<EventDetail />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/about" element={<About />} />
            <Route path="/events" element={<Events />} />
            <Route path="/d" element={<Dashboard />} />
            <Route path="/safari" element={<Safari />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer/>
          <CookieConsent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
