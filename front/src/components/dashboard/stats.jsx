import React, { useState, useEffect } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { DollarSign, TrendingUp, Ticket, Calendar, Download, Search, Loader2 } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { useAuth } from "@/contexts/AuthContext";

const EventStatsPage = () => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState("7days");
  const [eventFilter, setEventFilter] = useState("all");
  const [eventsData, setEventsData] = useState([]);
  const [ticketsData, setTicketsData] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Generate date ranges based on selection
  const getDateRangeFilter = () => {
    const now = new Date();
    const ranges = {
      "7days": new Date(now.setDate(now.getDate() - 7)),
      "30days": new Date(now.setDate(now.getDate() - 23)), // -30 total
      "90days": new Date(now.setDate(now.getDate() - 60)), // -90 total
      "year": new Date(now.setFullYear(now.getFullYear() - 1))
    };
    return ranges[dateRange] || ranges["7days"];
  };

  useEffect(() => {
    const fetchStatsData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/stats`, {
          withCredentials: true
        });

        if (response.data) {
          // Process events data
          const events = response.data.events || [];
          
          // Process tickets data and include event titles
          const tickets = response.data.tickets || [];
          const ticketsWithEvents = tickets.map(ticket => {
            const eventData = events.find(event => event.id === ticket.event_id) || {};
            return {
              ...ticket,
              eventTitle: eventData.title || 'Unknown Event',
              customerName: ticket.attendee ? `${ticket.attendee.first_name} ${ticket.attendee.last_name}` : 'Unknown',
              customerEmail: ticket.attendee ? ticket.attendee.email : 'Unknown'
            };
          });
          
          setEventsData(events);
          setTicketsData(ticketsWithEvents);
          setFilteredTickets(ticketsWithEvents);
        } else {
          console.error("Unexpected response structure:", response.data);
          setEventsData([]);
          setTicketsData([]);
          setFilteredTickets([]);
        }
      } catch (error) {
        console.error("Error fetching stats data:", error);
        setEventsData([]);
        setTicketsData([]);
        setFilteredTickets([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatsData();
  }, []);

  // Apply date range filter
  useEffect(() => {
    const dateLimit = getDateRangeFilter();
    
    // Filter tickets by date
    const filtered = ticketsData.filter(ticket => {
      const purchaseDate = new Date(ticket.purchase_date);
      return purchaseDate >= dateLimit;
    });
    
    setFilteredTickets(filtered);
  }, [dateRange, ticketsData]);

  // Apply search filter
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTickets(ticketsData.filter(ticket => {
        const purchaseDate = new Date(ticket.purchase_date);
        return purchaseDate >= getDateRangeFilter();
      }));
    } else {
      const filtered = ticketsData.filter(ticket => {
        const term = searchTerm.toLowerCase();
        const customerEmail = (ticket.attendee?.email || '').toLowerCase();
        const customerName = (ticket.customerName || '').toLowerCase();
        const eventTitle = (ticket.eventTitle || '').toLowerCase();
        const transactionId = (ticket.payments?.[0]?.transaction_id || '').toLowerCase();
        
        return (customerEmail.includes(term) || 
                customerName.includes(term) || 
                eventTitle.includes(term) || 
                transactionId.includes(term)) && 
                new Date(ticket.purchase_date) >= getDateRangeFilter();
      });
      
      setFilteredTickets(filtered);
    }
  }, [searchTerm, ticketsData, dateRange]);

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTickets = filteredTickets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);

  // Prepare chart data
  const prepareDailyData = () => {
    const dateMap = new Map();
    
    // Group tickets by date
    filteredTickets.forEach(ticket => {
      const date = new Date(ticket.purchase_date).toLocaleDateString();
      const amount = ticket.payments && ticket.payments[0] ? ticket.payments[0].amount : 0;
      
      if (dateMap.has(date)) {
        dateMap.set(date, {
          revenue: dateMap.get(date).revenue + amount,
          count: dateMap.get(date).count + 1
        });
      } else {
        dateMap.set(date, { revenue: amount, count: 1 });
      }
    });
    
    // Convert map to array for chart
    return Array.from(dateMap, ([date, data]) => ({
      date,
      revenue: data.revenue,
      ticketCount: data.count
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const prepareEventData = () => {
    const eventMap = new Map();
    
    // Group tickets by event
    filteredTickets.forEach(ticket => {
      const eventId = ticket.event_id;
      const eventTitle = ticket.eventTitle || 'Unknown Event';
      const amount = ticket.payments && ticket.payments[0] ? ticket.payments[0].amount : 0;
      
      if (eventMap.has(eventId)) {
        const current = eventMap.get(eventId);
        eventMap.set(eventId, {
          ...current,
          revenue: current.revenue + amount,
          ticketCount: current.ticketCount + 1
        });
      } else {
        eventMap.set(eventId, { 
          id: eventId,
          title: eventTitle,
          revenue: amount, 
          ticketCount: 1 
        });
      }
    });
    
    // Convert map to array for chart
    return Array.from(eventMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10); // Top 10 events
  };

  const prepareTicketTypeData = () => {
    const typeMap = new Map();
    
    // Group tickets by ticket type
    filteredTickets.forEach(ticket => {
      const typeName = ticket.ticket_type?.name || 'Standard';
      const amount = ticket.payments && ticket.payments[0] ? ticket.payments[0].amount : 0;
      
      if (typeMap.has(typeName)) {
        const current = typeMap.get(typeName);
        typeMap.set(typeName, {
          ...current,
          revenue: current.revenue + amount,
          count: current.count + 1
        });
      } else {
        typeMap.set(typeName, { 
          name: typeName,
          revenue: amount, 
          count: 1 
        });
      }
    });
    
    // Convert map to array for chart
    return Array.from(typeMap.values());
  };

  // Calculate stats
  const totalRevenue = filteredTickets.reduce((sum, ticket) => {
    const payment = ticket.payments && ticket.payments[0] ? ticket.payments[0].amount : 0;
    return sum + payment;
  }, 0);
  
  const totalTicketsSold = filteredTickets.length;
  
  // Get unique events from filtered tickets
  const uniqueEvents = new Set(filteredTickets.map(ticket => ticket.event_id));
  const eventsHeld = uniqueEvents.size;

  // Calculate previous period stats for comparison
  const calcGrowthPercentage = (current, previous) => {
    if (previous === 0) return 100;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  // Handle export function
  const handleExport = () => {
    const csvContent = [
      ["Transaction ID", "Event", "Date", "Customer", "Email", "Amount"],
      ...filteredTickets.map(ticket => [
        ticket.payments && ticket.payments[0] ? ticket.payments[0].transaction_id : 'N/A',
        ticket.eventTitle,
        new Date(ticket.purchase_date).toLocaleDateString(),
        ticket.customerName,
        ticket.attendee?.email || 'N/A',
        ticket.payments && ticket.payments[0] ? ticket.payments[0].amount : 0
      ])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `ticket_sales_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Colors for charts
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sales Report</h1>
          <p className="text-gray-500 mt-1">Overview of your ticket sales and revenue</p>
        </div>
        
        <div className="flex gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="year">This year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                    <h3 className="text-2xl font-bold mt-1">{formatCurrency(totalRevenue)}</h3>
                    <p className="text-sm text-green-600 mt-1 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      +12.5% from last period
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tickets Sold</p>
                    <h3 className="text-2xl font-bold mt-1">{totalTicketsSold}</h3>
                    <p className="text-sm text-green-600 mt-1 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      +8.3% from last period
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Ticket className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Events with Sales</p>
                    <h3 className="text-2xl font-bold mt-1">{eventsHeld}</h3>
                    <p className="text-sm text-green-600 mt-1 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      +2.5% from last period
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Tabs defaultValue="daily">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="daily">Daily Sales</TabsTrigger>
              <TabsTrigger value="events">Sales by Event</TabsTrigger>
              <TabsTrigger value="ticketTypes">Ticket Types</TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Sales Revenue</CardTitle>
                  <CardDescription>
                    Revenue from ticket sales over the selected time period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={prepareDailyData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === 'revenue' ? formatCurrency(value) : value,
                            name === 'revenue' ? 'Revenue' : 'Tickets'
                          ]}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#8884d8" 
                          name="revenue"
                          strokeWidth={2}
                          dot={{ stroke: '#8884d8', strokeWidth: 2, r: 4 }}
                          activeDot={{ stroke: '#8884d8', strokeWidth: 2, r: 6 }}
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="ticketCount" 
                          stroke="#82ca9d"
                          name="ticketCount" 
                          strokeWidth={2}
                          dot={{ stroke: '#82ca9d', strokeWidth: 2, r: 4 }}
                          activeDot={{ stroke: '#82ca9d', strokeWidth: 2, r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between">
                    <div>
                      <CardTitle>Sales by Event</CardTitle>
                      <CardDescription>
                        Revenue breakdown by individual events
                      </CardDescription>
                    </div>
                    <Select value={eventFilter} onValueChange={setEventFilter}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="All events" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All events</SelectItem>
                        <SelectItem value="active">Active events</SelectItem>
                        <SelectItem value="past">Past events</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={prepareEventData()}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" />
                        <YAxis 
                          type="category" 
                          dataKey="title" 
                          width={150}
                          tickFormatter={(value) => value.length > 20 ? value.substring(0, 17) + '...' : value}
                        />
                        <Tooltip 
                          formatter={(value, name) => [formatCurrency(value), name === 'revenue' ? 'Revenue' : 'Tickets']} 
                          labelFormatter={(label) => `Event: ${label}`}
                        />
                        <Bar dataKey="revenue" name="Revenue" fill="#8884d8" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="ticketCount" name="Tickets" fill="#82ca9d" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="ticketTypes" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ticket Type Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of sales by ticket type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={prepareTicketTypeData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="revenue"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {prepareTicketTypeData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => formatCurrency(value)} 
                            labelFormatter={(name) => `Ticket Type: ${name}`}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={prepareTicketTypeData()}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" />
                          <YAxis 
                            type="category" 
                            dataKey="name" 
                            width={120}
                          />
                          <Tooltip 
                            formatter={(value, name) => [
                              name === 'count' ? value : formatCurrency(value),
                              name === 'count' ? 'Quantity' : 'Revenue'
                            ]} 
                          />
                          <Bar dataKey="count" name="Quantity" fill="#82ca9d" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Search and Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <CardTitle>Sales Transactions</CardTitle>
                  <CardDescription>
                    Detailed list of all ticket sales transactions
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Search by customer or event..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="border-b bg-gray-50">
                    <tr className="border-b transition-colors">
                      <th className="h-12 px-4 text-left align-middle font-medium">Transaction ID</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Event</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Date</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Customer</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Email</th>
                      <th className="h-12 px-4 text-right align-middle font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTickets.length > 0 ? (
                      currentTickets.map((ticket) => (
                        <tr key={ticket.id} className="border-b transition-colors hover:bg-gray-50">
                          <td className="p-4 align-middle font-medium">
                            {ticket.payments && ticket.payments[0] ? ticket.payments[0].transaction_id : 'N/A'}
                          </td>
                          <td className="p-4 align-middle">{ticket.eventTitle}</td>
                          <td className="p-4 align-middle">{new Date(ticket.purchase_date).toLocaleDateString()}</td>
                          <td className="p-4 align-middle">{ticket.customerName}</td>
                          <td className="p-4 align-middle">{ticket.attendee?.email || 'N/A'}</td>
                          <td className="p-4 align-middle text-right">
                            {ticket.payments && ticket.payments[0] ? formatCurrency(ticket.payments[0].amount) : 'N/A'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-gray-500">No transactions found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-500">
                  Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredTickets.length)} of {filteredTickets.length} transactions
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default EventStatsPage;