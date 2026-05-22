import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Shield, Mail, Lock, ArrowRight, Chrome, Facebook, User, Building2, Users, Crown } from "lucide-react";
import { DarkModeToggle } from "../dark-mode-toggle";
import { motion } from "motion/react";

export function SignIn() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"role" | "credentials">("role");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const roles = [
    {
      id: "policy-seeker",
      title: "Policy Seeker",
      description: "Sign in to compare and manage your insurance policies",
      icon: <User className="w-8 h-8" />,
      route: "/dashboard"
    },
    {
      id: "insurance-provider",
      title: "Insurance Provider",
      description: "Manage your policies and customer relationships",
      icon: <Building2 className="w-8 h-8" />,
      route: "/provider-dashboard"
    },
    {
      id: "employee",
      title: "Employee",
      description: "Access platform operations and management tools",
      icon: <Users className="w-8 h-8" />,
      route: "/employee-dashboard"
    },
    {
      id: "super-admin",
      title: "Super Admin",
      description: "Full platform administration and security access",
      icon: <Crown className="w-8 h-8" />,
      route: "/admin-dashboard",
      premium: true
    }
  ];

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setStep("credentials");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const role = roles.find(r => r.id === selectedRole);
    if (role) {
      navigate(role.route);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="absolute top-6 right-6">
          <DarkModeToggle />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              ClearClever
            </span>
          </Link>

          {step === "role" ? (
            <>
              <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
              <p className="text-muted-foreground mb-8">
                Select your role to continue
              </p>

              <div className="space-y-3">
                {roles.map((role, index) => (
                  <motion.div
                    key={role.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleRoleSelect(role.id)}
                    className="relative p-4 bg-card border-2 border-border rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary/50 group"
                  >
                    {role.premium && (
                      <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-primary to-secondary text-white text-xs font-semibold rounded-full">
                        Premium
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary group-hover:from-primary group-hover:to-secondary group-hover:text-white transition-all">
                        {role.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{role.title}</h3>
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep("role")}
                className="text-sm text-primary hover:underline mb-4 flex items-center gap-1"
              >
                ← Change role
              </button>
              <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
              <p className="text-muted-foreground mb-8">
                Sign in to your account to continue
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/50"
                />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              Sign In
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
              </form>

              <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-background text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-xl hover:bg-accent transition-all">
                <Chrome className="w-5 h-5" />
                <span>Google</span>
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-xl hover:bg-accent transition-all">
                <Facebook className="w-5 h-5" />
                <span>Facebook</span>
              </button>
            </div>
              </div>

              <p className="mt-8 text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/signup" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </p>
            </>
          )}
        </motion.div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/10 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="relative z-10 max-w-lg"
        >
          <h2 className="text-4xl font-bold mb-4">
            Secure Your Future with
            <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Smart Insurance Choices
            </span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Access your personalized dashboard and manage all your insurance needs in one place
          </p>
          <div className="space-y-4">
            {[
              "AI-powered recommendations",
              "Compare 100+ policies instantly",
              "Track claims in real-time",
              "24/7 expert support"
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
