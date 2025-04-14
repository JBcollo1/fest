import { useState, useEffect, useRef } from "react";
import { AlertCircle, Loader2, Calendar, MapPin, Tag, Image, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
// import { MultiSelect } from "@/components/ui/multi-select";
// import Select from 'react-select';
import { useTheme } from "@/contexts/ThemeContext";

const CreateEventDialog = ({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isadmin, 
  organizers, 
  fetchOrganizerById,
  categories = [],
  
}) => {
  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [location, setLocation] = useState("");
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
  const [ticketTypes, setTicketTypes] = useState([{ name: "", price: "", quantity: "", per_person_limit: "", valid_from: "", valid_to: "" }]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const { isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredOrganizers, setFilteredOrganizers] = useState([]);

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

  // Filter organizers based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredOrganizers(organizers);
    } else {
      const filtered = organizers.filter(organizer => {
        const searchLower = searchQuery.toLowerCase();
        const name = organizer.user?.first_name?.toLowerCase() || '';
        const email = organizer.user?.email?.toLowerCase() || '';
        const companyName = organizer.company_name?.toLowerCase() || '';
        
        return name.includes(searchLower) || 
               email.includes(searchLower) || 
               companyName.includes(searchLower);
      });
      setFilteredOrganizers(filtered);
    }
  }, [searchQuery, organizers]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStartDateTime("");
    setEndDateTime("");
    setLocation("");
    setTotalTickets("");
    setImage("");
    setOrganizerId("");
    setFormError("");
    setSelectedOrganizerDetails(null);
    setIsSubmitting(false);
    setFeatured(false);
    setTicketTypes([{ name: "", price: "", quantity: "", per_person_limit: "", valid_from: "", valid_to: "" }]);
    setSelectedCategories([]);
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
    setTicketTypes([...ticketTypes, { name: "", price: "", quantity: "", per_person_limit: "", valid_from: "", valid_to: "" }]);
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
    // if (!totalTickets || isNaN(parseInt(totalTickets)) || parseInt(totalTickets) <= 0) {
    //   setFormError("Valid number of tickets is required");
    //   return false;
    // }
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
      if (!ticketType.quantity || isNaN(parseInt(ticketType.quantity)) || parseInt(ticketType.quantity) <= 0) {
        setFormError("Valid ticket type quantity is required");
        return false;
      }
    }
    return true;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Preview the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
      setSelectedFile(file);
    }
  };

  const handleCategoryChange = (selectedOptions) => {
    setSelectedCategories(selectedOptions.map(option => option.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
  
    setIsSubmitting(true);
    setFormError("");
  
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("start_datetime", startDateTime);
    formData.append("end_datetime", endDateTime || "");
    formData.append("location", location);
    formData.append("featured", featured);

    // Append the image file directly if it exists
    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    // Append ticket types as JSON string
    formData.append("ticket_types", JSON.stringify(ticketTypes.map(tt => ({
      name: tt.name,
      price: parseFloat(tt.price),
      quantity: parseInt(tt.quantity),
      per_person_limit: tt.per_person_limit ? parseInt(tt.per_person_limit) : null,
      valid_from: tt.valid_from || null,
      valid_to: tt.valid_to || null,
    }))));

    // Append categories as JSON string
    formData.append("categories", JSON.stringify(selectedCategories));

    // Append organizer_id if admin
    if (isadmin && organizerId) {
      formData.append("organizer_id", organizerId);
    }

    try {
      const result = await onSubmit(formData);
      
      if (result === true) {
        // Success, form will be reset when dialog closes
      } else {
        // Error
        setFormError(result.error || "An error occurred");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setFormError("An error occurred while submitting the form");
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-2xl max-h-[90vh] overflow-hidden flex flex-col ${isDarkMode ? 'bg-slate-900 text-white' : ''}`}>
        <DialogHeader className={`pb-4 sticky top-0 ${isDarkMode ? 'bg-slate-900' : 'bg-white'} z-10`}>
          <DialogTitle className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-primary'}`}>Create New Event</DialogTitle>
          <DialogDescription className={isDarkMode ? 'text-slate-300' : ''}>
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
              <div className={`p-4 rounded-md text-sm border flex items-start ${
                isDarkMode ? 'bg-red-900/50 text-red-200 border-red-800' : 'bg-red-50 text-red-800 border-red-200'
              }`}>
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}
            
            {/* Organizer Selection (admin only) */}
            {isadmin && (
              <Card className={`shadow-sm ${isDarkMode ? 'border-slate-800 bg-slate-800' : 'border-slate-200'}`}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : ''}`}>Organizer Information</h3>
                    <div className="space-y-2">
                      <Label htmlFor="organizerId" className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : ''}`}>Select Organizer *</Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className={`h-4 w-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
                        </div>
                        <Input
                          type="text"
                          placeholder="Search organizers..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className={`pl-10 w-full mb-2 ${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : ''}`}
                        />
                      </div>
                      <Select value={organizerId || "none"} onValueChange={handleOrganizerChange}>
                        <SelectTrigger className={`w-full ${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : ''}`}>
                          <SelectValue placeholder="Select an organizer" />
                        </SelectTrigger>
                        <SelectContent className={isDarkMode ? 'bg-slate-800 text-white border-slate-700' : ''}>
                          <SelectItem value="none" disabled className={isDarkMode ? 'text-slate-400' : ''}>
                            -- Select Organizer --
                          </SelectItem>
                          {filteredOrganizers.length > 0 ? (
                            filteredOrganizers.map((organizer) => (
                              <SelectItem 
                                key={organizer.id} 
                                value={organizer.id.toString()}
                                className={isDarkMode ? 'hover:bg-slate-700 focus:bg-slate-700' : ''}
                              >
                                <div className="flex flex-col">
                                  <span>{organizer.user?.first_name || organizer.name || `ID: ${organizer.id}`}</span>
                                  <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                    {organizer.company_name || organizer.user?.email}
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <div className={`p-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-muted-foreground'}`}>No organizers found</div>
                          )}
                        </SelectContent>
                      </Select>

                      {/* Show selected organizer details if available */}
                      {selectedOrganizerDetails && (
                        <div className={`mt-2 p-3 rounded-md text-sm border ${
                          isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-50 text-slate-800 border-slate-200'
                        }`}>
                          <p className={`font-medium mb-2 ${isDarkMode ? 'text-primary' : 'text-primary'}`}>Selected Organizer Details:</p>
                          <div className="space-y-1">
                            <p>ID: {selectedOrganizerDetails.id}</p>
                            {selectedOrganizerDetails.user?.first_name && <p>Name: {selectedOrganizerDetails.user.first_name}</p>}
                            {selectedOrganizerDetails.user?.email && <p>Email: {selectedOrganizerDetails.user.email}</p>}
                            {selectedOrganizerDetails.company_name && <p>Company: {selectedOrganizerDetails.company_name}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Basic Event Info */}
            <Card className={`shadow-sm ${isDarkMode ? 'border-slate-800 bg-slate-800' : 'border-slate-200'}`}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : ''}`}>Event Details</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title" className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : ''}`}>Event Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Tech Conference 2024"
                      required
                      className={`${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : ''} focus-visible:ring-primary`}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description" className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : ''}`}>Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your event..."
                      rows={4}
                      className={`${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : ''} focus-visible:ring-primary resize-none`}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date" className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : ''} flex items-center`}>
                        <Calendar className={`h-4 w-4 mr-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`} /> Start Date & Time *
                      </Label>
                      <Input
                        id="start-date"
                        type="datetime-local"
                        value={startDateTime}
                        onChange={(e) => setStartDateTime(e.target.value)}
                        required
                        className={`${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : ''} focus-visible:ring-primary`}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="end-date" className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : ''} flex items-center`}>
                        <Calendar className={`h-4 w-4 mr-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`} /> End Date & Time
                      </Label>
                      <Input
                        id="end-date"
                        type="datetime-local"
                        value={endDateTime}
                        onChange={(e) => setEndDateTime(e.target.value)}
                        className={`${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : ''} focus-visible:ring-primary`}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location" className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : ''} flex items-center`}>
                        <MapPin className={`h-4 w-4 mr-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`} /> Location *
                      </Label>
                      <Input
                        id="location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Conference Center, New York"
                        required
                        className={`${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : ''} focus-visible:ring-primary`}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="image-upload" className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : ''}`}>Event Image</Label>
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        disabled={isUploading}
                        className={`${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : ''} focus-visible:ring-primary`}
                      />
                      {previewUrl && (
                        <div className="relative w-32 h-32 rounded-full overflow-hidden mt-2">
                          <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="categories" className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : ''}`}>Categories</Label>
                      <Select
                        value={selectedCategories}
                        onValueChange={handleCategoryChange}
                        isMulti
                        placeholder="Select categories"
                        className={`${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : ''} focus-visible:ring-primary`}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select categories" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ticket Info */}
            <Card className={`shadow-sm ${isDarkMode ? 'border-slate-800 bg-slate-800' : 'border-slate-200'}`}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : ''}`}>Ticket Information</h3>
                  
                  {/* Remove total tickets input */}
                </div>
              </CardContent>
            </Card>

            {/* Ticket Types */}
            <Card className={`shadow-sm ${isDarkMode ? 'border-slate-800 bg-slate-800' : 'border-slate-200'}`}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : ''}`}>Ticket Types</h3>
                  {ticketTypes.map((ticketType, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`ticket-type-name-${index}`} className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : ''}`}>Name *</Label>
                        <Input
                          id={`ticket-type-name-${index}`}
                          value={ticketType.name}
                          onChange={(e) => handleTicketTypeChange(index, 'name', e.target.value)}
                          placeholder="Regular"
                          required
                          className={`${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : ''} focus-visible:ring-primary`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`ticket-type-price-${index}`} className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : ''}`}>Price (KES) *</Label>
                        <Input
                          id={`ticket-type-price-${index}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={ticketType.price}
                          onChange={(e) => handleTicketTypeChange(index, 'price', e.target.value)}
                          placeholder="999.99"
                          required
                          className={`${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : ''} focus-visible:ring-primary`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`ticket-type-quantity-${index}`} className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : ''}`}>Quantity *</Label>
                        <Input
                          id={`ticket-type-quantity-${index}`}
                          type="number"
                          min="1"
                          value={ticketType.quantity}
                          onChange={(e) => handleTicketTypeChange(index, 'quantity', e.target.value)}
                          placeholder="100"
                          required
                          className={`${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : ''} focus-visible:ring-primary`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`ticket-type-per-person-limit-${index}`} className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : ''}`}>Per Person Limit</Label>
                        <Input
                          id={`ticket-type-per-person-limit-${index}`}
                          type="number"
                          min="1"
                          value={ticketType.per_person_limit}
                          onChange={(e) => handleTicketTypeChange(index, 'per_person_limit', e.target.value)}
                          placeholder="5"
                          className={`${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : ''} focus-visible:ring-primary`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`ticket-type-valid-from-${index}`} className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : ''}`}>Valid From</Label>
                        <Input
                          id={`ticket-type-valid-from-${index}`}
                          type="datetime-local"
                          value={ticketType.valid_from}
                          onChange={(e) => handleTicketTypeChange(index, 'valid_from', e.target.value)}
                          className={`${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : ''} focus-visible:ring-primary`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`ticket-type-valid-to-${index}`} className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : ''}`}>Valid To</Label>
                        <Input
                          id={`ticket-type-valid-to-${index}`}
                          type="datetime-local"
                          value={ticketType.valid_to}
                          onChange={(e) => handleTicketTypeChange(index, 'valid_to', e.target.value)}
                          className={`${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : ''} focus-visible:ring-primary`}
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
            <Card className={`shadow-sm ${isDarkMode ? 'border-slate-800 bg-slate-800' : 'border-slate-200'}`}>
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
        
        <DialogFooter className={`mt-4 pt-4 border-t sticky bottom-0 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} z-10`}>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className={isDarkMode ? 'border-slate-700 text-white hover:bg-slate-800' : 'border-slate-200'}
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