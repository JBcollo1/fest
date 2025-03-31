import { useState, useEffect, useRef } from "react";
import { AlertCircle, Loader2, Calendar, MapPin, Tag, Image, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadImage } from "@/utils/imageUpload";
import { useToast } from "@/components/ui/use-toast";
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
import {
  Card,
  CardContent,
} from "@/components/ui/card";

const CreateEventDialog = ({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isadmin, 
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
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const submitButtonRef = useRef(null);
  const formRef = useRef(null);
  const fileInputRef = useRef(null);
  const [ticketTypes, setTicketTypes] = useState([{ name: "", price: "", quantity: "" }]);

  // Reset form when dialog opens or closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  // Ensure form is scrollable when dialog opens
  useEffect(() => {
    if (open && formRef.current) {
      // Reset scroll position to top when dialog opens
      formRef.current.scrollTop = 0;
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
    setTicketTypes([{ name: "", price: "", quantity: "" }]);
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

  const handleTicketTypeChange = (index, field, value) => {
    const updatedTicketTypes = [...ticketTypes];
    updatedTicketTypes[index][field] = value;
    setTicketTypes(updatedTicketTypes);
  };

  const addTicketType = () => {
    setTicketTypes([...ticketTypes, { name: "", price: "", quantity: "" }]);
  };

  const removeTicketType = (index) => {
    const updatedTicketTypes = ticketTypes.filter((_, i) => i !== index);
    setTicketTypes(updatedTicketTypes);
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
    if (isadmin && !organizerId) {
      setFormError("Please select an organizer");
      return false;
    }
    for (const ticketType of ticketTypes) {
      if (!ticketType.name) {
        setFormError("Ticket type name is required");
        return false;
      }
      if (!ticketType.price || isNaN(parseFloat(ticketType.price)) || parseFloat(ticketType.price) < 0) {
        setFormError("Valid ticket type price is required");
        return false;
      }
      if (!ticketType.quantity || isNaN(parseInt(ticketType.quantity)) || parseInt(ticketType.quantity) <= 0) {
        setFormError("Valid ticket type quantity is required");
        return false;
      }
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
      ...(isadmin && organizerId && { organizer_id: organizerId }),
      featured,
      ticket_types: ticketTypes.map(tt => ({
        name: tt.name,
        price: parseFloat(tt.price),
        quantity: parseInt(tt.quantity),
      })),
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const result = await uploadImage(file, {
        isPrivate: false, // Event images are public
        target: 'event'
      });
      setImage(result.url);
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 sticky top-0 bg-white dark:bg-slate-950 z-10">
          <DialogTitle className="text-2xl font-bold text-primary">Create New Event</DialogTitle>
          <DialogDescription className="text-base">
            Fill in the details to create your new event.
          </DialogDescription>
        </DialogHeader>
        
        <div 
          ref={formRef} 
          className="overflow-y-auto pr-2 pb-2 flex-grow"
          style={{ maxHeight: "calc(90vh - 180px)" }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {formError && (
              <div className="bg-red-50 text-red-800 p-4 rounded-md text-sm border border-red-200 flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}
            
            {/* Organizer Selection (admin only) */}
            {isadmin && (
              <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium">Organizer Information</h3>
                    <div className="space-y-2">
                      <Label htmlFor="organizerId" className="text-sm font-medium">Select Organizer *</Label>
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
                        <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-md text-sm border border-slate-200 dark:border-slate-700">
                          <p className="font-medium mb-2 text-primary">Selected Organizer Details:</p>
                          <div className="space-y-1">
                            <p>ID: {selectedOrganizerDetails.id}</p>
                            {selectedOrganizerDetails.user?.first_name && <p>Name: {selectedOrganizerDetails.user.first_name}</p>}
                            {selectedOrganizerDetails.user?.email && <p>Email: {selectedOrganizerDetails.user.email}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Basic Event Info */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Event Details</h3>
                  
                  <div className="space-y-2">
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your event..."
                      rows={4}
                      className="focus-visible:ring-primary resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date" className="text-sm font-medium flex items-center">
                        <Calendar className="h-4 w-4 mr-2" /> Start Date & Time *
                      </Label>
                      <Input
                        id="start-date"
                        type="datetime-local"
                        value={startDateTime}
                        onChange={(e) => setStartDateTime(e.target.value)}
                        required
                        className="focus-visible:ring-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="end-date" className="text-sm font-medium flex items-center">
                        <Calendar className="h-4 w-4 mr-2" /> End Date & Time
                      </Label>
                      <Input
                        id="end-date"
                        type="datetime-local"
                        value={endDateTime}
                        onChange={(e) => setEndDateTime(e.target.value)}
                        className="focus-visible:ring-primary"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-sm font-medium flex items-center">
                        <MapPin className="h-4 w-4 mr-2" /> Location *
                      </Label>
                      <Input
                        id="location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Conference Center, New York"
                        required
                        className="focus-visible:ring-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="image" className="text-sm font-medium flex items-center">
                        <Image className="h-4 w-4 mr-2" /> Event Image
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          ref={fileInputRef}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Image className="h-4 w-4 mr-2" />
                              Choose Image
                            </>
                          )}
                        </Button>
                        {image && (
                          <div className="relative w-20 h-20">
                            <img
                              src={image}
                              alt="Preview"
                              className="w-full h-full object-cover rounded-md"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6"
                              onClick={() => setImage("")}
                            >
                              ×
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ticket Info */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Ticket Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-sm font-medium flex items-center">
                        <Tag className="h-4 w-4 mr-2" /> Price (KES) *
                      </Label>
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
                    
                    <div className="space-y-2">
                      <Label htmlFor="total-tickets" className="text-sm font-medium flex items-center">
                        <Users className="h-4 w-4 mr-2" /> Total Tickets *
                      </Label>
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
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ticket Types */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Ticket Types</h3>
                  {ticketTypes.map((ticketType, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`ticket-type-name-${index}`} className="text-sm font-medium">Name *</Label>
                        <Input
                          id={`ticket-type-name-${index}`}
                          value={ticketType.name}
                          onChange={(e) => handleTicketTypeChange(index, 'name', e.target.value)}
                          placeholder="Regular"
                          required
                          className="focus-visible:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`ticket-type-price-${index}`} className="text-sm font-medium">Price (KES) *</Label>
                        <Input
                          id={`ticket-type-price-${index}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={ticketType.price}
                          onChange={(e) => handleTicketTypeChange(index, 'price', e.target.value)}
                          placeholder="999.99"
                          required
                          className="focus-visible:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`ticket-type-quantity-${index}`} className="text-sm font-medium">Quantity *</Label>
                        <Input
                          id={`ticket-type-quantity-${index}`}
                          type="number"
                          min="1"
                          value={ticketType.quantity}
                          onChange={(e) => handleTicketTypeChange(index, 'quantity', e.target.value)}
                          placeholder="100"
                          required
                          className="focus-visible:ring-primary"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="mt-6"
                        onClick={() => removeTicketType(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addTicketType}>
                    Add Ticket Type
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Featured Toggle */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="featured"
                      checked={featured}
                      onCheckedChange={setFeatured}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label 
                      htmlFor="featured" 
                      className="text-sm font-medium cursor-pointer"
                    >
                      Mark as Featured Event
                    </Label>
                  </div>
                  <div className="text-xs text-slate-500">
                    Featured events appear at the top of the list
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
        
        <DialogFooter className="mt-4 pt-4 border-t sticky bottom-0 bg-white dark:bg-slate-950 z-10">
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