import React, { useState, useEffect } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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
import {  Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, Ticket, Calendar, Download } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { useAuth } from "@/contexts/AuthContext";

const EventStatsPage = () => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState("7days");
  const [eventFilter, setEventFilter] = useState("all");
  const [eventsData, setEventsData] = useState([]);
  const [ticketsData, setTicketsData] = useState([]);

  useEffect(() => {
    const fetchStatsData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/stats`, {
          withCredentials: true
        });
        const { items: events } = response.data.data;
        setEventsData(events);
        const tickets = events.flatMap(event => event.tickets || []);
        setTicketsData(tickets);
      } catch (error) {
        console.error("Error fetching stats data:", error);
      }
    };

    fetchStatsData();
  }, []);

  const totalRevenue = ticketsData.reduce((sum, ticket) => sum + (ticket.payment?.amount || 0), 0);
  const totalTicketsSold = ticketsData.length;
  const eventsHeld = eventsData.length;

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
          
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

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
              <div className="bg-ticketpurple-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-ticketpurple-600" />
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
              <div className="bg-ticketpurple-100 p-3 rounded-full">
                <Ticket className="h-6 w-6 text-ticketpurple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Events Held</p>
                <h3 className="text-2xl font-bold mt-1">{eventsHeld}</h3>
                <p className="text-sm text-green-600 mt-1 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +2.5% from last period
                </p>
              </div>
              <div className="bg-ticketpurple-100 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-ticketpurple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="daily">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="daily">Daily Sales</TabsTrigger>
          <TabsTrigger value="events">Sales by Event</TabsTrigger>
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
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ticketsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="purchase_date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`$${value}`, 'Revenue']} 
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Bar dataKey="payment.amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
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
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={eventsData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="title" width={150} />
                    <Tooltip 
                      formatter={(value) => [`$${value}`, 'Revenue']} 
                      labelFormatter={(label) => `Event: ${label}`}
                    />
                    <Bar dataKey="tickets_sold" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detailed Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Transactions</CardTitle>
          <CardDescription>
            Detailed list of all ticket sales transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full caption-bottom text-sm">
              <thead className="border-b">
                <tr className="border-b transition-colors">
                  <th className="h-12 px-4 text-left align-middle font-medium">Transaction ID</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Event</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Date</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Customer</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Qty</th>
                  <th className="h-12 px-4 text-right align-middle font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {ticketsData.map((ticket) => (
                  <tr key={ticket.id} className="border-b transition-colors hover:bg-gray-50">
                    <td className="p-4 align-middle font-medium">{ticket.payment.transaction_id}</td>
                    <td className="p-4 align-middle">{ticket.event_id}</td>
                    <td className="p-4 align-middle">{new Date(ticket.purchase_date).toLocaleDateString()}</td>
                    <td className="p-4 align-middle">{ticket.attendee.user_id}</td>
                    <td className="p-4 align-middle">1</td>
                    <td className="p-4 align-middle text-right">{formatCurrency(ticket.payment.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-500">Showing {ticketsData.length} of {ticketsData.length} transactions</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventStatsPage;