import { useState, useEffect, useRef } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const CreateEventDialog = ({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isAdmin, 
  organizers, 
  fetchOrganizerById 
}) => {
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
  const [selectedOrganizerDetails, setSelectedOrganizerDetails] = useState(null);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [featured, setFeatured] = useState(false);

  const submitButtonRef = useRef(null);

  // Reset form when dialog opens or closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  // Scroll to the submit button when the dialog opens
  useEffect(() => {
    if (open && submitButtonRef.current) {
      submitButtonRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [open]);

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
    setIsSubmitting(false);
    setFeatured(false);
  };

  const handleOrganizerChange = async (value) => {
    setOrganizerId(value);
    
    if (!value || value === "none") {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setFormError("");
    
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
      featured,
    };
    
    const result = await onSubmit(eventData);
    
    if (result === true) {
      // Success, form will be reset when dialog closes
    } else {
      // Error
      setFormError(result.error || "An error occurred");
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[42rem] h-full overflow-auto flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl">Create New Event</DialogTitle>
          <DialogDescription className="text-base">
            Fill in the details to create your new event.
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto pr-2 pb-2">
          <form onSubmit={handleSubmit} className="space-y-5">
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
                            {organizer.user?.first_name || organizer.name || `ID: ${organizer.id}`}
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
                      {selectedOrganizerDetails.user?.first_name && <p>Name: {selectedOrganizerDetails.user.first_name}</p>}
                      {selectedOrganizerDetails.user?.email && <p>Email: {selectedOrganizerDetails.user.email}</p>}
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
              
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="featured" className="text-sm font-medium">Featured</Label>
                <Checkbox
                  id="featured"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
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
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="border-slate-200"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
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
  );
};

export default CreateEventDialog;