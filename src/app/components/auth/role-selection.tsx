import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Shield, User, Building2, Users, Crown, ArrowRight } from "lucide-react";
import { DarkModeToggle } from "../dark-mode-toggle";
import { motion } from "motion/react";

export function RoleSelection() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const roles = [
    {
      id: "policy-seeker",
      title: "Policy Seeker",
      description: "I want to find and compare insurance policies for myself or my family",
      icon: <User className="w-8 h-8" />,
      route: "/dashboard"
    },
    {
      id: "insurance-provider",
      title: "Insurance Provider",
      description: "I represent an insurance company and want to list policies",
      icon: <Building2 className="w-8 h-8" />,
      route: "/provider-dashboard"
    },
    {
      id: "employee",
      title: "Employee/Admin",
      description: "I work for ClearClever and manage platform operations",
      icon: <Users className="w-8 h-8" />,
      route: "/admin-dashboard"
    },
    {
      id: "super-admin",
      title: "Super Admin",
      description: "I have full access to platform administration and security",
      icon: <Crown className="w-8 h-8" />,
      route: "/admin-dashboard",
      premium: true
    }
  ];

  const handleContinue = () => {
    const role = roles.find(r => r.id === selectedRole);
    if (role) {
      navigate(role.route);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      <div className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

      <div className="absolute top-6 right-6">
        <DarkModeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl relative z-10"
      >
        <div className="text-center mb-12">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <span className="font-bold text-2xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              ClearClever
            </span>
          </Link>
          <h1 className="text-4xl font-bold mb-3">Choose your role</h1>
          <p className="text-xl text-muted-foreground">
            Select how you'll be using ClearClever
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {roles.map((role, index) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedRole(role.id)}
              className={`relative p-6 bg-card border-2 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-xl ${
                selectedRole === role.id
                  ? "border-primary shadow-xl shadow-primary/20"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {role.premium && (
                <div className="absolute -top-3 -right-3 px-3 py-1 bg-gradient-to-r from-primary to-secondary text-white text-xs font-semibold rounded-full">
                  Premium
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center transition-all ${
                  selectedRole === role.id
                    ? "bg-gradient-to-br from-primary to-secondary text-white"
                    : "bg-gradient-to-br from-primary/20 to-secondary/20 text-primary"
                }`}>
                  {role.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{role.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {role.description}
                  </p>
                </div>
              </div>

              {selectedRole === role.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-6 right-6 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={!selectedRole}
          className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-lg hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Dashboard
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Need to change your account details?{" "}
          <Link to="/signup" className="text-primary hover:underline font-medium">
            Go back
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
