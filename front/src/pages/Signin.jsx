import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import { User, KeyRound, Mail, ArrowRight } from 'lucide-react';
import { useTheme } from "@/contexts/ThemeContext";

const SignIn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const { isDarkMode } = useTheme();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Get the return URL from query parameters
  const queryParams = new URLSearchParams(location.search);
  const returnUrl = queryParams.get('returnUrl');

  const validateForm = () => {
    const newErrors = {};
    
    if (!email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Email is invalid";
    
    if (!password) newErrors.password = "Password is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const result = await login(email, password);
      
      if (result.success) {
        
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        
        // Redirect to the return URL if it exists, otherwise go to home
        if (returnUrl) {
          const decodedUrl = decodeURIComponent(returnUrl);
          // Remove any leading domain/protocol if present
          const cleanPath = decodedUrl.replace(/^(?:\/\/|[^/]+)*/, '');
          navigate(cleanPath);
        } else {
          navigate("/");
        }
      } else {
        toast({
          variant: "destructive",
          title: "Sign in failed",
          description: result.message || "Invalid email or password",
        });
      }
    } catch (error) {
      console.error("Sign in error:", error);
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex min-h-screen items-center justify-center ${
      isDarkMode ? 'bg-slate-950 text-white' : 'bg-background'
    } px-4`}>
      <div className={`rounded-xl p-8 max-w-md w-full ${
        isDarkMode ? 'bg-slate-900/90 border border-slate-800' : 'glass'
      }`}>
        <div className={`w-16 h-16 ${
          isDarkMode ? 'bg-primary/20' : 'bg-primary/10'
        } text-primary rounded-full flex items-center justify-center mx-auto mb-6`}>
          <User className="h-8 w-8" />
        </div>
        <h1 className={`text-2xl font-display font-bold text-center mb-2 ${
          isDarkMode ? 'text-white' : ''
        }`}>Welcome back</h1>
        <p className={`text-center mb-8 ${
          isDarkMode ? 'text-white/70' : 'text-muted-foreground'
        }`}>
          Sign in to your account to continue
        </p>
        
        <Card className={isDarkMode ? 'bg-slate-900 border-slate-800' : ''}>
          <form onSubmit={handleSubmit}>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className={`${isDarkMode ? 'bg-muted text-white' : ''}`}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className={`${isDarkMode ? 'bg-muted text-white' : ''}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {showPassword ? "Hide password" : "Show password"}
                    </span>
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>
              
              <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </CardContent>
          </form>
        </Card>
        
        <div className="text-center">
          <p className={`text-sm ${
            isDarkMode ? 'text-white/70' : 'text-muted-foreground'
          }`}>
            Don't have an account?{" "}
            <Link to={returnUrl ? `/signup?returnUrl=${returnUrl}` : "/signup"} className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
