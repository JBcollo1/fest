import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Loader2,
  ChevronRight,
  DollarSign,
  User,
} from "lucide-react";
import { format, isValid, parseISO } from "date-fns";

const OrganizedEvents = () => {
  const { user, fetchOrganizerEvents, fetchAllOrganizers, fetchOrganizerById, createEvent, updateEvent, deleteEvent } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrganizers, setLoadingOrganizers] = useState(false);
  const [selectedOrganizerDetails, setSelectedOrganizerDetails] = useState(null);
  const [error, setError] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Check if user is admin or organizer
  const isAdmin = user?.roles?.includes("Admin");
  const isOrganizer = user?.roles?.includes("organizer");
  const hasAccess = isAdmin || isOrganizer;
  
  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [totalTickets, setTotalTickets] = useState("");
  const [image, setImage] = useState("");
  const [organizerId, setOrganizerId] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitButtonRef = useRef(null);

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

  // Scroll to the submit button when the create dialog opens
  useEffect(() => {
    if (isCreateDialogOpen && submitButtonRef.current) {
      submitButtonRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isCreateDialogOpen]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchOrganizerEvents();
  
      if (response?.data?.items && Array.isArray(response.data.items)) {
        const eventsWithOrganizerNames = await Promise.all(
          response.data.items.map(async (event) => {
            // Fetch user details for the organizer
            if (event.organizer_id) {
              try {
                const userResponse = await fetchOrganizerById(event.organizer_id);
                // Check if userResponse is valid and has data
                if (userResponse?.data) {
                  event.organizer_name = userResponse.data.name || "Unknown Organizer"; // Set organizer name
                } else {
                  event.organizer_name = "Unknown Organizer"; // Fallback if no data
                }
              } catch (error) {
                console.error(`Error fetching organizer details for ID ${event.organizer_id}:`, error);
                event.organizer_name = "Unknown Organizer"; // Fallback on error
              }
            }
            return event;
          })
        );
        setEvents(eventsWithOrganizerNames);
        console.log(events)
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
      setLoadingOrganizers(true);
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
    } finally {
      setLoadingOrganizers(false);
    }
  };
  useEffect(() => {
    console.log("orgs",organizers);
  }, [organizers]);
  
  // New function to fetch organizer details by ID
  const loadOrganizerDetails = async (id) => {
    if (!id) return;
    
    try {
      const response = await fetchOrganizerById(id);
      if (response?.data) {
        setSelectedOrganizerDetails(response.data);
        return response.data;
      }
    } catch (error) {
      console.error("Error loading organizer details:", error);
      return null;
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStartDateTime("");
    setEndDateTime("");
    setLocation("");
    setPrice("");
    setTotalTickets("");
    setImage("");
    setOrganizerId("");
    setFormError("");
    setSelectedOrganizerDetails(null);
  };

  const openEditDialog = async (event) => {
    setSelectedEvent(event);
    
    // Format dates for the form inputs
    const startDate = parseISO(event.start_datetime);
    const endDate = event.end_datetime ? parseISO(event.end_datetime) : null;
    
    setTitle(event.title);
    setDescription(event.description || "");
    setStartDateTime(
      isValid(startDate) 
        ? format(startDate, "yyyy-MM-dd'T'HH:mm") 
        : ""
    );
    setEndDateTime(
      endDate && isValid(endDate) 
        ? format(endDate, "yyyy-MM-dd'T'HH:mm") 
        : ""
    );
    setLocation(event.location);
    setPrice(event.price.toString());
    setTotalTickets(event.total_tickets.toString());
    setImage(event.image || "");
    
    // Make sure to convert organizer_id to string for the select component
    const orgId = event.organizer_id ? event.organizer_id.toString() : "";
    setOrganizerId(orgId);
    
    // If there's an organizer ID, fetch the organizer details
    if (event.organizer_id && isAdmin) {
      await loadOrganizerDetails(event.organizer_id);
    }
    
    setIsEditDialogOpen(true);
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setFormError("");
    
    try {
      const eventData = {
        title,
        description,
        start_datetime: startDateTime,
        end_datetime: endDateTime || null,
        location,
        price: parseFloat(price),
        total_tickets: parseInt(totalTickets),
        image,
        ...(isAdmin && organizerId && { organizer_id: organizerId }),
      };
      
      const response = await createEvent(eventData);
      
      toast({
        title: "Success",
        description: "Event created successfully",
      });
      
      resetForm();
      setIsCreateDialogOpen(false);
      
      // Refresh the events list
      loadEvents();
    } catch (error) {
      console.error("Error creating event:", error);
      setFormError(error.response?.data?.message || "Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setFormError("");
    
    try {
      const eventData = {
        title,
        description,
        start_datetime: startDateTime,
        end_datetime: endDateTime || null,
        location,
        price: parseFloat(price),
        total_tickets: parseInt(totalTickets),
        image,
        // Only include organizer_id if admin and a value is selected
        ...(isAdmin && organizerId && { organizer_id: organizerId }),
      };
      
      await updateEvent(selectedEvent.id, eventData);
      
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
      
      resetForm();
      setIsEditDialogOpen(false);
      setSelectedEvent(null);
      
      // Refresh the events list
      loadEvents();
    } catch (error) {
      console.error("Error updating event:", error);
      setFormError(error.response?.data?.message || "Failed to update event");
    } finally {
      setIsSubmitting(false);
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
  
  // Handle organizer selection change and fetch details
  const handleOrganizerChange = async (value) => {
    setOrganizerId(value);
    
    if (!value) {
      setSelectedOrganizerDetails(null);
      return;
    }
    
    try {
      const organizerResponse = await fetchOrganizerById(value);
      
      if (organizerResponse?.data) {
        setSelectedOrganizerDetails(organizerResponse.data);
      } else {
        setSelectedOrganizerDetails(null);
      }
    } catch (error) {
      console.error("Error fetching organizer details:", error);
      setSelectedOrganizerDetails(null);
    }
  };
  

  const validateForm = () => {
    if (!title) {
      setFormError("Title is required");
      return false;
    }
    if (!startDateTime) {
      setFormError("Start date and time are required");
      return false;
    }
    if (!location) {
      setFormError("Location is required");
      return false;
    }
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      setFormError("Valid price is required");
      return false;
    }
    if (!totalTickets || isNaN(parseInt(totalTickets)) || parseInt(totalTickets) <= 0) {
      setFormError("Valid number of tickets is required");
      return false;
    }
    // For admins, require organizer selection
    if (isAdmin && !organizerId) {
      setFormError("Please select an organizer");
      return false;
    }
    return true;
  };

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

  // Updated access check to include both admin and organizer roles
  if (!hasAccess) {
    return (
      <div className="text-center p-6">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Access Restricted</h2>
        <p className="text-muted-foreground mb-4">
          You need to be an administrator or registered organizer to manage events.
        </p>
        {!isOrganizer && !isAdmin && (
          <Button>Apply to Become an Organizer</Button>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          {isAdmin ? "Event Management" : "My Events"}
        </h1>
        <Button onClick={() => {
          resetForm();
          setIsCreateDialogOpen(true);
        }} className="bg-primary hover:bg-primary/90 text-white">
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
          <Button onClick={() => {
            resetForm();
            setIsCreateDialogOpen(true);
          }} size="lg" className="bg-primary hover:bg-primary/90 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Event
          </Button>
        </Card>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden flex flex-col shadow-md hover:shadow-lg transition-shadow duration-300">
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
                    <span className="font-medium">{event.price} {event.currency || 'KES'}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Ticket className="h-4 w-4 mr-2 text-primary/70" />
                    <span>
                      <span className="font-medium">{event.tickets_sold || 0}</span> / {event.total_tickets} tickets sold
                    </span>
                  </div>
                  {isAdmin && event.organizer_id && (
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
                    onClick={() => openEditDialog(event)}
                    className="border-primary/20 hover:bg-primary/5"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                    onClick={() => handleDeleteEvent(event.id)}
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
          ))}
        </div>
      )}
  
      {/* Create Event Dialog */}
      {/* Create Event Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[42rem] h-full overflow-auto flex flex-col">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-2xl">Create New Event</DialogTitle>
            <DialogDescription className="text-base">
              Fill in the details to create your new event.
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto pr-2 pb-2">
            <form onSubmit={handleCreateEvent} className="space-y-5">
              {formError && (
                <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm border border-red-200 flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Organizer Selection (Admin only) */}
                {isAdmin && (
                  <div className="space-y-2 md:col-span-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-md">
                    <Label htmlFor="organizerId" className="text-sm font-medium">Select Organizer</Label>
                    <Select value={organizerId || "none"} onValueChange={handleOrganizerChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an organizer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" disabled>
                          -- Select Organizer --
                        </SelectItem>
                        {organizers.length > 0 ? (
                          organizers.map((organizer) => (
                            <SelectItem key={organizer.id} value={organizer.id.toString()}>
                              {organizer.name || organizer.username || organizer.email || `ID: ${organizer.id}`}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-muted-foreground">No organizers available</div>
                        )}
                      </SelectContent>
                    </Select>

                    {/* Show selected organizer details if available */}
                    {selectedOrganizerDetails && (
                      <div className="mt-2 p-2 bg-white dark:bg-slate-800 rounded-md text-sm border border-slate-200 dark:border-slate-700">
                        <p className="font-medium mb-1">Selected Organizer Details:</p>
                        <p>ID: {selectedOrganizerDetails.id}</p>
                        {selectedOrganizerDetails.user.first_name && <p>Name: {selectedOrganizerDetails.user.first_name}</p>}
                        {selectedOrganizerDetails.user.email && <p>Email: {selectedOrganizerDetails.user.email}</p>}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="title" className="text-sm font-medium">Event Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Tech Conference 2024"
                    required
                    className="focus-visible:ring-primary"
                  />
                </div>
                
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your event..."
                    rows={3}
                    className="focus-visible:ring-primary resize-none"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="start-date" className="text-sm font-medium">Start Date & Time *</Label>
                  <Input
                    id="start-date"
                    type="datetime-local"
                    value={startDateTime}
                    onChange={(e) => setStartDateTime(e.target.value)}
                    required
                    className="focus-visible:ring-primary"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="end-date" className="text-sm font-medium">End Date & Time</Label>
                  <Input
                    id="end-date"
                    type="datetime-local"
                    value={endDateTime}
                    onChange={(e) => setEndDateTime(e.target.value)}
                    className="focus-visible:ring-primary"
                  />
                </div>
                
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="location" className="text-sm font-medium">Location *</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Conference Center, New York"
                    required
                    className="focus-visible:ring-primary"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="price" className="text-sm font-medium">Price (KES) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="999.99"
                    required
                    className="focus-visible:ring-primary"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="total-tickets" className="text-sm font-medium">Total Tickets *</Label>
                  <Input
                    id="total-tickets"
                    type="number"
                    min="1"
                    value={totalTickets}
                    onChange={(e) => setTotalTickets(e.target.value)}
                    placeholder="100"
                    required
                    className="focus-visible:ring-primary"
                  />
                </div>
                
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="image" className="text-sm font-medium">Image URL</Label>
                  <Input
                    id="image"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="focus-visible:ring-primary"
                  />
                </div>
              </div>
            </form>
          </div>
          
          <DialogFooter className="mt-4 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isSubmitting}
              className="border-slate-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateEvent}
              disabled={isSubmitting}
              ref={submitButtonRef}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  
      {/* Edit Event Dialog */}
      {/* Edit Event Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[42rem] h-full overflow-auto flex flex-col">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-2xl">Edit Event</DialogTitle>
            <DialogDescription className="text-base">
              Update your event details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto pr-2 pb-2">
            <form onSubmit={handleUpdateEvent} className="space-y-5">
              {formError && (
                <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm border border-red-200 flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Organizer Selection (Admin only) */}
                {isAdmin && (
                  <div className="space-y-2 md:col-span-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-md">
                    <Label htmlFor="edit-organizer" className="text-sm font-medium">Select Organizer *</Label>
                    {loadingOrganizers ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading organizers...</span>
                      </div>
                    ) : (
                      <Select
                        value={organizerId}
                        onValueChange={handleOrganizerChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an organizer" />
                        </SelectTrigger>
                        <SelectContent>
                          {organizers.length > 0 ? (
                            organizers.map((organizer) => (
                              <SelectItem 
                                key={organizer.id} 
                                value={organizer.id.toString()}
                              >
                                {organizer.name || organizer.username || organizer.email || `ID: ${organizer.id}`}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-sm text-muted-foreground">
                              No organizers available
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                    
                    {/* Show selected organizer details if available */}
                    {selectedOrganizerDetails && (
                      <div className="mt-2 p-2 bg-white dark:bg-slate-800 rounded-md text-sm border border-slate-200 dark:border-slate-700">
                        <p className="font-medium mb-1">Selected Organizer Details:</p>
                        <p>ID: {selectedOrganizerDetails.id}</p>
                        {selectedOrganizerDetails.name && <p>Name: {selectedOrganizerDetails.name}</p>}
                        {selectedOrganizerDetails.email && <p>Email: {selectedOrganizerDetails.email}</p>}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="edit-title" className="text-sm font-medium">Event Title *</Label>
                  <Input
                    id="edit-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="focus-visible:ring-primary"
                  />
                </div>
                
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="edit-description" className="text-sm font-medium">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="focus-visible:ring-primary resize-none"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="edit-start-date" className="text-sm font-medium">Start Date & Time *</Label>
                  <Input
                    id="edit-start-date"
                    type="datetime-local"
                    value={startDateTime}
                    onChange={(e) => setStartDateTime(e.target.value)}
                    required
                    className="focus-visible:ring-primary"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="edit-end-date" className="text-sm font-medium">End Date & Time</Label>
                  <Input
                    id="edit-end-date"
                    type="datetime-local"
                    value={endDateTime}
                    onChange={(e) => setEndDateTime(e.target.value)}
                    className="focus-visible:ring-primary"
                  />
                </div>
                
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="edit-location" className="text-sm font-medium">Location *</Label>
                  <Input
                    id="edit-location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    className="focus-visible:ring-primary"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="edit-price" className="text-sm font-medium">Price (KES) *</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    className="focus-visible:ring-primary"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="edit-total-tickets" className="text-sm font-medium">Total Tickets *</Label>
                  <Input
                    id="edit-total-tickets"
                    type="number"
                    min="1"
                    value={totalTickets}
                    onChange={(e) => setTotalTickets(e.target.value)}
                    required
                    className="focus-visible:ring-primary"
                  />
                </div>
                
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="edit-image" className="text-sm font-medium">Image URL</Label>
                  <Input
                    id="edit-image"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="focus-visible:ring-primary"
                  />
                </div>
              </div>
            </form>
          </div>
          
          <DialogFooter className="mt-4 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSubmitting}
              className="border-slate-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateEvent}
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizedEvents;