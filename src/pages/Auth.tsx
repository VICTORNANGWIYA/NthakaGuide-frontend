import { Navigate }         from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth }          from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import NavHeader            from "@/components/NavHeader";
import { Sprout }           from "lucide-react";
import logo                 from "@/assets/logo.jpeg";
 import { useState } from "react";
import LoginForm      from "@/pages/LoginForm";
import SignUpForm     from "@/pages/SignUpForm";
import ForgotPassword from "@/pages/ForgotPassword";
 
type View = "login" | "signup" | "forgotPassword";
 
const VIEW_META: Record<View, { title: string; description: string }> = {
  login: {
    title:       "Welcome Back",
    description: "Sign in to access your soil analysis tools",
  },
  signup: {
    title:       "Create Account",
    description: "Join NthakaGuide and start optimising your farm",
  },
  forgotPassword: {
    title:       "Reset Password",
    description: "We'll send a verification code to your email",
  },
};
 
export default function Auth() {
  const { user, loading } = useAuth();
  const [view, setView]   = useState<View>("login");
 
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Sprout className="h-8 w-8 text-primary animate-pulse" />
      </div>
    );
  }
 
  if (user) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/"} replace />;
  }
 
  const { title, description } = VIEW_META[view];
 
  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <div className="flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="border-border shadow-golden">
            <CardHeader className="text-center space-y-3">
              <div className="flex justify-center">
                <img src={logo} alt="NthakaGuide" className="h-14 w-14 rounded-lg shadow-md" />
              </div>
 
              {/* Title animates when switching views */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={view}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.18 }}
                >
                  <CardTitle className="font-display text-2xl">{title}</CardTitle>
                  <CardDescription className="mt-1">{description}</CardDescription>
                </motion.div>
              </AnimatePresence>
            </CardHeader>
 
            <CardContent>
              <AnimatePresence mode="wait">
 
                {view === "login" && (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <LoginForm
                      onForgotPassword={() => setView("forgotPassword")}
                      onSwitchToSignUp={() => setView("signup")}
                    />
                  </motion.div>
                )}
 
                {view === "signup" && (
                  <motion.div
                    key="signup"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <SignUpForm onSwitchToLogin={() => setView("login")} />
                  </motion.div>
                )}
 
                {view === "forgotPassword" && (
                  <motion.div
                    key="forgotPassword"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <ForgotPassword onBack={() => setView("login")} />
                  </motion.div>
                )}
 
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
 