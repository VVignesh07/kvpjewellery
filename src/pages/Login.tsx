
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { OTPInput } from "@/components/auth/OTPInput";
import { Loader2, Mail, Lock, User, Phone, UserPlus, LogIn, ArrowLeft } from "lucide-react";

const Login = () => {
  const [view, setView] = useState<"login" | "signup">("login");
  const [loginMethod, setLoginMethod] = useState<"otp" | "password">("otp");

  // Form states
  const [email, setEmail] = useState("");
  const [identifier, setIdentifier] = useState(""); // Email/Phone/Username
  const [password, setPassword] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Registration states
  const [regFullName, setRegFullName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithOTP, verifyOTP, signInWithIdentifier, signUp, user } = useAuth();

  // Preserved location logic
  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    setLoading(true);
    const { error } = await signInWithOTP(email);
    if (error) {
      toast.error(error.message || "Failed to send OTP");
    } else {
      toast.success("OTP sent to your email!");
      setOtpSent(true);
      setCountdown(60);
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (otpValue.length !== 6) {
      toast.error("Please enter a 6-digit OTP");
      return;
    }
    setLoading(true);
    const { error } = await verifyOTP(email, otpValue);
    if (error) {
      toast.error(error.message || "Verification failed");
      setOtpValue("");
    } else {
      toast.success("Login successful!");
      navigate(from, { replace: true });
    }
    setLoading(false);
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.error("Please enter your details");
      return;
    }
    setLoading(true);
    const { error } = await signInWithIdentifier(identifier, password);
    if (error) {
      toast.error(error.message || "Login failed");
    } else {
      toast.success("Welcome back!");
      navigate(from, { replace: true });
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regPassword || !regPhone || !regFullName) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    const { error } = await signUp({
      password: regPassword,
      fullName: regFullName,
      username: regPhone, // use phone as username
      phone: regPhone
    });

    if (error) {
      toast.error(error.message || "Registration failed");
    } else {
      toast.success("Account created successfully!");
      // Switch to password login with the new credentials
      setIdentifier(regPhone);
      setView("login");
      setLoginMethod("password");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/90 backdrop-blur-md overflow-hidden animate-in fade-in zoom-in duration-300">
        <CardHeader className="space-y-1 text-center bg-primary/5 pb-8 pt-10">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-2xl">
              {view === "login" ? <LogIn className="w-8 h-8 text-primary" /> : <UserPlus className="w-8 h-8 text-primary" />}
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-primary">
            {view === "login" ? "Welcome Back" : "Create Account"}
          </CardTitle>
          <CardDescription>
            {view === "login"
              ? (otpSent ? "Verify your identity" : "Choose your preferred login method")
              : "Join KVP JEWELLERY and start your journey"}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-8">
          {view === "login" ? (
            !otpSent ? (
              <Tabs defaultValue="otp" className="w-full" onValueChange={(val) => setLoginMethod(val as any)}>
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="otp">Email OTP</TabsTrigger>
                  <TabsTrigger value="password">Phone Number</TabsTrigger>
                </TabsList>

                <TabsContent value="otp">
                  <form onSubmit={handleSendOTP} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="otp-email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="otp-email"
                          type="email"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="pl-10 h-11"
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-11 font-medium transition-all" disabled={loading}>
                      {loading ? <Loader2 className="animate-spin mr-2" /> : "Send Login Code"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="password">
                  <form onSubmit={handlePasswordLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="identifier">Email or Phone Number</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="identifier"
                          placeholder="Email or Phone Number"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          required
                          className="pl-10 h-11"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="pl-10 h-11"
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
                      {loading ? <Loader2 className="animate-spin mr-2" /> : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="space-y-8 animate-in slide-in-from-right duration-300">
                <div className="space-y-2">
                  <Label className="text-center block text-lg font-medium">Verification Code</Label>
                  <p className="text-sm text-muted-foreground text-center">
                    Sent to <span className="font-semibold text-foreground">{email}</span>
                  </p>
                  <div className="pt-4 flex justify-center">
                    <OTPInput
                      value={otpValue}
                      onChange={setOtpValue}
                      onComplete={handleVerifyOTP}
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleVerifyOTP}
                  className="w-full h-11 font-medium"
                  disabled={loading || otpValue.length !== 6}
                >
                  {loading ? <Loader2 className="animate-spin mr-2" /> : "Verify & Continue"}
                </Button>

                <div className="flex flex-col items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={countdown > 0 || loading}
                    className="text-primary font-medium hover:underline disabled:text-muted-foreground disabled:no-underline text-sm"
                  >
                    {countdown > 0 ? `Resend code in ${countdown}s` : "Didn't receive code? Resend"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="flex items-center text-muted-foreground hovrer:text-primary transition-colors text-sm"
                  >
                    <ArrowLeft className="w-3 h-3 mr-1" /> Change Details
                  </button>
                </div>
              </div>
            )
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4 animate-in slide-in-from-left duration-300">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-name">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="reg-name" placeholder="John Doe" value={regFullName} onChange={(e) => setRegFullName(e.target.value)} required className="pl-10" />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-phone">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="reg-phone" placeholder="9876543210" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} required className="pl-10" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-password">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="reg-password" type="password" placeholder="••••••••" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required className="pl-10" />
                </div>
              </div>
              <Button type="submit" className="w-full h-11 font-medium mt-4" disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2" /> : "Create New Account"}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-5 pb-10 pt-4 text-center">
          <div className="text-sm text-balance px-4">
            {view === "login" ? (
              <>
                New to KVP JEWELLERY?{" "}
                <button onClick={() => setView("signup")} className="text-primary hover:underline font-semibold transition-colors">
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button onClick={() => setView("login")} className="text-primary hover:underline font-semibold transition-colors">
                  Sign in here
                </button>
              </>
            )}
          </div>
          <div className="flex items-center justify-center gap-4 text-xs font-medium text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors flex items-center">
              <ArrowLeft className="w-3 h-3 mr-1" /> Home
            </Link>
            <span className="w-1 h-1 bg-border rounded-full" />
            <Link to="/about" className="hover:text-primary transition-colors">About Us</Link>
            <span className="w-1 h-1 bg-border rounded-full" />
            <Link to="/shop" className="hover:text-primary transition-colors">Shop</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
