import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, MapPin, Calendar, QrCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";


 const PurchasedTickets = () => {
    // This would typically come from your API/state
    const tickets = [
      {
        id: "1",
        eventName: "Summer Music Festival",
        date: "2024-07-15",
        location: "Central Park, NY",
        status: "valid",
        qrCode: "ticket-qr-1",
      },
      // Add more tickets as needed
    ];
  
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">My Tickets</h1>
  
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="p-4">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold text-lg">{ticket.eventName}</h3>
                  <div className="flex flex-col sm:flex-row gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(ticket.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{ticket.location}</span>
                    </div>
                  </div>
                  <Badge variant={ticket.status === "valid" ? "default" : "destructive"}>
                    {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                  </Badge>
                </div>
  
                <div className="flex gap-2 w-full md:w-auto">
                  <Button variant="outline" size="icon">
                    <QrCode className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

export default PurchasedTickets