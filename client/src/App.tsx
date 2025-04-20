import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "@/components/ui/AuthContext";
import { MinimalAuthProvider } from "./hooks/use-minimal-auth";

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";
import CreateTask from "@/pages/admin/create-task";
import CreateAuction from "@/pages/admin/create-auction";
import ManageUsers from "@/pages/admin/manage-users";

// Student Pages
import StudentDashboard from "@/pages/student/dashboard";
import AvailableTasks from "@/pages/student/available-tasks";
import ActiveAuctions from "@/pages/student/active-auctions";
import History from "@/pages/student/history";
import TaskSubmission from "@/pages/student/task-submission";

// Auth Pages
import AuthSimplePage from "./pages/auth-simple";

function Router() {
  return (
    <Switch>
      {/* Rutas públicas */}
      <Route path="/auth" component={AuthSimplePage} />
      
      {/* Rutas protegidas para estudiantes */}
      <ProtectedRoute path="/" component={StudentDashboard} />
      <ProtectedRoute path="/tasks" component={AvailableTasks} />
      <ProtectedRoute path="/tasks/:id" component={TaskSubmission} />
      <ProtectedRoute path="/auctions" component={ActiveAuctions} />
      <ProtectedRoute path="/history" component={History} />
      
      {/* Rutas protegidas para administradores */}
      <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} adminOnly />
      <ProtectedRoute path="/admin/create-task" component={CreateTask} adminOnly />
      <ProtectedRoute path="/admin/create-auction" component={CreateAuction} adminOnly />
      <ProtectedRoute path="/admin/manage-users" component={ManageUsers} adminOnly />
      
      {/* Ruta de fallback para 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    // Envolviendo la aplicación con AuthProvider y MinimalAuthProvider
    <AuthProvider>
      <MinimalAuthProvider>
        <Router />
        <Toaster />
      </MinimalAuthProvider>
    </AuthProvider>
  );
}

export default App;
