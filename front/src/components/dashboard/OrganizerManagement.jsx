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

  // Check if user is admin
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

  const loadOrganizers = async () => {
    try {
      setLoading(true);
      const data = await fetchAllOrganizers();
      setOrganizers(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load organizers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await fetchAllUsers();
      // Filter out users who are already organizers
      const organizerUserIds = organizers.map(org => org.user_id);
      const availableUsers = data.filter(
        user => !organizerUserIds.includes(user.id)
      );
      setUsers(availableUsers);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadOrganizers();
  }, []);

  useEffect(() => {
    if (!isAddDialogOpen) {
      loadUsers();
    }
  }, [organizers, isAddDialogOpen]);

  const handleAddOrganizer = async (e) => {
    e.preventDefault();
    
    console.log('Form values:', {
      selectedUserId,
      companyName,
      companyImage,
      contactEmail,
      contactPhone
    });

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

  const handleRemoveOrganizer = async (userId) => {
    if (!confirm("Are you sure you want to remove this organizer role?")) {
      return;
    }

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/users/organizers/${userId}`,
        { withCredentials: true }
      );

      toast({
        title: "Success",
        description: "Organizer role removed successfully",
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
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
                  <Select
                    value={selectedUserId}
                    onValueChange={setSelectedUserId}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.first_name} {user.last_name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
          ) : organizers.length === 0 ? (
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
                      {organizer.user?.first_name} {organizer.user?.last_name}
                      <div className="text-sm text-muted-foreground">
                        {organizer.user?.email}
                      </div>
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
                      <div>{organizer.contact_email || organizer.user?.email}</div>
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
                        <XCircle className="h-4 w-4" />
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