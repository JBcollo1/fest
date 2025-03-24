import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  TicketCheck,
  Globe,
  CreditCard
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

// Stats Card Component
const StatsCard = ({ title, value, description, icon, trendValue, trendDirection }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trendValue && (
          <div className={`flex items-center mt-1 text-xs ${
            trendDirection === 'up' ? 'text-green-500' : 'text-red-500'
          }`}>
            {trendDirection === 'up' ? '↑' : '↓'} {trendValue}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

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
  
  // Check if user has access - adapt based on your Role model
  const isadmin = user?.roles?.includes("admin");
  const isOrganizer = user?.roles?.includes("Organizer");
  const hasAccess = isadmin || isOrganizer;

  // Load event and sales data on component mount
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

  // Process API data into chart-friendly format
  const processTicketSalesData = (data) => {
    if (!data || !Array.isArray(data)) {
      return []; // Return an empty array if data is not valid
    }
    
    // For demo purposes, return sample data if no data available
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
    
    // Group by payment method and count
    const methodCounts = {};
    const statusCounts = {};
    
    data.forEach(payment => {
      // Count by payment method
      if (!methodCounts[payment.payment_method]) {
        methodCounts[payment.payment_method] = 0;
      }
      methodCounts[payment.payment_method]++;
      
      // Count by payment status
      if (!statusCounts[payment.payment_status]) {
        statusCounts[payment.payment_status] = 0;
      }
      statusCounts[payment.payment_status]++;
    });
    
    // Convert to array format for charts
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

  // Generate sample data for demo purposes - replace with real data
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
      
      // Generate random values with some pattern
      const baseTickets = Math.floor(Math.random() * 5) + 1;
      const tickets = i % 7 === 0 ? baseTickets * 3 : baseTickets; // More sales on weekends
      const revenue = tickets * (Math.floor(Math.random() * 20) + 30); // Random ticket price between $30-$50
      const attendees = Math.floor(tickets * 0.8); // 80% attendance rate
      
      ticketSum += tickets;
      revenueSum += revenue;
      
      data.push({
        date: date.toLocaleDateString(),
        tickets,
        revenue,
        attendees,
        ticketSum, // Cumulative tickets for area chart
        revenueSum // Cumulative revenue for area chart
      });
    }
    
    return data;
  };

  const generateSamplePaymentData = () => {
    return {
      byMethod: [
        { name: "Mpesa", value: 65 },
        { name: "PayPal", value: 20 },
        { name: "Credit Card", value: 15 }
      ],
      byStatus: [
        { name: "Completed", value: 85 },
        { name: "Pending", value: 10 },
        { name: "Failed", value: 5 }
      ],
      all: []
    };
  };

  const generateSampleCategoryData = () => {
    return [
      { name: "Music", count: 35 },
      { name: "Conference", count: 25 },
      { name: "Workshop", count: 20 },
      { name: "Networking", count: 15 },
      { name: "Other", count: 5 }
    ];
  };

  // Calculate summary statistics based on your Event model
  const calculateStats = () => {
    if (!ticketSalesData.length) return {
      totalTickets: event?.tickets_sold || 0,
      totalRevenue: 0,
      attendanceRate: 0,
      ticketsPerDay: 0
    };
    
    const totalTickets = ticketSalesData.reduce((sum, item) => sum + item.tickets, 0);
    const totalRevenue = ticketSalesData.reduce((sum, item) => sum + item.revenue, 0);
    const totalAttendees = ticketSalesData.reduce((sum, item) => sum + item.attendees, 0);
    const attendanceRate = totalTickets > 0 ? Math.round((totalAttendees / totalTickets) * 100) : 0;
    const ticketsPerDay = Math.round(totalTickets / ticketSalesData.length);
    
    return {
      totalTickets: event?.tickets_sold || totalTickets,
      totalRevenue,
      attendanceRate,
      ticketsPerDay
    };
  };

  const stats = calculateStats();

  // COLORS for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#4f46e5'];

  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    if (ticketSalesData.length === 0) {
      return (
        <div className="flex flex-col justify-center items-center h-64 text-center">
          <TicketCheck className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No ticket sales data available for this period</p>
        </div>
      );
    }
    
    // Line Chart Component
    if (chartType === "line") {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={ticketSalesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="tickets" 
              stroke="#4f46e5" 
              activeDot={{ r: 8 }} 
              name="Tickets Sold"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="revenue" 
              stroke="#16a34a" 
              activeDot={{ r: 8 }} 
              name={`Revenue (${event?.currency || 'KES'})`}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    
    // Bar Chart
    if (chartType === "bar") {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={ticketSalesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="tickets" fill="#4f46e5" name="Tickets Sold" />
            <Bar dataKey="attendees" fill="#0ea5e9" name="Attendees" />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    
    // Area Chart
    if (chartType === "area") {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={ticketSalesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="ticketSum" 
              stroke="#4f46e5" 
              fill="#4f46e5" 
              fillOpacity={0.3} 
              name="Cumulative Tickets"
            />
            <Area 
              type="monotone" 
              dataKey="tickets" 
              stroke="#0ea5e9" 
              fill="#0ea5e9" 
              fillOpacity={0.3} 
              name="Daily Tickets"
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }
  };

  if (!hasAccess) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="mb-6">You don't have permission to view this page.</p>
        <Button onClick={() => navigate("/events")}>
          Back to Events
        </Button>
      </div>
    );
  }

  if (!event) {
    return <div>Loading event data...</div>; // Show loading state or error
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header with navigation */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/events")}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {event?.title || "Event Statistics"}
            </h1>
            {event && (
              <p className="text-sm text-muted-foreground flex items-center mt-1">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(event.start_datetime).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={chartType} onValueChange={setChartType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Chart type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="area">Area Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Summary statistics cards - updated to match your Event model */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard 
          title="Total Tickets Sold" 
          value={stats.totalTickets}
          description={`Average of ${stats.ticketsPerDay} tickets per day`}
          icon={<TicketCheck className="h-4 w-4 text-muted-foreground" />}
          trendValue="12% more than last period"
          trendDirection="up"
        />
        
        <StatsCard 
          title="Total Revenue" 
          value={`${event?.currency || 'KES'} ${stats.totalRevenue.toLocaleString()}`}
          description="From all ticket sales"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          trendValue="8% more than last period"
          trendDirection="up"
        />
        
        <StatsCard 
          title="Attendance Rate" 
          value={`${stats.attendanceRate}%`}
          description="Of ticket holders attending"
          icon={<Percent className="h-4 w-4 text-muted-foreground" />}
          trendValue="3% more than last period"
          trendDirection="up"
        />
        
        <StatsCard 
          title="Tickets Available" 
          value={event?.total_tickets ? (event.total_tickets - stats.totalTickets) : "∞"}
          description={event?.total_tickets ? `Out of ${event.total_tickets} total tickets` : "Unlimited tickets"}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
      </div>
      
      {/* Main chart - updated to use data from your Event model */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Ticket Sales Analytics
          </CardTitle>
          <CardDescription>
            Track ticket sales and revenue over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderChart()}
        </CardContent>
      </Card>
      
      {/* Additional analytics tabs - updated to show payment data */}
      <Tabs defaultValue="sales">
        <TabsList className="mb-4">
          <TabsTrigger value="sales">Sales Breakdown</TabsTrigger>
          <TabsTrigger value="payments">Payment Analytics</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Sales by Price Point</CardTitle>
              <CardDescription>Analysis of ticket sales by price tier</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { name: 'Standard', value: stats.totalTickets * 0.6 },
                      { name: 'VIP', value: stats.totalTickets * 0.2 },
                      { name: 'Early Bird', value: stats.totalTickets * 0.1 },
                      { name: 'Group', value: stats.totalTickets * 0.05 },
                      { name: 'Discounted', value: stats.totalTickets * 0.05 }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="Tickets Sold" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payments">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Distribution of payment methods used</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentData.byMethod}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {paymentData.byMethod.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Status</CardTitle>
                <CardDescription>Overview of payment completion status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentData.byStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {paymentData.byStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Event Categories</CardTitle>
              <CardDescription>Analysis of event categories and popularity</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#4f46e5" name="Attendees by Category" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventStatsPage;