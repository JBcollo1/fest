import React, { useState, useEffect, useContext } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, MapPin, Calendar, QrCode, Users, Clock, ChevronDown, ChevronUp, Share2, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AuthContext } from "@/contexts/AuthContext";
import axios from "axios";
import QRCode from "qrcode";
import JSZip from "jszip";

const PurchasedTickets = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTicket, setExpandedTicket] = useState(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Define colors consistent with the app's theme
  const colors = {
    darkestBlue: '#000814',
    darkBlue: '#001D3D',
    midBlue: '#003566',
    yellow: '#FFC300',
    brightYellow: '#FFD60A'
  };

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
   
  const upcomingTickets = tickets.filter(ticket => ticket.status === "purchased");
  const pastTickets = tickets.filter(ticket => ticket.status === "used");

  const downloadAllDetails = async () => {
    if (!selectedTicket) return;

    try {
      // Generate QR code
      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, selectedTicket.id, { width: 400 });
      const qrDataUrl = canvas.toDataURL('image/png');

      // Create ticket details
      const ticketDetails = `
        EVENT: ${selectedTicket.event.title}
        DATE: ${formatDateTime(selectedTicket.event.start_datetime)}
        LOCATION: ${selectedTicket.event.location}
        TICKET TYPE: ${selectedTicket.type}
        TICKET ID: ${selectedTicket.id}
        TRANSACTION ID: ${selectedTicket.transaction_id || 'N/A'}
        PRICE: ${selectedTicket.price} ${selectedTicket.currency}
        PURCHASE DATE: ${new Date(selectedTicket.purchase_date).toLocaleDateString()}
      `;

      // Create a blob for the ticket details
      const detailsBlob = new Blob([ticketDetails], { type: 'text/plain' });
      const detailsUrl = URL.createObjectURL(detailsBlob);

      // Create a zip file containing both the QR code and ticket details
      const zip = new JSZip();
      zip.file(`ticket-${selectedTicket.id}.png`, qrDataUrl.split(',')[1], { base64: true });
      zip.file(`ticket-details-${selectedTicket.id}.txt`, ticketDetails);

      // Generate the zip file and trigger download
      zip.generateAsync({ type: 'blob' }).then((content) => {
        const zipUrl = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = zipUrl;
        a.download = `ticket-${selectedTicket.id}.zip`;
        a.click();
        URL.revokeObjectURL(zipUrl);
      });
    } catch (error) {
      console.error("Error generating download:", error);
    }
  };

  // Updated QR Dialog with previous styling
  const QrDialog = () => (
    <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
      <DialogContent className="w-full max-w-md p-6">
        <div className="relative bg-card rounded-2xl border border-accent/20 p-6">
          <DialogHeader className="items-start">
            <DialogTitle className="text-3xl font-bold text-gradient">
              Quantum Access
            </DialogTitle>
          </DialogHeader>

          <div className="my-4 p-4 bg-background rounded-xl border border-border">
            <div className="flex justify-center">
              <div className="w-[300px] h-[300px] bg-white rounded-lg flex items-center justify-center">
                <QrCode className="w-full h-full text-black" />
              </div>
            </div>
            <p className="text-center mt-3 text-sm text-muted-foreground">
              Scan to validate entry
            </p>
          </div>

          <div className="space-y-2 text-center mb-4">
            <h3 className="text-xl font-semibold truncate">
              {selectedTicket?.event.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {selectedTicket && formatDateTime(selectedTicket.event.start_datetime)}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setQrDialogOpen(false)}
            >
              Close
            </Button>
            <Button 
              className="w-full gap-2"
              onClick={downloadAllDetails}
            >
              <Download size={18} />
              <span className="hidden sm:inline">Download All</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (authLoading || loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background text-foreground p-6 relative overflow-hidden dark">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute w-[500px] h-[500px] bg-accent rounded-full blur-3xl opacity-10 -top-32 -left-32 animate-pulse" />
        <div className="absolute w-[400px] h-[400px] bg-primary rounded-full blur-3xl opacity-10 bottom-0 -right-32 animate-pulse delay-100" />
      </div>
  
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Holographic Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-12 p-6 bg-card rounded-3xl border border-accent/20 shadow-lg">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4 sm:mb-0">
            Quantum Pass
          </h1>
          <div className="flex gap-3">
            <button className="px-6 py-3 bg-card/80 border border-accent/30 rounded-2xl hover:bg-muted transition-all group">
              <span className="text-accent group-hover:text-accent">
                <Clock className="inline mr-2 w-5 h-5" />
                Timeline
              </span>
            </button>
            <button className="btn-accent flex items-center gap-2 shadow-md rounded-2xl">
              <Ticket className="w-5 h-5" />
              Explore Events
            </button>
          </div>
        </div>
  
        {/* Holographic Tabs */}
        <div className="grid grid-cols-2 gap-4 mb-12 bg-card/90 p-2 rounded-2xl border border-border">
          {['upcoming', 'past'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`p-4 text-lg font-medium rounded-xl transition-all ${
                activeTab === tab 
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} Events
              <span className="ml-2 text-sm bg-background/80 px-2 py-1 rounded-full">
                {tab === 'upcoming' ? upcomingTickets.length : pastTickets.length}
              </span>
            </button>
          ))}
        </div>
  
        {/* Quantum Ticket Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(activeTab === 'upcoming' ? upcomingTickets : pastTickets).map((ticket) => (
            <div 
              key={ticket.id}
              className="group relative bg-card rounded-3xl border border-border hover:border-accent/30 transition-all shadow-md hover:shadow-xl"
            >
              {/* Holographic Ticket Badge */}
              <div className="absolute -top-3 -right-3 bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-bold shadow-md">
                #{ticket.id.slice(0,6).toUpperCase()}
              </div>
  
              <div className="p-6">
                {/* Event Image with Hover Effect */}
                <div className="relative h-48 mb-6 rounded-2xl overflow-hidden border border-border group-hover:border-accent/30 transition-colors">
                  <img
                    src={ticket.event.image}
                    alt={ticket.event.title}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                </div>
  
                {/* Event Details */}
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h2 className="text-2xl font-bold text-gradient">
                      {ticket.event.title}
                    </h2>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      ticket.status === 'purchased' 
                        ? 'bg-accent/20 text-accent' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
  
                  {/* Meta Grid */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-accent/80">
                      <Calendar className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <p className="text-muted-foreground">Date</p>
                        <p>{new Date(ticket.event.start_datetime).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-accent/80">
                      <Clock className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <p className="text-muted-foreground">Time</p>
                        <p>{formatTime(ticket.event.start_datetime)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-accent/80">
                      <MapPin className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <p className="text-muted-foreground">Location</p>
                        <p className="truncate">{ticket.event.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-accent/80">
                      <Ticket className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <p className="text-muted-foreground">Type</p>
                        <p>{ticket.type}</p>
                      </div>
                    </div>
                  </div>
  
                  {/* Interactive Actions */}
                  <div className="flex justify-between items-center pt-4 border-t border-border">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => showQrCode(ticket)}
                        className="p-3 bg-muted rounded-xl hover:bg-muted/80 transition-all group"
                      >
                        <QrCode className="w-6 h-6 text-accent group-hover:scale-110 transition-transform" />
                      </button>
                      <button className="p-3 bg-muted rounded-xl hover:bg-muted/80 transition-all group">
                        <Share2 className="w-6 h-6 text-accent group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                    <button 
                      className="flex items-center gap-2 text-accent hover:text-accent/80 transition-colors"
                      onClick={() => toggleExpand(ticket.id)}
                    >
                      {expandedTicket === ticket.id ? 'Collapse' : 'Details'}
                      {expandedTicket === ticket.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
  
                  {/* Expanded Details */}
                  {expandedTicket === ticket.id && (
                    <div className="pt-6 mt-6 border-t border-border space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-muted-foreground mb-1">Purchase Date</p>
                          <p>{new Date(ticket.purchase_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Price</p>
                          <p>{ticket.price} {ticket.currency}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Transaction ID</p>
                          <p className="truncate">{ticket.transaction_id || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Ticket ID</p>
                          <p className="truncate">#{ticket.id.slice(0,10).toUpperCase()}</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => showQrCode(ticket)}
                        >
                          Show QR Code
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          View Event Details
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
  
        {/* Render QR Dialog */}
        <QrDialog />
      </div>
    </div>
  );
};

export default PurchasedTickets;