import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Chatbot from "@/components/Chatbot";
import Index from "./pages/Index";
import Recommend from "./pages/Recommend";
import Rainfall from "./pages/Rainfall";
import About from "./pages/About";
import Auth from "./pages/Auth";
import History from "./pages/History";
import HelpSupport from "./pages/HelpSupport";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminProfile from "./pages/Admin/AdminProfile";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import FirstTimeGuide from "./pages/FirstTimeGuide";
import { LanguageProvider } from "@/contexts/LanguageContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
        <LanguageProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/recommend" element={<ProtectedRoute><Recommend /></ProtectedRoute>} />
            <Route path="/rainfall" element={<ProtectedRoute><Rainfall /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/admin_profile" element={<ProtectedRoute><AdminProfile /></ProtectedRoute>} />
            <Route path="/help" element={<HelpSupport />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>

          {/*
            Chatbot is rendered globally here — it reads useAuth() internally
            and only shows when the user is logged in. No need to add it to
            individual pages. Remove any <Chatbot /> you have in Index.tsx,
            Recommend.tsx, or any other page.
          */}
          </LanguageProvider>
          <Chatbot />
          <FirstTimeGuide />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;