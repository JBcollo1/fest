import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, ComposedChart, Area } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, ArrowUpRight, Ticket, Users, Building, ChevronLeft, ChevronRight, TrendingUp, ShoppingBag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

// Colors for pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28BFF', '#FF6B6B', '#4ECDC4', '#FF9F1C'];

const EventStatsPage = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("month");
  const [platformData, setPlatformData] = useState({
    totalRevenue: 0,
    totalTickets: 0,
    totalUsers: 0,
    activeEvents: 0,
    revenueGrowth: 0,
    ticketGrowth: 0,
    totalEvents: 0,
    upcomingEvents: 0,
    pastEvents: 0,
    ticketsPerEvent: 0,
    revenuePerEvent: 0,
    revenuePerUser: 0,
    soldOutEvents: 0,
    averageTicketPrice: 0
  });
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [eventCategories, setEventCategories] = useState([]);
  const [topEvents, setTopEvents] = useState([]);
  const [topOrganizers, setTopOrganizers] = useState([]);
  const [growthData, setGrowthData] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [dailySales, setDailySales] = useState([]);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsPerPage, setEventsPerPage] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isDarkMode } = useTheme();
  const [isAdmin, setIsAdmin] = useState(false);

  // Memoized axios instance
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    return instance;
  }, []);

  const fetchStatsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is admin or organizer
      if (!user) {
        setError("Please log in to view statistics");
        return;
      }

      // Set isAdmin state based on user role
      const userIsAdmin = user.roles?.includes('admin');
      setIsAdmin(userIsAdmin);

      // Check if user has admin or organizer role
      if (!userIsAdmin && !user.roles?.includes('organizer')) {
        setError("You don't have permission to view these statistics");
        return;
      }

      const response = await api.get(`/api/stats`, {
        params: {
          page: eventsPage,
          per_page: eventsPerPage,
          time_period: timeRange
        }
      });

      if (response.data) {
        // Set platform data
        setPlatformData({
          totalRevenue: response.data.totalRevenue || 0,
          totalTickets: response.data.totalTickets || 0,
          totalUsers: response.data.totalUsers || 0,
          activeEvents: response.data.activeEvents || 0,
          revenueGrowth: response.data.revenueGrowth || 5,
          ticketGrowth: response.data.ticketGrowth || 12,
          totalEvents: response.data.totalEvents || 0,
          upcomingEvents: response.data.upcomingEvents || 0,
          pastEvents: response.data.pastEvents || 0,
          ticketsPerEvent: response.data.ticketsPerEvent || 0,
          revenuePerEvent: response.data.revenuePerEvent || 0,
          revenuePerUser: response.data.revenuePerUser || 0,
          soldOutEvents: response.data.soldOutEvents || 0,
          averageTicketPrice: response.data.averageTicketPrice || 0
        });
        
        // Process chart data
        setMonthlyRevenue(response.data.monthlyRevenue || []);
        
        // Set event categories based on the role
        if (userIsAdmin) {
          setEventCategories(response.data.eventCategories || []);
        } else {
          setTicketTypes(response.data.ticketTypes || []);
        }
        
        // Set top events
        setTopEvents(response.data.topEvents || []);
        
        // Set admin specific data
        if (userIsAdmin) {
          setTopOrganizers(response.data.topOrganizers || []);
          setGrowthData(response.data.growthData || []);
          setPaymentMethods(response.data.paymentMethods || []);
        } else {
          // Set organizer specific data
          setDailySales(response.data.dailySales || []);
        }
        
        // Set pagination info
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      }
    } catch (error) {
      console.error("Error fetching stats data:", error);
      if (error.response?.status === 403) {
        setError("You don't have permission to view these statistics");
      } else {
        setError("Failed to load dashboard data. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  }, [api, eventsPage, eventsPerPage, timeRange, user]);

  useEffect(() => {
    fetchStatsData();
  }, [fetchStatsData]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setEventsPage(newPage);
    }
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  // Early return for loading state
  if (loading && !platformData.totalRevenue) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ticketBlue"></div>
      </div>
    );
  }

  // Early return for error state
  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={fetchStatsData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(platformData.totalRevenue || 0).toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-500">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              <span>+{platformData.revenueGrowth}% from last {timeRange}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(platformData.totalTickets || 0).toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-500">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              <span>+{platformData.ticketGrowth}% from last {timeRange}</span>
            </div>
          </CardContent>
        </Card>
        
        {isAdmin ? (
          // Admin specific cards
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(platformData.totalUsers || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Active platform users
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{platformData.totalEvents}</div>
                <p className="text-xs text-muted-foreground">
                  {platformData.activeEvents} active events
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          // Organizer specific cards
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Avg Ticket Price</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${platformData.averageTicketPrice.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {platformData.soldOutEvents} sold out events
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Your Events</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{platformData.totalEvents}</div>
                <div className="text-xs text-muted-foreground">
                  {platformData.activeEvents} active, {platformData.upcomingEvents} upcoming
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Time Range Selector */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-md border border-gray-200 p-1">
          <button
            onClick={() => handleTimeRangeChange("week")}
            className={`px-3 py-1 text-sm rounded-md ${timeRange === "week" ? "bg-ticketBlue text-white" : "bg-transparent text-gray-600"}`}
          >
            Week
          </button>
          <button
            onClick={() => handleTimeRangeChange("month")}
            className={`px-3 py-1 text-sm rounded-md ${timeRange === "month" ? "bg-ticketBlue text-white" : "bg-transparent text-gray-600"}`}
          >
            Month
          </button>
          <button
            onClick={() => handleTimeRangeChange("year")}
            className={`px-3 py-1 text-sm rounded-md ${timeRange === "year" ? "bg-ticketBlue text-white" : "bg-transparent text-gray-600"}`}
          >
            Year
          </button>
          <button
            onClick={() => handleTimeRangeChange("all")}
            className={`px-3 py-1 text-sm rounded-md ${timeRange === "all" ? "bg-ticketBlue text-white" : "bg-transparent text-gray-600"}`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>
              Monthly revenue for the current year
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Line type="monotone" dataKey="revenue" stroke="#0088FE" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Right side chart - different based on role */}
        {isAdmin ? (
          // Admin: Event Categories Chart
          <Card>
            <CardHeader>
              <CardTitle>Event Categories</CardTitle>
              <CardDescription>
                Distribution of events by category
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={eventCategories} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name">
                    {eventCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => value.toLocaleString()} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : (
          // Organizer: Ticket Types Chart
          <Card>
            <CardHeader>
              <CardTitle>Ticket Types</CardTitle>
              <CardDescription>
                Distribution of sold tickets by type
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={ticketTypes} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name">
                    {ticketTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => value.toLocaleString()} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Second row of charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isAdmin ? (
          // Admin-specific charts
          <>
            {/* Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Growth</CardTitle>
                <CardDescription>
                  New users and events per month
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="new_users" fill="#0088FE" name="New Users" />
                    <Line type="monotone" dataKey="new_events" stroke="#FF8042" name="New Events" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Payment Methods Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>
                  Distribution of payment methods used
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={paymentMethods}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="method" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4ECDC4" name="Transactions" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        ) : (
          // Organizer-specific charts
          <>
            {/* Daily Sales Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Velocity</CardTitle>
                <CardDescription>
                  Tickets sold per day (last 7 days)
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={dailySales}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(tick) => {
                      const date = new Date(tick);
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }} />
                    <YAxis />
                    <Tooltip labelFormatter={(label) => {
                      const date = new Date(label);
                      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
                    }} />
                    <Area type="monotone" dataKey="count" fill="#0088FE" stroke="#0088FE" />
                    <Bar dataKey="count" barSize={20} fill="#0088FE" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Events Status Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Events Status</CardTitle>
                <CardDescription>
                  Distribution of your events by status
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                  <Pie 
                    data={[
                      { name: 'Active', value: platformData.activeEvents },
                      { name: 'Upcoming', value: platformData.upcomingEvents },
                      { name: 'Past', value: platformData.pastEvents }
                    ]} 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={80} 
                    fill="#8884d8" 
                    dataKey="value"
                  >
                    <Cell fill="#4ECDC4" />
                    <Cell fill="#FFD166" />
                    <Cell fill="#FF6B6B" />
                  </Pie>
                  <Tooltip formatter={(value) => value.toLocaleString()} />
                  <Legend />
                </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Top Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Events</CardTitle>
          <CardDescription>
            Events with the highest revenue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topEvents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b">
                      Event Name
                    </th>
                    {isAdmin && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b">
                        Organizer
                      </th>
                    )}
                    <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider border-b">
                      Revenue
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider border-b">
                      Tickets
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b">
                      Status
                    </th>
                    {!isAdmin && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b">
                        Start Date
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-b">{event.name}</td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b">{event.organizer}</td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right border-b">${event.revenue.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right border-b">{event.tickets.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          event.status === 'active' ? 'bg-green-100 text-green-800' : 
                          event.status === 'upcoming' ? 'bg-blue-100 text-blue-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </span>
                      </td>
                      {!isAdmin && event.start_date && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b">
                          {event.start_date}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-4 text-gray-500">No event data available</p>
          )}
        </CardContent>
      </Card>

      {/* Admin-only: Top Organizers Table */}
      {isAdmin && topOrganizers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Organizers</CardTitle>
            <CardDescription>
              Organizers with the highest revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b">
                      Company Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b">
                      Username
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider border-b">
                      Revenue
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider border-b">
                      Tickets Sold
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider border-b">
                      Events
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topOrganizers.map((organizer) => (
                    <tr key={organizer.user_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-b">{organizer.company_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b">{organizer.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right border-b">${organizer.revenue.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right border-b">{organizer.tickets_sold.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right border-b">{organizer.events}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination controls */}
      {pagination.pages > 1 && (
        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="mr-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-4 py-2">
            Page {pagination.page} of {pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
            className="ml-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default EventStatsPage;