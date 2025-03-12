
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCircle, Mail, Edit } from "lucide-react";


const UserProfile = () => {
    // This would typically come from your auth context/state
    const user = {
      name: "John Doe",
      email: "john@example.com",
      image: null, // Placeholder for when no image is available
    };
  
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
  
        <Card className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                  <UserCircle className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
            </div>
  
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <UserCircle className="w-5 h-5 text-muted-foreground" />
                  <span className="text-lg font-medium">{user.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <span className="text-muted-foreground">{user.email}</span>
                </div>
              </div>
  
              <Button className="flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Edit Profile
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  

export default UserProfile