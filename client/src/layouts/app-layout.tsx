import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { WalletIcon } from "@/components/ui/wallet-icon";
import { 
  LayoutDashboard, 
  FilePlus, 
  Flag, 
  Users, 
  Briefcase, 
  History, 
  LogOut, 
  Menu, 
  ChevronDown 
} from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Close mobile menu when location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const isAdmin = user?.role === "admin";

  const AdminNavItems = [
    { 
      label: "Dashboard", 
      href: "/admin/dashboard", 
      icon: <LayoutDashboard className="h-5 w-5 mr-3" /> 
    },
    { 
      label: "Crear Trabajo", 
      href: "/admin/create-task", 
      icon: <FilePlus className="h-5 w-5 mr-3" /> 
    },
    { 
      label: "Crear Subasta", 
      href: "/admin/create-auction", 
      icon: <Flag className="h-5 w-5 mr-3" /> 
    },
    { 
      label: "Gestionar Usuarios", 
      href: "/admin/manage-users", 
      icon: <Users className="h-5 w-5 mr-3" /> 
    }
  ];

  const StudentNavItems = [
    { 
      label: "Mi Cartera", 
      href: "/", 
      icon: <LayoutDashboard className="h-5 w-5 mr-3" /> 
    },
    { 
      label: "Trabajos Disponibles", 
      href: "/tasks", 
      icon: <Briefcase className="h-5 w-5 mr-3" /> 
    },
    { 
      label: "Subastas Activas", 
      href: "/auctions", 
      icon: <Flag className="h-5 w-5 mr-3" /> 
    },
    { 
      label: "Historial", 
      href: "/history", 
      icon: <History className="h-5 w-5 mr-3" /> 
    }
  ];

  const navItems = isAdmin ? AdminNavItems : StudentNavItems;

  return (
    <div className="h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Sidebar Navigation */}
      <aside className="bg-primary-700 text-white w-full md:w-64 flex-shrink-0">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center">
            <WalletIcon size="md" className="bg-white/20 text-white" />
            <h1 className="ml-2 text-xl font-bold">JuliCoins</h1>
          </div>
          <button 
            className="md:hidden" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
        
        <div className={`py-4 ${mobileMenuOpen ? 'block' : 'hidden md:block'}`}>
          <p className="px-4 text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
            {isAdmin ? "Administración" : "Estudiante"}
          </p>
          
          {navItems.map((item, index) => (
            <Link key={index} href={item.href}>
              <a className={`flex items-center px-4 py-3 text-white hover:bg-white/10 transition ${location === item.href ? 'bg-white/10' : ''}`}>
                {item.icon}
                {item.label}
              </a>
            </Link>
          ))}
          
          <div className="px-4 py-3 mt-6 border-t border-white/10">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-medium">
                {user?.username.substring(0, 2).toUpperCase()}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{user?.username}</p>
                <p className="text-xs text-white/60">{isAdmin ? "Administrador" : "Estudiante"}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="mt-4 w-full text-sm bg-white/10 hover:bg-white/20 border-0 text-white"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? "Cerrando sesión..." : "Cerrar Sesión"}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
