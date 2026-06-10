import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import Admin from "./pages/Admin.tsx";
import Reports from "./pages/Reports.tsx";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, rolesLoading, isStaff } = useAuth();
  // Wait for the initial session AND, if a user is present, for their roles
  // to load before deciding whether to redirect. Without this gate, the
  // moment between "user set" and "roles fetched" causes a flicker loop
  // between /admin and /auth.
  if (loading || (user && rolesLoading)) {
    return <div className="grid min-h-screen place-items-center bg-background text-foreground">Loading…</div>;
  }
  return user && isStaff ? children : <Navigate to="/auth" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/board" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
