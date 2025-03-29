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
  Loader2
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

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    } catch (err) {
      setSaveStatus('error');
      setError(err.message || "Failed to update profile");
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg font-medium">Loading your profile information...</p>
          <p className="text-sm text-muted-foreground mt-2">This will only take a moment</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <Card className="w-full max-w-3xl mx-auto shadow-lg border-red-200">
        <CardContent className="pt-6">
          <div className="text-center p-6 bg-red-50 rounded-md">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <div className="text-red-500 font-medium text-lg mb-2">Error Loading Profile</div>
            <p className="text-gray-600">{error}</p>
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
      <Card className="w-full max-w-3xl mx-auto shadow-lg">
        <CardContent className="pt-6">
          <div className="text-center p-6 bg-amber-50 rounded-md">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <div className="text-amber-600 font-medium text-lg mb-2">Not Signed In</div>
            <p className="text-gray-600">Please log in to view and manage your profile</p>
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
      <div className={`flex items-center gap-2 p-3 rounded-md mt-4 ${
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
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
        <UserCircle className="h-7 w-7 text-primary" />
        My Profile
      </h1>
      <p className="text-muted-foreground mb-8">Manage your account information and preferences</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - User Card */}
        <Card className="md:col-span-1 shadow-md border-primary/10 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 h-24 relative" />
          <div className="flex justify-center">
            <Avatar className="h-24 w-24 border-4 border-white rounded-full -mt-12 shadow-lg bg-primary">
              <AvatarFallback className="text-2xl font-bold bg-primary text-white">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <CardContent className="pt-6 text-center">
            <div className="flex justify-center">
              <Badge variant="outline" className="px-3 py-1 mb-2 bg-primary/5 font-normal">
                {user.roles?.includes("admin") ? "admin" : "Member"}
              </Badge>
            </div>
            <h2 className="text-xl font-semibold mb-1 flex justify-center items-center gap-2">
              {user.username}
              {user.username.includes("💀") && (
                <Badge className="bg-black text-white">Premium</Badge>
              )}
            </h2>
            <p className="text-muted-foreground text-sm">{user.email}</p>
            
            <Separator className="my-4" />
            
            <div className="text-sm space-y-3">
              <div className="flex items-center gap-2 justify-center">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{user.phone || "No phone number"}</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Member since {new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            
            <Button variant="destructive" className="mt-6 w-full" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
        
        {/* Right Column - Edit Form */}
        <Card className="md:col-span-2 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Personal Information</span>
              <Button 
                onClick={handleEditToggle} 
                variant={isEditing ? "outline" : "default"}
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                {isEditing ? "Cancel" : "Edit Profile"}
              </Button>
            </CardTitle>
            <CardDescription>
              Update your personal details and emergency contacts
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isEditing ? (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={formData.photo_img} alt="Profile" />
                      <AvatarFallback className="text-2xl font-bold bg-primary text-white">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <Button 
                      variant="outline" 
                      className="absolute bottom-0 right-0 p-1"
                      onClick={() => fileInputRef.current.click()}
                    >
                      <Image className="w-4 h-4" />
                    </Button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleImageUpload}
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username" 
                      name="username" 
                      value={formData.username} 
                      onChange={handleInputChange} 
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input 
                      id="first_name" 
                      name="first_name" 
                      value={formData.first_name} 
                      onChange={handleInputChange} 
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input 
                      id="last_name" 
                      name="last_name" 
                      value={formData.last_name} 
                      onChange={handleInputChange} 
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input 
                      id="phone" 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleInputChange} 
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="next_of_kin_name">Next of Kin Name</Label>
                    <Input 
                      id="next_of_kin_name" 
                      name="next_of_kin_name" 
                      value={formData.next_of_kin_name} 
                      onChange={handleInputChange} 
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="next_of_kin_contact">Next of Kin Contact</Label>
                    <Input 
                      id="next_of_kin_contact" 
                      name="next_of_kin_contact" 
                      value={formData.next_of_kin_contact} 
                      onChange={handleInputChange} 
                      className="w-full"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  Save Changes
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={formData.photo_img} alt="Profile" />
                    <AvatarFallback className="text-2xl font-bold bg-primary text-white">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold">{formData.username}</h2>
                    <p className="text-muted-foreground">{formData.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <p>{formData.first_name || "N/A"}</p>
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <p>{formData.last_name || "N/A"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Phone</Label>
                    <p>{formData.phone || "N/A"}</p>
                  </div>
                  <div>
                    <Label>Next of Kin Name</Label>
                    <p>{formData.next_of_kin_name || "N/A"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Next of Kin Contact</Label>
                    <p>{formData.next_of_kin_contact || "N/A"}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <SaveStatusAlert />
      
      {/* Debug Section - Can be removed in production */}
      <Card className="mt-8 bg-gray-50 shadow-sm border-gray-200">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <span>Debug Information</span>
            <Badge variant="outline" className="font-mono">JSON</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black rounded-md p-4 overflow-auto text-xs text-white font-mono">
            <pre>{JSON.stringify(user, null, 2)}</pre>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          This debug panel can be removed in production
        </CardFooter>
      </Card>
    </div>
  );
};



export default UserProfile;