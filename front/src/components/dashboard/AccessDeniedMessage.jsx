import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const AccessDeniedMessage = ({ isOrganizer, isAdmin }) => {
  return (
    <div className="text-center p-6">
      <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-foreground mb-2">Access Restricted</h2>
      <p className="text-muted-foreground mb-4">
        You need to be an administrator or registered organizer to manage events.
      </p>
      {!isOrganizer && !isAdmin && (
        <Button>Apply to Become an Organizer</Button>
      )}
    </div>
  );
};

export default AccessDeniedMessage;