import { useState, useEffect } from "react";
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
  const { user, fetchOrganizerEvents, fetchAllOrganizers, createEvent, updateEvent, deleteEvent } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrganizers, setLoadingOrganizers] = useState(false);
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
      const response = await fetchOrganizerEvents();
  
      if (response?.data?.items && Array.isArray(response.data.items)) {
        setEvents(response.data.items);
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
  };

  const openEditDialog = (event) => {
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
    setOrganizerId(event.organizer_id || "");
    
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
        // Only include organizer_id if admin and a value is selected
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">
          {isAdmin ? "Event Management" : "My Events"}
        </h1>
        <Button onClick={() => {
          resetForm();
          setIsCreateDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading your events...</span>
        </div>
      ) : error ? (
        <Card className="p-6 text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-foreground font-medium">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={loadEvents}
          >
            Try Again
          </Button>
        </Card>
      ) : events.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="mb-4">
            <Ticket className="h-12 w-12 text-muted-foreground mx-auto" />
          </div>
          <h3 className="text-lg font-medium mb-2">No events created yet</h3>
          <p className="text-muted-foreground mb-6">
            Start creating your first event to sell tickets and manage attendees.
          </p>
          <Button onClick={() => {
            resetForm();
            setIsCreateDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Event
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden flex flex-col">
              <div className="aspect-video bg-muted relative overflow-hidden">
                {event.image ? (
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-muted">
                    <Ticket className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                {event.featured && (
                  <Badge className="absolute top-2 right-2">Featured</Badge>
                )}
              </div>
              
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xl">{event.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {event.description || "No description provided."}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-4 pt-0 flex-grow">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{formatEventDate(event.start_datetime)}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{formatEventTime(event.start_datetime)}</span>
                    {event.end_datetime && (
                      <> - {formatEventTime(event.end_datetime)}</>
                    )}
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <DollarSign className="h-4 w-4 mr-2" />
                    <span>{event.price} {event.currency || 'KES'}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Ticket className="h-4 w-4 mr-2" />
                    <span>
                      {event.tickets_sold || 0} / {event.total_tickets} tickets sold
                    </span>
                  </div>
                  {isAdmin && event.organizer_name && (
                    <div className="flex items-center text-muted-foreground">
                      <User className="h-4 w-4 mr-2" />
                      <span>Organizer: {event.organizer_name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="p-4 pt-0 flex justify-between">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openEditDialog(event)}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => handleDeleteEvent(event.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete
                  </Button>
                </div>
                <Button size="sm" variant="ghost" className="ml-auto">
                  Details
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create Event Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>
              Fill in the details to create your new event.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateEvent} className="space-y-6">
            {formError && (
              <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm border border-red-200">
                {formError}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Organizer Selection (Admin only) */}
              {isAdmin && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="organizer">Select Organizer *</Label>
                  {loadingOrganizers ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Loading organizers...</span>
                    </div>
                  ) : (
                    <Select
                      value={organizerId}
                      onValueChange={setOrganizerId}
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
                              {organizer.name || organizer.username || organizer.email}
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
                </div>
              )}
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Tech Conference 2024"
                  required
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your event..."
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date & Time *</Label>
                <Input
                  id="start-date"
                  type="datetime-local"
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date & Time (Optional)</Label>
                <Input
                  id="end-date"
                  type="datetime-local"
                  value={endDateTime}
                  onChange={(e) => setEndDateTime(e.target.value)}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Conference Center, New York"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Price (KES) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="999.99"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="total-tickets">Total Tickets *</Label>
                <Input
                  id="total-tickets"
                  type="number"
                  min="1"
                  value={totalTickets}
                  onChange={(e) => setTotalTickets(e.target.value)}
                  placeholder="100"
                  required
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="image">Image URL (Optional)</Label>
                <Input
                  id="image"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Event
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update your event details.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdateEvent} className="space-y-6">
            {formError && (
              <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm border border-red-200">
                {formError}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Organizer Selection (Admin only) */}
              {isAdmin && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-organizer">Select Organizer *</Label>
                  {loadingOrganizers ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Loading organizers...</span>
                    </div>
                  ) : (
                    <Select
                      value={organizerId}
                      onValueChange={setOrganizerId}
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
                              {organizer.name || organizer.username || organizer.email}
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
                </div>
              )}
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-title">Event Title *</Label>
                <Input
                  id="edit-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-start-date">Start Date & Time *</Label>
                <Input
                  id="edit-start-date"
                  type="datetime-local"
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-end-date">End Date & Time (Optional)</Label>
                <Input
                  id="edit-end-date"
                  type="datetime-local"
                  value={endDateTime}
                  onChange={(e) => setEndDateTime(e.target.value)}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-location">Location *</Label>
                <Input
                  id="edit-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price (KES) *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-total-tickets">Total Tickets *</Label>
                <Input
                  id="edit-total-tickets"
                  type="number"
                  min="1"
                  value={totalTickets}
                  onChange={(e) => setTotalTickets(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-image">Image URL (Optional)</Label>
                <Input
                  id="edit-image"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update Event
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizedEvents;