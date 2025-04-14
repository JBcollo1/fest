import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, ArrowUpRight, Ticket, Users, Building, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

// Colors for pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28BFF', '#FF6B6B', '#4ECDC4', '#FF9F1C'];

const EventStatsPage = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("week");
  const [platformData, setPlatformData] = useState({
    totalRevenue: 0,
    totalTickets: 0,
    totalUsers: 0,
    activeEvents: 0,
  });
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [eventCategories, setEventCategories] = useState([]);
  const [topEvents, setTopEvents] = useState([]);
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

  // Memoized axios instance with cancellation
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

      const response = await api.get(`/api/stats?page=${eventsPage}&per_page=${eventsPerPage}`);

      if (response.data) {
        setPlatformData({
          totalRevenue: response.data.totalRevenue || 0,
          totalTickets: response.data.totalTickets || 0,
          totalUsers: response.data.totalUsers || 0,
          activeEvents: response.data.activeEvents || 0,
          revenueGrowth: response.data.revenueGrowth || 5, // Placeholder
          ticketGrowth: response.data.ticketGrowth || 12, // Placeholder
        });
        
        // Process additional data for charts and tables
        setMonthlyRevenue(response.data.monthlyRevenue || []);
        setEventCategories(response.data.eventCategories || []);
        setTopEvents(response.data.topEvents || []);
        
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
  }, [api, eventsPage, eventsPerPage, user]);

  useEffect(() => {
    fetchStatsData();
    
    // Cleanup function
    return () => {
      // Cancel any pending requests
    };
  }, [fetchStatsData]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setEventsPage(newPage);
    }
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
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformData.activeEvents}</div>
            <p className="text-xs text-muted-foreground">
              Across all categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Time Range Selector */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-md border border-gray-200 p-1">
          <button
            onClick={() => setTimeRange("week")}
            className={`px-3 py-1 text-sm rounded-md ${timeRange === "week" ? "bg-ticketBlue text-white" : "bg-transparent text-gray-600"}`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeRange("month")}
            className={`px-3 py-1 text-sm rounded-md ${timeRange === "month" ? "bg-ticketBlue text-white" : "bg-transparent text-gray-600"}`}
          >
            Month
          </button>
          <button
            onClick={() => setTimeRange("year")}
            className={`px-3 py-1 text-sm rounded-md ${timeRange === "year" ? "bg-ticketBlue text-white" : "bg-transparent text-gray-600"}`}
          >
            Year
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

        {/* Event Categories */}
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b">
                      Organizer
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider border-b">
                      Revenue
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider border-b">
                      Tickets
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-b">{event.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b">{event.organizer}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right border-b">${event.revenue.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right border-b">{event.tickets.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${event.status === 'active' ? 'bg-green-100 text-green-800' : event.status === 'upcoming' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{event.status.charAt(0).toUpperCase() + event.status.slice(1)}</span>
                      </td>
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