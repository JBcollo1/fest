import React, { useState, useEffect } from "react";
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
import { DollarSign, ArrowUpRight, Ticket, Users, Building } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

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
  const { isDarkMode } = useTheme();
  useEffect(() => {
    const fetchStatsData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/stats`, {
          withCredentials: true
        });

        if (response.data) {
          setPlatformData({
            totalRevenue: response.data.totalRevenue,
            totalTickets: response.data.totalTickets,
            totalUsers: response.data.totalUsers,
            activeEvents: response.data.activeEvents,
          });
          // Process additional data for charts and tables
          setMonthlyRevenue(response.data.monthlyRevenue || []);
          setEventCategories(response.data.eventCategories || []);
          setTopEvents(response.data.topEvents || []);
        }
      } catch (error) {
        console.error("Error fetching stats data:", error);
      }
    };

    fetchStatsData();
  }, []);

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
                <Tooltip />
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
                <Pie data={eventCategories} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value">
                  {eventCategories.map((entry, index) => (
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

      {/* Top Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Events</CardTitle>
          <CardDescription>
            Events with the highest revenue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organizer
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tickets
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topEvents.map((event) => (
                <tr key={event.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{event.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.organizer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">${event.revenue.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{event.tickets.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${event.status === 'active' ? 'bg-green-100 text-green-800' : event.status === 'upcoming' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{event.status.charAt(0).toUpperCase() + event.status.slice(1)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventStatsPage;