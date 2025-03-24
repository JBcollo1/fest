import { useState, useEffect, lazy, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, Loader2, Plus, Ticket } from "lucide-react";
import EventCard from "./EventCard";
import CreateEventDialog from "./CreateEventDialog";
import AccessDeniedMessage from "./AccessDeniedMessage";

const EventStatsPage = lazy(() => import("./stats"));

const OrganizedEvents = () => {
  const { user, fetchOrganizerEvents, fetchAllOrganizers, fetchOrganizerById, createEvent, deleteEvent } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Determine user roles
  const isAdmin = user?.roles?.includes("Admin");
  const isOrganizer = user?.roles?.includes("organizer");
  const hasAccess = isAdmin || isOrganizer;

  // Load events on component mount
  useEffect(() => {
    if (hasAccess) {
      loadEvents();
      
      // If admin, fetch organizers
      if (isAdmin) {
        loadOrganizers();
      }
    }
  }, [hasAccess, isAdmin]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (isAdmin) {
        // Fetch all events for admin
        response = await fetchOrganizerEvents({ all: true });
      } else if (isOrganizer) {
        // Fetch only the organizer's events
        response = await fetchOrganizerEvents();
      }
  
      if (response?.data?.items && Array.isArray(response.data.items)) {
        const eventsWithOrganizerNames = await Promise.all(
          response.data.items.map(async (event) => {
            if (event.organizer_id) {
              try {
                const userResponse = await fetchOrganizerById(event.organizer_id);
                if (userResponse?.data) {
                  event.organizer_name = userResponse.data.name || "Unknown Organizer";
                } else {
                  event.organizer_name = "Unknown Organizer";
                }
              } catch (error) {
                console.error(`Error fetching organizer details for ID ${event.organizer_id}:`, error);
                event.organizer_name = "Unknown Organizer";
              }
            }
            return event;
          })
        );
        setEvents(eventsWithOrganizerNames);
        if (eventsWithOrganizerNames.length > 0) {
          setSelectedEventId(eventsWithOrganizerNames[0].id);
          setSelectedIndex(0);
        }
      } else {
        console.error("Unexpected response format:", response);
        setError("Failed to load events: Invalid data format");
        setEvents([]);
      }
    } catch (error) {
      console.error("Error loading events:", error);
      setError(`Failed to load events: ${error.message || "Unknown error"}`);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };
  
  const loadOrganizers = async () => {
    try {
      const response = await fetchAllOrganizers();
  
      if (response?.data && Array.isArray(response.data)) {
        setOrganizers(response.data);
      } else {
        console.error("Unexpected organizers response format:", response);
        setOrganizers([]);
      }
    } catch (error) {
      console.error("Error loading organizers:", error);
      setOrganizers([]);
    }
  };

  const handleCreateEvent = async (eventData) => {
    try {
      await createEvent(eventData);
      
      toast({
        title: "Success",
        description: "Event created successfully",
      });
      
      setIsCreateDialogOpen(false);
      
      // Refresh the events list
      loadEvents();
      return true;
    } catch (error) {
      console.error("Error creating event:", error);
      return { error: error.response?.data?.message || "Failed to create event" };
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return;
    }
    
    try {
      await deleteEvent(eventId);
      
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
      
      // Refresh the events list
      loadEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete event",
        variant: "destructive",
      });
    }
  };

  const handleNextEvent = () => {
    if (events.length > 0) {
      const nextIndex = (selectedIndex + 1) % events.length;
      setSelectedEventId(events[nextIndex].id);
      setSelectedIndex(nextIndex);
    }
  };

  const handlePreviousEvent = () => {
    if (events.length > 0) {
      const prevIndex = (selectedIndex - 1 + events.length) % events.length;
      setSelectedEventId(events[prevIndex].id);
      setSelectedIndex(prevIndex);
    }
  };

  // Updated access check to include both admin and organizer roles
  if (!hasAccess) {
    return <AccessDeniedMessage isOrganizer={isOrganizer} isAdmin={isAdmin} />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          {isAdmin ? "Event Management" : "My Events"}
        </h1>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)} 
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>
  
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="ml-3 text-lg">Loading your events...</span>
        </div>
      ) : error ? (
        <Card className="p-8 text-center shadow-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-foreground font-medium text-lg">{error}</p>
          <Button 
            variant="outline" 
            className="mt-6"
            onClick={loadEvents}
          >
            Try Again
          </Button>
        </Card>
      ) : events.length === 0 ? (
        <Card className="p-12 text-center shadow-md bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
          <div className="mb-6">
            <Ticket className="h-16 w-16 text-primary/60 mx-auto" />
          </div>
          <h3 className="text-xl font-medium mb-3">No events created yet</h3>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Start creating your first event to sell tickets and manage attendees.
          </p>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)} 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Event
          </Button>
        </Card>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard 
              key={event.id} 
              event={event} 
              onDelete={handleDeleteEvent}
              isAdmin={isAdmin}
              organizers={organizers}
            />
          ))}
        </div>
      )}
  
      {/* Create Event Dialog */}
      <CreateEventDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateEvent}
        isAdmin={isAdmin}
        organizers={organizers}
        fetchOrganizerById={fetchOrganizerById}
      />

      {/* Render the EventStatsPage component with lazy loading */}
      {selectedEventId && (
        <Suspense fallback={<div>Loading stats...</div>}>
          <EventStatsPage eventId={selectedEventId} />
        </Suspense>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-center mt-4">
        <Button onClick={handlePreviousEvent} className="mr-2">Previous</Button>
        <Button onClick={handleNextEvent}>Next</Button>
      </div>
    </div>
  );
};

export default OrganizedEvents;