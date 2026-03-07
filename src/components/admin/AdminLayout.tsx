import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Recycle,
  Wrench,
  Tag,
  Bot,
  Users,
  ClipboardList,
  LogOut,
  Menu,
  X,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/shop', label: 'Shop Inventory', icon: ShoppingBag },
  { to: '/admin/thrift-requests', label: 'Thrift Requests', icon: Recycle },
  { to: '/admin/refurbishment', label: 'Refurbishment', icon: Wrench },
  { to: '/admin/thrift-inventory', label: 'Thrift Inventory', icon: Tag },
  { to: '/admin/ai-monitoring', label: 'AI Monitoring', icon: Bot },
  { to: '/admin/returns', label: 'Returns', icon: RotateCcw },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/coupons', label: 'Coupons', icon: Tag },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed z-30 inset-y-0 left-0 w-60 bg-zinc-900 text-white flex flex-col transition-transform duration-200 lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-zinc-700 shrink-0">
          <span className="text-sm font-semibold tracking-widest uppercase text-zinc-300">
            Fitverse Admin
          </span>
          <button
            className="lg:hidden text-zinc-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-white text-zinc-900'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
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

        {/* Footer */}
        <div className="border-t border-zinc-700 px-4 py-3 shrink-0">
          <p className="text-xs text-zinc-500 mb-2 truncate">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-red-400 transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center gap-3 h-14 px-4 bg-white border-b border-gray-200 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-900"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-gray-700">Fitverse Admin</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
