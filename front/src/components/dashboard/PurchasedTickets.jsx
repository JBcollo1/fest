import React, { useState, useEffect, useContext } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, MapPin, Calendar, QrCode, Users, Clock, ChevronDown, ChevronUp, Share2, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AuthContext } from "@/contexts/AuthContext";
import axios from "axios";

const PurchasedTickets = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTicket, setExpandedTicket] = useState(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    if (!authLoading && user) {
      fetchTickets();
    }
  }, [authLoading, user]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/users/${user.id}/tickets`,
        { withCredentials: true }
      );
      setTickets(response.data.data);
    } catch (error) {
      setError("Failed to load tickets. Please try again later.");
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (ticketId) => {
    if (expandedTicket === ticketId) {
      setExpandedTicket(null);
    } else {
      setExpandedTicket(ticketId);
    }
  };

  const showQrCode = (ticket) => {
    setSelectedTicket(ticket);
    setQrDialogOpen(true);
  };

  const formatDateTime = (dateString) => {
    const options = { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const upcomingTickets = tickets.filter(ticket => ticket.status === "valid");
  const pastTickets = tickets.filter(ticket => ticket.status === "used");

  if (authLoading || loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-foreground">My Tickets</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Clock className="w-4 h-4 mr-2" />
            Recent Orders
          </Button>
          <Button size="sm">
            <Ticket className="w-4 h-4 mr-2" />
            Browse Events
          </Button>
        </div>
      </div>

      <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="upcoming">Upcoming ({upcomingTickets.length})</TabsTrigger>
          <TabsTrigger value="past">Past Events ({pastTickets.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingTickets.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">You don't have any upcoming tickets.</p>
              <Button className="mt-4">Browse Events</Button>
            </Card>
          ) : (
            upcomingTickets.map((ticket) => (
              <Card key={ticket.id} className="overflow-hidden">
                <div className="sm:flex">
                  <div className="relative h-40 sm:h-auto sm:w-48 bg-muted">
                    <img 
                      src={ticket.thumbnail} 
                      alt={ticket.eventName} 
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-2 right-2">
                      {ticket.type}
                    </Badge>
                  </div>
                  <div className="p-4 flex-1">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="font-bold text-xl">{ticket.eventName}</h3>
                          <Badge variant={ticket.status === "valid" ? "default" : "destructive"}>
                            {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                          </Badge>
                        </div>
                        
                        <div className="grid sm:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>{new Date(ticket.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span>{formatTime(ticket.date)} - {formatTime(ticket.endDate)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{ticket.location}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="w-4 h-4 flex-shrink-0" />
                            <span>Ticket #{ticket.id}</span>
                          </div>
                        </div>
                        
                        {ticket.section && (
                          <div className="flex items-center gap-3 mt-1">
                            <Badge variant="outline">Section: {ticket.section}</Badge>
                            {ticket.row && <Badge variant="outline">Row: {ticket.row}</Badge>}
                            {ticket.seat && <Badge variant="outline">Seat: {ticket.seat}</Badge>}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => showQrCode(ticket)}
                        >
                          <QrCode className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleExpand(ticket.id)}
                      className="mt-2 text-xs w-full flex items-center justify-center text-muted-foreground"
                    >
                      {expandedTicket === ticket.id ? (
                        <>Less Details <ChevronUp className="ml-1 w-3 h-3" /></>
                      ) : (
                        <>More Details <ChevronDown className="ml-1 w-3 h-3" /></>
                      )}
                    </Button>
                    
                    {expandedTicket === ticket.id && (
                      <div className="mt-4 pt-4 border-t text-sm space-y-3">
                        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
                          <div>
                            <p className="font-medium">Purchase Date</p>
                            <p className="text-muted-foreground">{new Date(ticket.purchaseDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="font-medium">Price</p>
                            <p className="text-muted-foreground">{ticket.price}</p>
                          </div>
                          <div>
                            <p className="font-medium">Event Date & Time</p>
                            <p className="text-muted-foreground">{formatDateTime(ticket.date)}</p>
                          </div>
                          <div>
                            <p className="font-medium">Ticket Type</p>
                            <p className="text-muted-foreground">{ticket.type}</p>
                          </div>
                        </div>
                        
                        {ticket.additionalInfo && (
                          <div>
                            <p className="font-medium">Additional Information</p>
                            <p className="text-muted-foreground">{ticket.additionalInfo}</p>
                          </div>
                        )}
                        
                        <div className="pt-2">
                          <Button size="sm">View Event Details</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastTickets.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">You don't have any past tickets.</p>
            </Card>
          ) : (
            pastTickets.map((ticket) => (
              <Card key={ticket.id} className="overflow-hidden bg-muted/30">
                <div className="sm:flex">
                  <div className="relative h-40 sm:h-auto sm:w-48 bg-muted opacity-70">
                    <img 
                      src={ticket.thumbnail} 
                      alt={ticket.eventName} 
                      className="w-full h-full object-cover"
                    />
                    <Badge variant="secondary" className="absolute top-2 right-2">
                      {ticket.type}
                    </Badge>
                  </div>
                  <div className="p-4 flex-1">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="font-medium text-xl text-muted-foreground">{ticket.eventName}</h3>
                          <Badge variant="secondary">
                            {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                          </Badge>
                        </div>
                        
                        <div className="grid sm:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>{new Date(ticket.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{ticket.location}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Event Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ticket QR Code</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  {/* This would be an actual QR code in production */}
                  <div className="w-64 h-64 mx-auto bg-black p-4">
                    <div className="w-full h-full border-8 border-white flex items-center justify-center">
                      <QrCode className="w-32 h-32 text-white" />
                    </div>
                  </div>
                  <p className="mt-3 font-mono text-sm">{selectedTicket.id}</p>
                </div>
              </div>
              
              <div className="text-center space-y-1">
                <h3 className="font-semibold">{selectedTicket.eventName}</h3>
                <p className="text-sm text-muted-foreground">{formatDateTime(selectedTicket.date)}</p>
                {selectedTicket.section && (
                  <p className="text-sm">
                    {selectedTicket.section}
                    {selectedTicket.row && ` • Row ${selectedTicket.row}`}
                    {selectedTicket.seat && ` • Seat ${selectedTicket.seat}`}
                  </p>
                )}
                <Badge variant={selectedTicket.status === "valid" ? "default" : "secondary"} className="mt-2">
                  {selectedTicket.status.charAt(0).toUpperCase() + selectedTicket.status.slice(1)}
                </Badge>
              </div>
              
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setQrDialogOpen(false)}>
                  Close
                </Button>
                <Button>
                  <Download className="w-4 h-4 mr-2" />
                  Download Ticket
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchasedTickets;