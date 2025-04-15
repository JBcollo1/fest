import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import { useMutate } from "@/hooks/useQuery";
import { UserPlus, Mail, KeyRound, User, ArrowRight } from 'lucide-react';
import { useTheme } from "@/contexts/ThemeContext";

const SignUp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const { isDarkMode } = useTheme();
  
  const queryParams = new URLSearchParams(location.search);
  const returnUrl = queryParams.get('returnUrl');
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    password: "",
    confirm_password: "",
    phone: "",
    national_id: "",
    photo_img: "",
    next_of_kin_name: "",
    next_of_kin_contact: ""
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [termsAgreed, setTermsAgreed] = useState(false);

  // Add new state for file handling
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Use the useMutate hook for the signup API call
  const signupMutation = useMutate('/api/users', 'post', {
    onSuccess: async (data) => {
      toast({
        title: "Account created!",
        description: "Your account has been created successfully.",
      });
      
      // Auto login after successful registration
      const loginResult = await login(formData.email, formData.password);
      if (loginResult.success) {
        if (returnUrl) {
          const decodedUrl = decodeURIComponent(returnUrl);
          const cleanPath = decodedUrl.replace(/^(?:\/\/|[^/]+)*/, '');
          navigate(cleanPath);
        } else {
          navigate("/");
        }
      } else {
        navigate("/signin");
      }
    },
    onError: (error) => {
      console.error("Registration error:", error);
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.response?.data?.message || "An error occurred during registration.",
      });
    },
    // Add headers for multipart/form-data
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.first_name) newErrors.first_name = "First name is required";
    if (!formData.last_name) newErrors.last_name = "Last name is required";
    
    if (!formData.username) newErrors.username = "Username is required";
    else if (formData.username.length < 3) newErrors.username = "Username must be at least 3 characters";
    
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";
    
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    
    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
    }
    
    if (!formData.national_id) newErrors.national_id = "National ID is required";
    if (!selectedFile) newErrors.photo_img = "Photo image is required";
    if (!formData.next_of_kin_name) newErrors.next_of_kin_name = "Next of kin name is required";
    if (!formData.next_of_kin_contact) newErrors.next_of_kin_contact = "Next of kin contact is required";
    
    if (!termsAgreed) newErrors.terms = "You must agree to the Terms of Service and Privacy Policy";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update handleFileSelect to also clear any existing photo_img error
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Preview the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
      setSelectedFile(file);
      
      // Clear the photo_img error if it exists
      setErrors(prev => ({
        ...prev,
        photo_img: undefined
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Create FormData object to send file and other data
    const formDataToSend = new FormData();
    
    // Add all text fields except confirm_password
    Object.keys(formData).forEach(key => {
      if (key !== 'confirm_password') {
        formDataToSend.append(key, formData[key]);
      }
    });
    
    // Add the file if selected
    if (selectedFile) {
      formDataToSend.append('file', selectedFile);
    }
    
    // Update the mutation to handle FormData
    signupMutation.mutate(formDataToSend);
  };

  return (
    <div className={`pt-20 min-h-screen flex items-center justify-center ${
      isDarkMode ? 'bg-slate-950 text-white' : 'bg-background'
    } p-4`}>
      <div className={`rounded-xl p-8 max-w-md w-full ${
        isDarkMode ? 'bg-slate-900/90 border border-slate-800' : 'glass'
      }`}>
        <div className={`w-16 h-16 ${
          isDarkMode ? 'bg-primary/20' : 'bg-primary/10'
        } text-primary rounded-full flex items-center justify-center mx-auto mb-6`}>
          <UserPlus className="h-8 w-8" />
        </div>
        <h1 className={`text-2xl font-display font-bold text-center mb-2 ${
          isDarkMode ? 'text-white' : ''
        }`}>Create an account</h1>
        <p className={`text-center mb-8 ${
          isDarkMode ? 'text-white/70' : 'text-muted-foreground'
        }`}>
          Sign up to get started with our platform
        </p>
        
        <Card className={isDarkMode ? 'bg-slate-900 border-slate-800' : ''}>
          <form onSubmit={handleSubmit}>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    placeholder="John"
                    value={formData.first_name}
                    onChange={handleChange}
                    disabled={signupMutation.isPending}
                    className={`${isDarkMode ? 'bg-muted text-white' : ''}`}
                  />
                  {errors.first_name && (
                    <p className="text-sm text-destructive">{errors.first_name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    placeholder="Doe"
                    value={formData.last_name}
                    onChange={handleChange}
                    disabled={signupMutation.isPending}
                    className={`${isDarkMode ? 'bg-muted text-white' : ''}`}
                  />
                  {errors.last_name && (
                    <p className="text-sm text-destructive">{errors.last_name}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={signupMutation.isPending}
                  className={`${isDarkMode ? 'bg-muted text-white' : ''}`}
                />
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={signupMutation.isPending}
                  className={`${isDarkMode ? 'bg-muted text-white' : ''}`}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={signupMutation.isPending}
                  className={`${isDarkMode ? 'bg-muted text-white' : ''}`}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="national_id">National ID</Label>
                <Input
                  id="national_id"
                  name="national_id"
                  placeholder="Enter national ID"
                  value={formData.national_id}
                  onChange={handleChange}
                  disabled={signupMutation.isPending}
                  className={`${isDarkMode ? 'bg-muted text-white' : ''}`}
                />
                {errors.national_id && (
                  <p className="text-sm text-destructive">{errors.national_id}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="photo_img">Profile Photo</Label>
                <div className="flex flex-col items-center gap-4">
                  {previewUrl && (
                    <div className="relative w-32 h-32 rounded-full overflow-hidden">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <Input
                    id="photo_img"
                    name="photo_img"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={signupMutation.isPending}
                    // className=
                    className={`${isDarkMode ? 'bg-black text-white' : ''} cursor-pointer`}

                  />
                  {errors.photo_img && (
                    <p className="text-sm text-destructive">{errors.photo_img}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="next_of_kin_name">Next of Kin Name</Label>
                <Input
                  id="next_of_kin_name"
                  name="next_of_kin_name"
                  placeholder="Enter next of kin name"
                  value={formData.next_of_kin_name}
                  onChange={handleChange}
                  disabled={signupMutation.isPending}
                  className={`${isDarkMode ? 'bg-muted text-white' : ''}`}
                />
                {errors.next_of_kin_name && (
                  <p className="text-sm text-destructive">{errors.next_of_kin_name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="next_of_kin_contact">Next of Kin Contact</Label>
                <Input
                  id="next_of_kin_contact"
                  name="next_of_kin_contact"
                  placeholder="Enter next of kin contact"
                  value={formData.next_of_kin_contact}
                  onChange={handleChange}
                  disabled={signupMutation.isPending}
                  className={`${isDarkMode ? 'bg-muted text-white' : ''}`}
                />
                {errors.next_of_kin_contact && (
                  <p className="text-sm text-destructive">{errors.next_of_kin_contact}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={signupMutation.isPending}
                    className={`${isDarkMode ? 'bg-muted text-white' : ''}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={signupMutation.isPending}
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
              
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm Password</Label>
                <Input
                  id="confirm_password"
                  name="confirm_password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  disabled={signupMutation.isPending}
                  className={`${isDarkMode ? 'bg-muted text-white' : ''}`}
                />
                {errors.confirm_password && (
                  <p className="text-sm text-destructive">{errors.confirm_password}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full mt-6" 
                disabled={signupMutation.isPending}
              >
                {signupMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="terms" 
                  className="h-4 w-4" 
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground">
                  I agree to the <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                </label>
              </div>
              {errors.terms && (
                <p className="text-sm text-destructive mt-1">{errors.terms}</p>
              )}
            </CardContent>
          </form>
        </Card>
        
        <div className="text-center">
          <p className={`text-sm ${
            isDarkMode ? 'text-white/70' : 'text-muted-foreground'
          }`}>
            Already have an account?{" "}
            <Link to={returnUrl ? `/signin?returnUrl=${returnUrl}` : "/signin"} className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
