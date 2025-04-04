import { 
    
    
    Card, 
    CardContent, 
    CardFooter, 
    CardDescription, 
    CardHeader, 
    CardTitle 
  } from "@/components/ui/card";
  import { Calendar, Clock, MapPin, Ticket, Trash2, ChevronRight, DollarSign, User } from "lucide-react";
  import { Badge } from '@/components/ui/badge';
  import { Button } from "@/components/ui/button";
  import { format, isValid, parseISO } from "date-fns";
  
  const EventCard = ({ event, onDelete, isadmin, organizers }) => {
    // Format the date for display
    const formatEventDate = (dateString) => {
      try {
        const date = parseISO(dateString);
        if (!isValid(date)) {
          return "Invalid date";
        }
        return format(date, "PPP");
      } catch (error) {
        return "Invalid date";
      }
    };
  
    // Format the time for display
    const formatEventTime = (dateString) => {
      try {
        const date = parseISO(dateString);
        if (!isValid(date)) {
          return "";
        }
        return format(date, "p");
      } catch (error) {
        return "";
      }
    };
  
    return (
      <Card className="overflow-hidden flex flex-col shadow-md hover:shadow-lg transition-shadow duration-300">
        <div className="aspect-video bg-muted relative overflow-hidden">
          {event.image ? (
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
              <Ticket className="h-16 w-16 text-primary/40" />
            </div>
          )}
          {event.featured && (
            <Badge className="absolute top-3 right-3 bg-primary text-white px-3 py-1">Featured</Badge>
          )}
        </div>
        
        <CardHeader className="p-5 pb-2">
          <CardTitle className="text-xl font-bold">{event.title}</CardTitle>
          <CardDescription className="line-clamp-2 mt-1 text-sm">
            {event.description || "No description provided."}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-5 pt-2 flex-grow">
          <div className="space-y-3 text-sm">
            <div className="flex items-center text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2 text-primary/70" />
              <span>{formatEventDate(event.start_datetime)}</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Clock className="h-4 w-4 mr-2 text-primary/70" />
              <span>{formatEventTime(event.start_datetime)}</span>
              {event.end_datetime && (
                <> - {formatEventTime(event.end_datetime)}</>
              )}
            </div>
            <div className="flex items-center text-muted-foreground">
              <MapPin className="h-4 w-4 mr-2 text-primary/70" />
              <span className="truncate">{event.location}</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <DollarSign className="h-4 w-4 mr-2 text-primary/70" />
              <span className="font-medium">
                {event.ticket_types && event.ticket_types.length > 0 ? (
                  (() => {
                    // Find the minimum price among ticket types
                    const minPrice = Math.min(...event.ticket_types.map(type => type.price || 0));
                    return minPrice > 0 ? `${minPrice} ${event.currency || 'KES'}` : 'Free';
                  })()
                ) : (
                  'Free'
                )}
              </span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Ticket className="h-4 w-4 mr-2 text-primary/70" />
              <span>
                <span className="font-medium">{event.tickets_sold || 0}</span> / {event.total_tickets} tickets sold
              </span>
            </div>
            {isadmin && event.organizer_id && (
              <div className="flex items-center text-muted-foreground">
                <User className="h-4 w-4 mr-2 text-primary/70" />
                <span>
                  Organizer: { 
                    organizers.find(org => org.id === event.organizer_id)?.user.first_name || `ID: ${event.organizer_id}`
                  }
                </span>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="p-5 pt-0 flex justify-between border-t mt-3">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
              onClick={() => onDelete(event.id)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
          </div>
          <Button size="sm" className="ml-auto bg-primary/10 hover:bg-primary/20 text-primary">
            Details
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </CardFooter>
      </Card>
    );
  };
  
  export default EventCard;