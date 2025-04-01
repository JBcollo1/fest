import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  Calendar, 
  Loader2, 
  TrendingUp, 
  Users, 
  DollarSign,
  Percent,
  TicketCheck
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

// Functions that use imported data

const EventStatsPage = ({ eventId }) => {
  const { user, fetchEventById, fetchEventTicketSales, fetchEventPayments, fetchEventCategories } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [ticketSalesData, setTicketSalesData] = useState([]);
  const [paymentData, setPaymentData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("7d"); // 7d, 30d, 90d, all
  const [chartType, setChartType] = useState("line");
  
  const isadmin = user?.roles?.includes("admin");
  const isOrganizer = user?.roles?.includes("Organizer");
  const hasAccess = isadmin || isOrganizer;

  useEffect(() => {
    if (hasAccess && eventId) {
      loadEventDetails();
      loadTicketSales();
      loadPaymentData();
      loadCategoryData();
    }
  }, [hasAccess, eventId, timeRange]);

  const loadEventDetails = async () => {
    try {
      const response = await fetchEventById(eventId);
      if (response) {
        setEvent(response);
      } else {
        setError("Event not found");
      }
    } catch (error) {
      console.error("Error loading event details:", error);
      setError("Failed to load event details");
      toast({
        title: "Error",
        description: "Failed to load event details",
        variant: "destructive",
      });
    }
  };

  const loadTicketSales = async () => {
    try {
      setLoading(true);
      const response = await fetchEventTicketSales(eventId, timeRange);
      if (response?.data) {
        const formattedData = processTicketSalesData(response.data);
        setTicketSalesData(formattedData);
      } else {
        setTicketSalesData([]);
      }
    } catch (error) {
      console.error("Error loading ticket sales:", error);
      toast({
        title: "Error",
        description: "Failed to load ticket sales data",
        variant: "destructive",
      });
      setTicketSalesData([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentData = async () => {
    try {
      const response = await fetchEventPayments(eventId, timeRange);
      if (response?.data) {
        const formattedData = processPaymentData(response.data);
        setPaymentData(formattedData);
      } else {
        setPaymentData([]);
      }
    } catch (error) {
      console.error("Error loading payment data:", error);
      setPaymentData(generateSamplePaymentData());
    }
  };

  const loadCategoryData = async () => {
    try {
      const response = await fetchEventCategories(eventId);
      if (response?.data) {
        setCategoryData(response.data);
      } else {
        setCategoryData([]);
      }
    } catch (error) {
      console.error("Error loading category data:", error);
      setCategoryData(generateSampleCategoryData());
    }
  };

  const processTicketSalesData = (data) => {
    if (!data || !Array.isArray(data)) {
      return [];
    }
    
    if (!data || !data.length) {
      return generateSampleData(timeRange);
    }
    
    return data.map(item => ({
      date: new Date(item.created_at).toLocaleDateString(),
      tickets: item.quantity || 1,
      revenue: item.amount,
      attendees: item.checked_in ? 1 : 0
    }));
  };

  const processPaymentData = (data) => {
    if (!data || !data.length) {
      return generateSamplePaymentData();
    }
    
    const methodCounts = {};
    const statusCounts = {};
    
    data.forEach(payment => {
      if (!methodCounts[payment.payment_method]) {
        methodCounts[payment.payment_method] = 0;
      }
      methodCounts[payment.payment_method]++;
      
      if (!statusCounts[payment.payment_status]) {
        statusCounts[payment.payment_status] = 0;
      }
      statusCounts[payment.payment_status]++;
    });
    
    const methodData = Object.keys(methodCounts).map(method => ({
      name: method,
      value: methodCounts[method]
    }));
    
    const statusData = Object.keys(statusCounts).map(status => ({
      name: status,
      value: statusCounts[status]
    }));
    
    return {
      byMethod: methodData,
      byStatus: statusData,
      all: data
    };
  };



  const generateSampleData = (range) => {
    let days;
    switch (range) {
      case "7d": days = 7; break;
      case "30d": days = 30; break;
      case "90d": days = 90; break;
      case "all": days = 120; break;
      default: days = 7;
    }
    
    const data = [];
    const now = new Date();
    let ticketSum = 0;
    let revenueSum = 0;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      
      const baseTickets = Math.floor(Math.random() * 5) + 1;
      const tickets = i % 7 === 0 ? baseTickets * 3 : baseTickets;
      const revenue = tickets * (Math.floor(Math.random() * 20) + 30);
      const attendees = Math.floor(tickets * 0.8);
      
      ticketSum += tickets;
      revenueSum += revenue;
      
      data.push({
        date: date.toLocaleDateString(),
        tickets,
        revenue,
        attendees,
        ticketSum,
        revenueSum
      });
    }
    
    return data;
  };
};

export default EventStatsPage;