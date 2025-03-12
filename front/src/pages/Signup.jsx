
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { UserPlus, Mail, KeyRound, User, ArrowRight } from 'lucide-react';
import { toast } from "sonner";

const SignUp = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmPassword, setconfirmPassword] = useState('')
  const navigate = useNavigate();
  

  const passwordMismatch = confirmPassword && confirmPassword != password
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Mock registration - would connect to backend in real implementation
    setTimeout(() => {
      setIsLoading(false);
      if (name && email && password) {
        toast.success("Account created successfully!");
        navigate('/signin');
      } else {
        toast.error("Please fill in all fields");
      }
    }, 1500);
  };

  return (
    <div className="pt-20 min-h-screen flex items-center justify-center bg-background p-4">
      <div className="glass rounded-xl p-8 max-w-md w-full">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <UserPlus className="h-8 w-8" />
        </div>
        
        <h1 className="text-2xl font-display font-bold text-center mb-2">Create an Account</h1>
        <p className="text-muted-foreground text-center mb-8">Join EventHub to discover and book events</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Full Name</label>
            <div className="flex items-center border border-input rounded-md bg-background ">
              <div className="flex-shrink-0">
                <User className="h-5 w-5" />
              </div>
              <input 
                id="name"
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 pl-10 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="John Doe"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <div className="flex items-center border border-input rounded-md bg-background ">
              <div className="flex-shrink-0">
                <Mail  className='h-5 w-5' />
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
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <div className="flex items-center border border-input rounded-md bg-background  ">
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
            <p className="text-xs text-muted-foreground mt-1">
              Must be at least 8 characters long
            </p>
          </div>
          <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirm Password
        </label>
        <div
          className={`flex items-center border ${
            passwordMismatch ? "border-red-500" : "border-input"
          } rounded-md bg-background`}
        >
          <div className="flex-shrink-0 pl-3">
            <KeyRound className="h-5 w-5" />
          </div>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setconfirmPassword(e.target.value)}
            className="w-full p-3 pl-10 rounded-md bg-background border-0 focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="••••••••"
          />
        </div>
        {passwordMismatch && (
          <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
        )}
      </div>
          
          <Button 
            type="submit" 
            className="w-full py-6" 
            disabled={isLoading}
          >
            {isLoading ? 'Creating account...' : 'Sign Up'} 
            {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <Link to="/signin" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
