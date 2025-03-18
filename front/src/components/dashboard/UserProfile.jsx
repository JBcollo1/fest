import React, { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCircle, Mail, Edit, Loader } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const UserProfile = () => {
  const { user, loading, isAuthenticated, fetchCurrentUser } = useAuth();

  // Fetch user data when component mounts
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      fetchCurrentUser();
    }
  }, [isAuthenticated, loading, fetchCurrentUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your profile information...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="text-center p-6 bg-red-50 border border-red-100 rounded-md">
        <div className="text-red-500 font-medium mb-2">Not authenticated</div>
        <p className="text-gray-600">Please log in to view your profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
      
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
              <UserCircle className="w-16 h-16 text-muted-foreground" />
            </div>
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-muted-foreground" />
                <span className="text-lg font-medium">{user.username}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <span className="text-muted-foreground">{user.email}</span>
              </div>
              {user.first_name && user.last_name && (
                <div className="text-sm text-muted-foreground">
                  {user.first_name} {user.last_name}
                </div>
              )}
            </div>
            
            <Button className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Edit Profile
            </Button>
          </div>
        </div>
      </Card>
      
      <div className="text-sm text-muted-foreground">
        <div className="bg-gray-50 p-4 rounded-md overflow-auto">
          <pre>{JSON.stringify(user, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;