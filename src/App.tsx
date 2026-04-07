import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/admin/Login.tsx";
import AdminLayout from "./components/admin/AdminLayout.tsx";
import Dashboard from "./pages/admin/Dashboard.tsx";
import Dossiers from "./pages/admin/Dossiers.tsx";
import Config from "./pages/admin/Config.tsx";
import Parents from "./pages/admin/Parents.tsx";
import Messages from "./pages/admin/Messages.tsx";
import Payments from "./pages/admin/Payments.tsx";
import ProtectedRoute from "./components/admin/ProtectedRoute.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={<AdminLayout />}  >
            <Route element={<ProtectedRoute />}>
              <Route index element={<Dashboard />} />
              <Route path="dossiers" element={<Dossiers />} />
              <Route path="config" element={<Config />} />
              <Route path="parents" element={<Parents />} />
              <Route path="messages" element={<Messages />} />
              <Route path="payments" element={<Payments />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
