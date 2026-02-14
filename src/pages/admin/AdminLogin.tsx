import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";

const AdminLogin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { signIn, signOut, user, userRole } = useAdminAuth();

    // Destination after successful login
    const from = (location.state as any)?.from?.pathname || "/admin";

    // Auto-redirect if already logged in as admin
    useEffect(() => {
        if (user && userRole === 'admin') {
            navigate(from, { replace: true });
        }
    }, [user, userRole, navigate, from]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Safety timeout to prevent infinite "Authenticating..."
        const timeoutId = setTimeout(() => {
            if (loading) {
                setLoading(false);
                toast.error("Login timed out. Please check your connection.");
            }
        }, 30000);

        try {
            const { data, error } = await signIn(email, password);

            if (error) {
                toast.error(error.message || "Login failed.");
                setLoading(false);
                clearTimeout(timeoutId);
                return;
            }

            const loggedInUser = data?.user;
            if (loggedInUser) {
                // Quick verified role check
                const { data: roleData, error: roleError } = await supabaseAdmin
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', loggedInUser.id)
                    .maybeSingle();

                if (roleError) {
                    toast.error("Verification failed. Please try again.");
                    setLoading(false);
                    clearTimeout(timeoutId);
                    return;
                }

                if (roleData?.role === 'admin') {
                    toast.success("Welcome back, Admin!");
                    setLoading(false);
                    clearTimeout(timeoutId);
                    navigate(from, { replace: true });
                } else {
                    toast.error("Access denied. Admin privileges required.");
                    await signOut();
                    setLoading(false);
                    clearTimeout(timeoutId);
                }
            } else {
                setLoading(false);
                clearTimeout(timeoutId);
            }
        } catch (err) {
            toast.error("An unexpected error occurred.");
            setLoading(false);
            clearTimeout(timeoutId);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4 py-12 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md shadow-lg border-gray-800 bg-gray-800 text-white">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-primary/20 rounded-full">
                            <ShieldCheck className="w-8 h-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-white">Admin Portal</CardTitle>
                    <CardDescription className="text-gray-400">
                        Secure access for KVP Jewel Suite administrators
                    </CardDescription>
                </CardHeader>
                <CardContent >
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-200">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@kvp.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus-visible:ring-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-gray-200">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-gray-700 border-gray-600 text-white focus-visible:ring-primary"
                            />
                        </div>
                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
                            {loading ? "Authenticating..." : "Access Dashboard"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2 text-center text-sm text-gray-400">
                    <Link to="/" className="hover:text-primary transition-colors">
                        Return to Store
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
};

export default AdminLogin;
