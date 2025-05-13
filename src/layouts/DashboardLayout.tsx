
import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Shield, KeyRound, Mail, Network, BarChart2, Menu, X, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { pathname } = useLocation();
  const { signOut, user } = useAuth();
  
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: BarChart2 },
    { name: 'Vulnerability Scanner', path: '/vulnerability-scanner', icon: Shield },
    { name: 'Password Analyzer', path: '/password-analyzer', icon: KeyRound },
    { name: 'Phishing Simulator', path: '/phishing-simulator', icon: Mail },
    { name: 'Port Scanner', path: '/port-scanner', icon: Network },
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-cyber-dark border-r border-cyber-blue/30 transform transition-transform duration-150 ease-in-out lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-cyber-blue/30">
          <Link to="/dashboard" className="flex items-center space-x-2 text-cyber-blue">
            <Shield className="h-6 w-6" />
            <span className="font-bold text-lg font-mono">ShieldSec</span>
          </Link>
          <button onClick={toggleSidebar} className="lg:hidden text-cyber-blue">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex flex-col flex-1 overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md font-mono",
                    isActive
                      ? "bg-cyber-blue/10 text-cyber-blue"
                      : "text-cyber-lightgray hover:bg-cyber-blue/5 hover:text-cyber-blue"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" aria-hidden="true" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="p-4 border-t border-cyber-blue/30">
          <div className="flex flex-col space-y-4">
            <div className="text-xs text-cyber-gray font-mono">
              Logged in as:
              <div className="text-cyber-lightgray truncate">{user?.email}</div>
            </div>
            <Button 
              variant="outline" 
              className="w-full justify-start text-cyber-red border-cyber-red/30 hover:bg-cyber-red/10 hover:text-cyber-red"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top nav */}
        <div className="flex items-center h-16 px-4 border-b border-cyber-blue/30 bg-cyber-dark">
          <button
            onClick={toggleSidebar}
            className="lg:hidden text-cyber-blue mr-4"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="ml-auto"></div>
        </div>

        {/* Main content area */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
