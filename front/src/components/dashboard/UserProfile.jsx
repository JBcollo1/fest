import React, { useEffect, useState, useRef } from "react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  UserCircle, 
  Mail, 
  Edit, 
  Loader, 
  Phone, 
  User, 
  Users, 
  Ticket, 
  LogOut, 
  Check, 
  AlertCircle, 
  X,
  Image,
  Loader2,
  Calendar,
  Shield,
  Camera
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { uploadImage } from "@/utils/imageUpload";
import { useToast } from "@/components/ui/use-toast";

const UserProfile = () => {
  const { user, fetchUserData, updateUserData, logout } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success', 'error', or null
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("personal");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    next_of_kin_name: "",
    next_of_kin_contact: "",
    photo_img: ""
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        setError(null);
        await fetchUserData();
      } catch (err) {
        setError(err.message || 'Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
        next_of_kin_name: user.next_of_kin_name || "",
        next_of_kin_contact: user.next_of_kin_contact || "",
        photo_img: user.photo_img || ""
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setSaveStatus(null);
    // Reset to original data if canceling
    if (isEditing) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
        next_of_kin_name: user.next_of_kin_name || "",
        next_of_kin_contact: user.next_of_kin_contact || "",
        photo_img: user.photo_img || ""
      });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaveStatus(null);
      await updateUserData(formData);
      setSaveStatus('success');
      setIsEditing(false);
      await fetchUserData();

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
        variant: "success",
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    } catch (err) {
      setSaveStatus('error');
      setError(err.message || "Failed to update profile");
      
      toast({
        title: "Error",
        description: err.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const result = await uploadImage(file, {
        isPrivate: true, 
        target: 'user'
      });
      setFormData(prev => ({
        ...prev,
        photo_img: result.url
      }));
      toast({
        title: "Success",
        description: "Profile image uploaded successfully",
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

  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
    } else if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return "U";
  };

  const getFullName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    } else if (user?.username) {
      return user.username;
    }
    return "User";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg font-medium font-display">Loading your profile information...</p>
          <p className="text-sm text-muted-foreground mt-2 font-sans">This will only take a moment</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <Card className="w-full max-w-3xl mx-auto shadow-lg border-red-200 animate-fade-in">
        <CardContent className="pt-6">
          <div className="text-center p-6 bg-red-50 rounded-md">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <div className="text-red-500 font-medium text-lg mb-2 font-display">Error Loading Profile</div>
            <p className="text-gray-600 font-sans">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="w-full max-w-3xl mx-auto shadow-glass bg-white/90 animate-fade-in">
        <CardContent className="pt-6">
          <div className="text-center p-6 bg-amber-50 rounded-md">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <div className="text-amber-600 font-medium text-lg mb-2 font-display">Not Signed In</div>
            <p className="text-gray-600 font-sans">Please log in to view and manage your profile</p>
            <Button className="mt-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700">
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const SaveStatusAlert = () => {
    if (!saveStatus) return null;
    
    return (
      <div className={`flex items-center gap-2 p-3 rounded-md mt-4 animate-scale-in ${
        saveStatus === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
      }`}>
        {saveStatus === 'success' ? (
          <>
            <Check className="h-5 w-5" />
            <span>Profile updated successfully!</span>
          </>
        ) : (
          <>
            <X className="h-5 w-5" />
            <span>Failed to update profile. Please try again.</span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-12 px-4 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-3 flex items-center gap-3 font-display">
          <UserCircle className="h-8 w-8 text-primary" />
          My Profile
        </h1>
        <p className="text-muted-foreground mb-10 text-lg font-sans">Manage your account information and preferences</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column - User Card */}
          <div className="lg:col-span-1">
            <Card className="shadow-glass border border-border/40 overflow-hidden bg-white/90 h-full">
              <div className="bg-gradient-radial from-primary/20 to-primary/5 h-32 relative" />
              <div className="flex justify-center">
                <div className="relative">
                  <Avatar className="h-28 w-28 border-4 border-white rounded-full -mt-14 shadow-lg">
                    <AvatarImage src={formData.photo_img} alt="Profile" className="object-cover" />
                    <AvatarFallback className="text-3xl font-bold bg-primary text-white">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="absolute bottom-0 right-0 rounded-full bg-white shadow-md hover:bg-gray-100"
                      onClick={() => fileInputRef.current.click()}
                    >
                      <Camera className="w-4 h-4" />
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleImageUpload}
                      />
                    </Button>
                  )}
                </div>
              </div>
              
              <CardContent className="pt-4 text-center">
                <div className="space-y-1 mb-3">
                  <h2 className="text-xl font-semibold font-display">
                    {getFullName()}
                  </h2>
                  <p className="text-muted-foreground text-sm font-sans">{user.email}</p>
                </div>
                
                <div className="flex justify-center mt-2">
                  <Badge variant="outline" className="px-3 py-1 mb-2 bg-primary/5 font-normal flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {user.roles?.includes("admin") ? "Administrator" : "Member"}
                  </Badge>
                </div>
                
                <Separator className="my-4" />
                
                <div className="text-sm space-y-4 font-sans">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{user.phone || "No phone number"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Member since {new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <Button variant="destructive" className="mt-6 w-full" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column - Tabs and Content */}
          <div className="lg:col-span-3">
            <Card className="shadow-glass border border-border/40 bg-white/90">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="font-display text-2xl">Account Information</CardTitle>
                  <Button 
                    onClick={handleEditToggle} 
                    variant={isEditing ? "outline" : "default"}
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    {isEditing ? "Cancel" : "Edit Profile"}
                  </Button>
                </div>
                <CardDescription className="font-sans text-base">
                  Update your personal details and emergency contacts
                </CardDescription>
              </CardHeader>
              
              <Tabs defaultValue="personal" className="w-full" onValueChange={setActiveTab}>
                <div className="px-6">
                  <TabsList className="grid grid-cols-2 w-full max-w-md">
                    <TabsTrigger value="personal" className="font-sans">Personal Info</TabsTrigger>
                    <TabsTrigger value="emergency" className="font-sans">Emergency Contacts</TabsTrigger>
                  </TabsList>
                </div>
                
                <CardContent className="pt-6">
                  <TabsContent value="personal" className="space-y-6 animate-fade-in">
                    {isEditing ? (
                      <form onSubmit={handleFormSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="username" className="font-sans text-sm">Username</Label>
                            <Input 
                              id="username" 
                              name="username" 
                              value={formData.username} 
                              onChange={handleInputChange} 
                              className="w-full font-sans"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email" className="font-sans text-sm">Email Address</Label>
                            <Input 
                              id="email" 
                              name="email" 
                              type="email"
                              value={formData.email} 
                              onChange={handleInputChange} 
                              className="w-full font-sans"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="first_name" className="font-sans text-sm">First Name</Label>
                            <Input 
                              id="first_name" 
                              name="first_name" 
                              value={formData.first_name} 
                              onChange={handleInputChange} 
                              className="w-full font-sans"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="last_name" className="font-sans text-sm">Last Name</Label>
                            <Input 
                              id="last_name" 
                              name="last_name" 
                              value={formData.last_name} 
                              onChange={handleInputChange} 
                              className="w-full font-sans"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone" className="font-sans text-sm">Phone Number</Label>
                            <Input 
                              id="phone" 
                              name="phone" 
                              value={formData.phone} 
                              onChange={handleInputChange} 
                              className="w-full font-sans"
                            />
                          </div>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <Label className="font-sans text-sm text-muted-foreground">Username</Label>
                            <p className="font-medium font-sans">{formData.username || "Not provided"}</p>
                          </div>
                          <div className="space-y-1">
                            <Label className="font-sans text-sm text-muted-foreground">Email Address</Label>
                            <p className="font-medium font-sans">{formData.email || "Not provided"}</p>
                          </div>
                          <div className="space-y-1">
                            <Label className="font-sans text-sm text-muted-foreground">First Name</Label>
                            <p className="font-medium font-sans">{formData.first_name || "Not provided"}</p>
                          </div>
                          <div className="space-y-1">
                            <Label className="font-sans text-sm text-muted-foreground">Last Name</Label>
                            <p className="font-medium font-sans">{formData.last_name || "Not provided"}</p>
                          </div>
                          <div className="space-y-1">
                            <Label className="font-sans text-sm text-muted-foreground">Phone Number</Label>
                            <p className="font-medium font-sans">{formData.phone || "Not provided"}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="emergency" className="space-y-6 animate-fade-in">
                    {isEditing ? (
                      <form onSubmit={handleFormSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="next_of_kin_name" className="font-sans text-sm">Next of Kin Name</Label>
                            <Input 
                              id="next_of_kin_name" 
                              name="next_of_kin_name" 
                              value={formData.next_of_kin_name} 
                              onChange={handleInputChange} 
                              className="w-full font-sans"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="next_of_kin_contact" className="font-sans text-sm">Next of Kin Contact</Label>
                            <Input 
                              id="next_of_kin_contact" 
                              name="next_of_kin_contact" 
                              value={formData.next_of_kin_contact} 
                              onChange={handleInputChange} 
                              className="w-full font-sans"
                            />
                          </div>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <Label className="font-sans text-sm text-muted-foreground">Next of Kin Name</Label>
                            <p className="font-medium font-sans">{formData.next_of_kin_name || "Not provided"}</p>
                          </div>
                          <div className="space-y-1">
                            <Label className="font-sans text-sm text-muted-foreground">Next of Kin Contact</Label>
                            <p className="font-medium font-sans">{formData.next_of_kin_contact || "Not provided"}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </CardContent>
                
                {isEditing && (
                  <CardFooter className="flex justify-end border-t border-border/40 pt-4 pb-6">
                    <Button type="button" variant="outline" className="mr-2" onClick={handleEditToggle}>
                      Cancel
                    </Button>
                    <Button type="button" onClick={handleFormSubmit} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary">
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </CardFooter>
                )}
              </Tabs>
            </Card>
            
            <SaveStatusAlert />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;