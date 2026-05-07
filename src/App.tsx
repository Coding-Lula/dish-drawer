import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Inventory from "./pages/Inventory";
import Recipes from "./pages/Recipes";
import Expenses from "./pages/Expenses";
import Finance from "./pages/Finance";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import SubRecipes from "./pages/SubRecipes";
import RestockHistory from "./pages/RestockHistory";
import DebtorsPage from "./pages/Debtors";
import SalesReport from "./pages/SalesReport";
import Users from "./pages/Users";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={
            <ProtectedRoute allowedRoles={['manager', 'cashier']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/pos" element={
            <ProtectedRoute allowedRoles={['manager', 'cashier']}>
              <POS />
            </ProtectedRoute>
          } />
          <Route path="/inventory" element={
            <ProtectedRoute allowedRoles={['manager', 'cashier']}>
              <Inventory />
            </ProtectedRoute>
          } />
          <Route path="/recipes" element={
            <ProtectedRoute allowedRoles={['manager']}>
              <Recipes />
            </ProtectedRoute>
          } />
          <Route path="/expenses" element={
            <ProtectedRoute allowedRoles={['manager','cashier']}>
              <Expenses />
            </ProtectedRoute>
          } />
          <Route path="/finance" element={
            <ProtectedRoute allowedRoles={['manager']}>
              <Finance />
            </ProtectedRoute>
          } />
          <Route path="/sub-recipes" element={
            <ProtectedRoute allowedRoles={['manager']}>
              <SubRecipes />
            </ProtectedRoute>
          } />
          <Route path="/restock-history" element={
            <ProtectedRoute allowedRoles={['manager', 'cashier']}>
              <RestockHistory />
            </ProtectedRoute>
          } />
          <Route path="/sales-report" element={
            <ProtectedRoute allowedRoles={['manager', 'cashier']}>
              <SalesReport />
            </ProtectedRoute>
          } />
          <Route path="/debtors" element={
            <ProtectedRoute allowedRoles={['manager', 'cashier']}>
              <DebtorsPage />
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute allowedRoles={['manager']}>
              <Users />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
