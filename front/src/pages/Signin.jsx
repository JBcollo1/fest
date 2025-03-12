
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { User, KeyRound, Mail, ArrowRight } from 'lucide-react';
import { toast } from "sonner";

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Mock authentication - would connect to backend in real implementation
    setTimeout(() => {
      setIsLoading(false);
      if (email && password) {
        toast.success("Successfully signed in!");
        navigate('/');
      } else {
        toast.error("Please fill in all fields");
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="glass rounded-xl p-8 max-w-md w-full">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <User className="h-8 w-8" />
        </div>
        
        <h1 className="text-2xl font-display font-bold text-center mb-2">Welcome Back</h1>
        <p className="text-muted-foreground text-center mb-8">Sign in to access your account</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <div className="flex items-center border border-input rounded-md bg-background">
              <div className="flex-shrink-0">
                <Mail className="h-5 w-5" />
              </div>
              <input 
                id="email"
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 pl-10 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="you@example.com"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="flex items-center border border-input rounded-md bg-background">
              <div className="flex-shrink-0">
                <KeyRound className="h-5 w-5" />
              </div>
              <input 
                id="password"
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 pl-10 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full py-6" 
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'} 
            {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
