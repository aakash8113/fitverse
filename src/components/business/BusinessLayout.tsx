import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Key,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Zap,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BusinessLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { to: '/business/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/business/api-keys', label: 'API Keys', icon: Key },
  { to: '/business/usage', label: 'Usage', icon: BarChart3 },
  { to: '/business/buy-credits', label: 'Buy Credits', icon: CreditCard },
];

export const BusinessLayout: React.FC<BusinessLayoutProps> = ({ children }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 flex bg-gray-50 dark:bg-[#121212] overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={cn(
          'fixed z-30 inset-y-0 left-0 w-60 bg-zinc-900 text-white flex flex-col transition-transform duration-200 lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-zinc-700 shrink-0">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-semibold tracking-widest uppercase text-zinc-300">Business API</span>
          </div>
          <button className="lg:hidden text-zinc-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors',
                  isActive ? 'bg-yellow-500 text-zinc-900' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight className="h-3 w-3 shrink-0" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-zinc-700 px-4 py-3 shrink-0">
          <p className="text-xs text-zinc-500 mb-2 truncate">{user?.email}</p>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-red-400 transition-colors w-full">
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 h-14 px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Business API</span>
        </header>
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white">
          {children}
        </main>
      </div>
    </div>
  );
};

export default BusinessLayout;