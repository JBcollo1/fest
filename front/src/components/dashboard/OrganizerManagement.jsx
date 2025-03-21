import { useState, useEffect } from "react";
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
import { Loader2, Plus, Pencil, Trash2, CheckCircle, XCircle } from "lucide-react";

const OrganizerManagement = () => {
  const { toast } = useToast();
  const { user, fetchAllUsers, fetchAllOrganizers } = useAuth();
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
      // First create the organizer record
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/organizers`,
        {
          user_id: selectedUserId,
          company_name: companyName,
          company_image: companyImage,
          contact_email: contactEmail,
          contact_phone: contactPhone,
        },
        { withCredentials: true }
      );

      // Assign organizer role to the user
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/users/${selectedUserId}/roles`,
        {
          role: "organizer"
        },
        { withCredentials: true }
      );

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
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/organizers/${selectedOrganizer.id}`,
        {
          company_name: companyName,
          company_image: companyImage,
          contact_email: contactEmail,
          contact_phone: contactPhone,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

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
    }
  };

  const handleDeleteOrganizer = async (organizerId) => {
    if (!confirm("Are you sure you want to remove this organizer?")) {
      return;
    }

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/organizers/${organizerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

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
    setIsEditDialogOpen(true);
  };

  const handleRemoveOrganizer = async (organizerId) => {
    if (!confirm("Are you sure you want to remove this organizer role?")) {
      return;
    }

    try {
      // First remove the organizer record
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/organizers/${organizerId}`,
        { withCredentials: true }
      );

      // Then remove the organizer role from the user
      const organizer = organizers.find(org => org.id === organizerId);
      if (organizer?.user_id) {
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/api/users/${organizer.user_id}/roles/organizer`,
          { withCredentials: true }
        );
      }

      toast({
        title: "Success",
        description: "Organizer removed successfully",
      });

      loadOrganizers();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to remove organizer",
        variant: "destructive",
      });
    }
  };

  if (!user?.roles?.includes("Admin")) {
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
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Organizer</DialogTitle>
              <DialogDescription>
                Promote a user to organizer by adding their company details.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleAddOrganizer(e);
            }}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="user" className="text-right">
                    User
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={selectedUserId}
                      onValueChange={setSelectedUserId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.length > 0 ? (
                          users.map((user) => (
                            <SelectItem 
                              key={user.id} 
                              value={String(user.id)}
                            >
                              {`${user.first_name || ''} ${user.last_name || ''} (${user.email})`}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem 
                            value="no-users" 
                            disabled
                          >
                            No available users found
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="company-name" className="text-right">
                    Company Name
                  </Label>
                  <Input
                    id="company-name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="company-image" className="text-right">
                    Company Image URL
                  </Label>
                  <Input
                    id="company-image"
                    value={companyImage}
                    onChange={(e) => setCompanyImage(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="contact-email" className="text-right">
                    Contact Email
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="contact-phone" className="text-right">
                    Contact Phone
                  </Label>
                  <Input
                    id="contact-phone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Add Organizer</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
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
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-company-image" className="text-right">
                  Company Image URL
                </Label>
                <Input
                  id="edit-company-image"
                  value={companyImage}
                  onChange={(e) => setCompanyImage(e.target.value)}
                  className="col-span-3"
                />
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
                  className="col-span-3"
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
                  className="col-span-3"
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
          ) : !Array.isArray(organizers) || organizers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No organizers found. Add one to get started.
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
                {organizers.map((organizer) => (
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