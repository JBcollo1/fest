import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Pencil, Trash2, CheckCircle, XCircle, Image, Search } from "lucide-react";
import { uploadImage } from "@/utils/imageUpload";
import {useTheme} from "@/contexts/ThemeContext";

const OrganizerManagement = () => {
  const { toast } = useToast();
  const { user, fetchAllUsers, fetchAllOrganizers, createOrganizer, updateOrganizer, deleteOrganizer } = useAuth();
  const [loading, setLoading] = useState(true);
  const [organizers, setOrganizers] = useState([]);
  const [users, setUsers] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedOrganizer, setSelectedOrganizer] = useState(null);
  
  // Form states
  const [selectedUserId, setSelectedUserId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyImage, setCompanyImage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [kraPin, setKraPin] = useState("");
  const [bankDetails, setBankDetails] = useState("");
  const [physicalAddress, setPhysicalAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const { isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredOrganizers, setFilteredOrganizers] = useState([]);
  const [dialogSearchQuery, setDialogSearchQuery] = useState("");
  const [filteredDialogUsers, setFilteredDialogUsers] = useState([]);

  useEffect(() => {
    console.log('Current users:', users);
    console.log('Current organizers:', organizers);
  }, [users, organizers]);

  const loadOrganizers = async () => {
    try {
      setLoading(true);
      const response = await fetchAllOrganizers();
      console.log('Raw organizers data:', response);

      // Access the 'data' property of the response
      const data = response.data;

      if (!Array.isArray(data)) {
        throw new Error("Organizers data is not an array");
      }

      const organizersWithUsers = data.map(org => {
        if (!org.user || typeof org.user !== 'object') {
          console.warn(`Organizer with ID ${org.id} has invalid or missing user data`);
        }
        return {
          ...org,
          user: typeof org.user === 'object' ? org.user : { message: "User data missing or invalid" }
        };
      });

      console.log('Processed organizers:', organizersWithUsers);
      setOrganizers(organizersWithUsers);
    } catch (error) {
      console.error('Error loading organizers:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load organizers",
        variant: "destructive",
      });
      setOrganizers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetchAllUsers();
      console.log('Raw users data:', response);

      // Access the 'data' property of the response
      const data = response.data;

      // Ensure data is an array before filtering
      const availableUsers = Array.isArray(data) ? data.filter(user => {
        const isAlreadyOrganizer = organizers.some(org => org.user_id === user.id);
        console.log(`User ${user.id}: isAlreadyOrganizer = ${isAlreadyOrganizer}`);
        return !isAlreadyOrganizer;
      }) : [];

      console.log('Filtered available users:', availableUsers);
      setUsers(availableUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
      setUsers([]);
    }
  };

  useEffect(() => {
    loadOrganizers();
  }, []);

  useEffect(() => {
    if (isAddDialogOpen) {
      loadUsers();
    }
  }, [isAddDialogOpen, organizers]);

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
        const contactEmail = organizer.contact_email?.toLowerCase() || '';
        const contactPhone = organizer.contact_phone?.toLowerCase() || '';
        
        return name.includes(searchLower) || 
               email.includes(searchLower) || 
               companyName.includes(searchLower) ||
               contactEmail.includes(searchLower) ||
               contactPhone.includes(searchLower);
      });
      setFilteredOrganizers(filtered);
    }
  }, [searchQuery, organizers]);

  // Filter users in dialog based on search query
  useEffect(() => {
    if (dialogSearchQuery.trim() === "") {
      setFilteredDialogUsers(users);
    } else {
      const filtered = users.filter(user => {
        const searchLower = dialogSearchQuery.toLowerCase();
        const name = user.first_name?.toLowerCase() || '';
        const email = user.email?.toLowerCase() || '';
        return name.includes(searchLower) || email.includes(searchLower);
      });
      setFilteredDialogUsers(filtered);
    }
  }, [dialogSearchQuery, users]);

  const handleAddOrganizer = async (e) => {
    e.preventDefault();
    
    if (!selectedUserId || !companyName) {
      toast({
        title: "Error",
        description: "User and company name are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      
      const formData = new FormData();
      
      // Ensure user_id is a string
      formData.append('user_id', String(selectedUserId));
      formData.append('company_name', companyName);
      
      // Only append non-empty values
      if (contactEmail) formData.append('contact_email', contactEmail);
      if (contactPhone) formData.append('contact_phone', contactPhone);
      if (kraPin) formData.append('kra_pin', kraPin);
      if (bankDetails) formData.append('bank_details', bankDetails);
      if (physicalAddress) formData.append('physical_address', physicalAddress);
      if (contactPerson) formData.append('contact_person', contactPerson);
      
      // Handle file upload
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      console.log("Submitting organizer form with data:", {
        user_id: selectedUserId,
        company_name: companyName,
        hasFile: !!selectedFile
      });

      await createOrganizer(formData);

      toast({
        title: "Success",
        description: "Organizer added successfully",
      });

      // Reset form and close dialog
      setSelectedUserId("");
      setCompanyName("");
      setCompanyImage("");
      setContactEmail("");
      setContactPhone("");
      setKraPin("");
      setBankDetails("");
      setPhysicalAddress("");
      setContactPerson("");
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsAddDialogOpen(false);

      // Refresh the organizers list
      loadOrganizers();
    } catch (error) {
      console.error('Error adding organizer:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add organizer",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditOrganizer = async () => {
    if (!selectedOrganizer || !companyName) {
      toast({
        title: "Error",
        description: "Company name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      
      const formData = new FormData();
      
      formData.append('company_name', companyName);
      formData.append('contact_email', contactEmail);
      formData.append('contact_phone', contactPhone);
      formData.append('kra_pin', kraPin);
      formData.append('bank_details', bankDetails);
      formData.append('physical_address', physicalAddress);
      formData.append('contact_person', contactPerson);
      
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      await updateOrganizer(selectedOrganizer.id, formData);

      toast({
        title: "Success",
        description: "Organizer updated successfully",
      });

      // Reset form and close dialog
      setSelectedOrganizer(null);
      setCompanyName("");
      setCompanyImage("");
      setContactEmail("");
      setContactPhone("");
      setKraPin("");
      setBankDetails("");
      setPhysicalAddress("");
      setContactPerson("");
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsEditDialogOpen(false);

      // Refresh organizers list
      loadOrganizers();
    } catch (error) {
      console.error("Error updating organizer:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update organizer",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteOrganizer = async (organizerId) => {
    if (!confirm("Are you sure you want to remove this organizer?")) {
      return;
    }

    try {
      await deleteOrganizer(organizerId);

      toast({
        title: "Success",
        description: "Organizer removed successfully",
      });

      // Refresh organizers list
      loadOrganizers();
    } catch (error) {
      console.error("Error removing organizer:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to remove organizer",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (organizer) => {
    setSelectedOrganizer(organizer);
    setCompanyName(organizer.company_name);
    setCompanyImage(organizer.company_image || "");
    setContactEmail(organizer.contact_email || "");
    setContactPhone(organizer.contact_phone || "");
    setKraPin(organizer.kra_pin || "");
    setBankDetails(organizer.bank_details || "");
    setPhysicalAddress(organizer.physical_address || "");
    setContactPerson(organizer.contact_person || "");
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsEditDialogOpen(true);
  };

  const handleRemoveOrganizer = async (organizerId) => {
    if (!confirm("Are you sure you want to remove this organizer role?")) {
      return;
    }

    try {
      await deleteOrganizer(organizerId);

      toast({
        title: "Success",
        description: "Organizer removed successfully",
      });

      setOrganizers(organizers.filter(org => org.id !== organizerId));
    } catch (error) {
      console.error("Error removing organizer:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to remove organizer",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Preview the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
        console.log("Preview URL set:", reader.result); // Debug log
      };
      reader.readAsDataURL(file);
      setSelectedFile(file);
      
      setErrors(prev => ({
        ...prev,
        company_image: undefined
      }));
    }
  };

  if (!user?.roles?.includes("admin")) {
    return (
      <div className="text-center p-6">
        <h2 className="text-xl font-bold text-red-500">Access Denied</h2>
        <p className="text-gray-600 mt-2">
          You do not have permission to access this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Organizer Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => loadUsers()}>
              <Plus className="mr-2 h-4 w-4" /> Add Organizer
            </Button>
          </DialogTrigger>
          <DialogContent className={`sm:max-w-[425px] max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-slate-900 text-white' : ''}`}>
            <DialogHeader>
              <DialogTitle className={isDarkMode ? 'text-white' : ''}>Add New Organizer</DialogTitle>
              <DialogDescription className={isDarkMode ? 'text-slate-300' : ''}>
                Promote a user to organizer by adding their company details.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleAddOrganizer(e);
            }}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="user" className={`text-right ${isDarkMode ? 'text-slate-300' : ''}`}>
                    User
                  </Label>
                  <div className="col-span-3 space-y-2">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className={`h-4 w-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
                      </div>
                      <Input
                        type="text"
                        placeholder="Search users..."
                        value={dialogSearchQuery}
                        onChange={(e) => setDialogSearchQuery(e.target.value)}
                        className={`pl-10 w-full ${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : ''}`}
                      />
                    </div>
                    <Select
                      value={selectedUserId}
                      onValueChange={setSelectedUserId}
                    >
                      <SelectTrigger className={`w-full ${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : ''}`}>
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent className={isDarkMode ? 'bg-slate-800 text-white border-slate-700' : ''}>
                        {filteredDialogUsers.length > 0 ? (
                          filteredDialogUsers.map((user) => (
                            <SelectItem 
                              key={user.id} 
                              value={String(user.id)}
                              className={isDarkMode ? 'hover:bg-slate-700 focus:bg-slate-700' : ''}
                            >
                              {`${user.first_name || ''} ${user.last_name || ''} (${user.email})`}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem 
                            value="no-users" 
                            disabled
                            className={isDarkMode ? 'text-slate-400' : ''}
                          >
                            No available users found
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="company-name" className={`text-right ${isDarkMode ? 'text-slate-300' : ''}`}>
                    Company Name
                  </Label>
                  <Input
                    id="company-name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className={`${isDarkMode ? 'bg-slate-800 text-white' : ''} col-span-3`}
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="company-image" className={`text-right ${isDarkMode ? 'text-slate-300' : ''}`}>
                    Company Image
                  </Label>
                  <div className="col-span-3 flex flex-col items-start gap-2">
                    {previewUrl && (
                      <div className="relative w-32 h-32 rounded-md overflow-hidden border mb-2">
                        <img 
                          src={previewUrl} 
                          alt="Company Preview" 
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => {
                            setCompanyImage("");
                            setPreviewUrl(null);
                            setSelectedFile(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                        >
                          ×
                        </Button>
                      </div>
                    )}
                    {!previewUrl && companyImage && (
                      <div className="relative w-32 h-32 rounded-md overflow-hidden border mb-2">
                        <img 
                          src={companyImage} 
                          alt="Company Preview" 
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => {
                            setCompanyImage("");
                            setPreviewUrl(null);
                            setSelectedFile(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                        >
                          ×
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Input
                        id="company-image"
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
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
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="contact-email" className={`text-right ${isDarkMode ? 'text-slate-300' : ''}`}>
                    Contact Email
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className={`${isDarkMode ? 'bg-slate-800 text-white' : ''} col-span-3`}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="contact-phone" className={`text-right ${isDarkMode ? 'text-slate-300' : ''}`}>
                    Contact Phone
                  </Label>
                  <Input
                    id="contact-phone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className={`${isDarkMode ? 'bg-slate-800 text-white' : ''} col-span-3`}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="kra-pin" className={`text-right ${isDarkMode ? 'text-slate-300' : ''}`}>
                    KRA PIN
                  </Label>
                  <Input
                    id="kra-pin"
                    value={kraPin}
                    onChange={(e) => setKraPin(e.target.value)}
                    className={`${isDarkMode ? 'bg-slate-800 text-white' : ''} col-span-3`}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="bank-details" className={`text-right ${isDarkMode ? 'text-slate-300' : ''}`}>
                    Bank Details
                  </Label>
                  <Input
                    id="bank-details"
                    value={bankDetails}
                    onChange={(e) => setBankDetails(e.target.value)}
                    className={`${isDarkMode ? 'bg-slate-800 text-white' : ''} col-span-3`}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="physical-address" className={`text-right ${isDarkMode ? 'text-slate-300' : ''}`}>
                    Physical Address
                  </Label>
                  <Input
                    id="physical-address"
                    value={physicalAddress}
                    onChange={(e) => setPhysicalAddress(e.target.value)}
                    className={`${isDarkMode ? 'bg-slate-800 text-white' : ''} col-span-3`}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="contact-person" className={`text-right ${isDarkMode ? 'text-slate-300' : ''}`}>
                    Contact Person
                  </Label>
                  <Input
                    id="contact-person"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className={`${isDarkMode ? 'bg-slate-800 text-white' : ''} col-span-3`}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className={isDarkMode ? 'bg-primary hover:bg-primary/90' : ''}>
                  Add Organizer
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Organizer</DialogTitle>
              <DialogDescription>
                Update the organizer's company details.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-company-name" className="text-right">
                  Company Name
                </Label>
                <Input
                  id="edit-company-name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className={`${isDarkMode ? 'bg-muted text-white' : ''} col-span-3`}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-company-image" className="text-right">
                  Company Image
                </Label>
                <div className="col-span-3 flex flex-col items-start gap-2">
                  {previewUrl && (
                    <div className="relative w-32 h-32 rounded-md overflow-hidden border mb-2">
                      <img 
                        src={previewUrl} 
                        alt="Company Preview" 
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => {
                          setCompanyImage("");
                          setPreviewUrl(null);
                          setSelectedFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  )}
                  {!previewUrl && companyImage && (
                    <div className="relative w-32 h-32 rounded-md overflow-hidden border mb-2">
                      <img 
                        src={companyImage} 
                        alt="Company Preview" 
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => {
                          setCompanyImage("");
                          setPreviewUrl(null);
                          setSelectedFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      id="edit-company-image"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
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
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-contact-email" className="text-right">
                  Contact Email
                </Label>
                <Input
                  id="edit-contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className={`${isDarkMode ? 'bg-muted text-white' : ''} col-span-3`}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-contact-phone" className="text-right">
                  Contact Phone
                </Label>
                <Input
                  id="edit-contact-phone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className={`${isDarkMode ? 'bg-muted text-white' : ''} col-span-3`}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleEditOrganizer}>
                Update Organizer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organizers</CardTitle>
          <CardDescription>
            Manage users with organizer privileges
          </CardDescription>
          <div className="relative mt-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search organizers by name, email, company, or contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-6">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => loadUsers()}>
                  <Plus className="mr-2 h-4 w-4" /> Add Organizer
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !Array.isArray(filteredOrganizers) || filteredOrganizers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No organizers found matching your search." : "No organizers found. Add one to get started."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrganizers.map((organizer) => (
                  <TableRow key={organizer.id}>
                    <TableCell className="font-medium">
                      {organizer.user ? (
                        <>
                          {`${organizer.user.first_name || ''} ${organizer.user.last_name || ''}`}
                          <div className="text-sm text-muted-foreground">
                            {organizer.user.email}
                          </div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">User not found</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {organizer.company_image && (
                          <img
                            src={organizer.company_image}
                            alt={organizer.company_name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        )}
                        <span>{organizer.company_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{organizer.contact_email || organizer.user?.email || 'No email'}</div>
                      <div className="text-sm text-muted-foreground">
                        {organizer.contact_phone || organizer.user?.phone || "No phone"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(organizer)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveOrganizer(organizer.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizerManagement;