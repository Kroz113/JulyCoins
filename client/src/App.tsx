import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";

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

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Student Routes */}
      <ProtectedRoute path="/" component={StudentDashboard} />
      <ProtectedRoute path="/tasks" component={AvailableTasks} />
      <ProtectedRoute path="/tasks/:id" component={TaskSubmission} />
      <ProtectedRoute path="/auctions" component={ActiveAuctions} />
      <ProtectedRoute path="/history" component={History} />
      
      {/* Admin Routes */}
      <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} adminOnly />
      <ProtectedRoute path="/admin/create-task" component={CreateTask} adminOnly />
      <ProtectedRoute path="/admin/create-auction" component={CreateAuction} adminOnly />
      <ProtectedRoute path="/admin/manage-users" component={ManageUsers} adminOnly />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;
