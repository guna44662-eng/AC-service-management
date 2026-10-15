import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  AirVent,
  Wrench,
  CalendarDays,
  Package,
  Receipt,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
  ShieldCheck,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { seedRealisticSampleData } from '../../firebase/db';

interface SidebarProps {
  onCloseMobile?: () => void;
  onOpenQuickService?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile, onOpenQuickService }) => {
  const { user, isDemoUser, isAdmin, signOut } = useAuth();
  const { success, error, info } = useToast();
  const location = useLocation();
  const [seeding, setSeeding] = React.useState(false);

  const handleSeedData = async () => {
    if (!window.confirm('Populate realistic sample customers, AC units, services, appointments & invoices?')) {
      return;
    }
    setSeeding(true);
    info('Seeding database with realistic AC service data...');
    try {
      await seedRealisticSampleData();
      success('Sample Data Loaded!', 'Customers, AC units, jobs and invoices populated.');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: unknown) {
      error('Failed to seed data', err instanceof Error ? err.message : String(err));
    } finally {
      setSeeding(false);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'AC Units', path: '/ac-units', icon: AirVent },
    { name: 'Service Records', path: '/services', icon: Wrench },
    { name: 'Appointments', path: '/appointments', icon: CalendarDays },
    { name: 'Spare Parts & Tools', path: '/parts', icon: Package },
    { name: 'Invoices & Bills', path: '/invoices', icon: Receipt },
    { name: 'Payments & Revenue', path: '/payments', icon: CreditCard },
    { name: 'Reports & Export', path: '/reports', icon: BarChart3 },
    { name: 'Business Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 h-full bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 shadow-xl shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <AirVent className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              CoolCare <span className="text-cyan-400 font-mono text-xs px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800">PRO</span>
            </h1>
            <p className="text-xs text-slate-400">AC Home Service Suite</p>
          </div>
        </div>
      </div>

      {/* Quick Record Action Button */}
      <div className="p-3">
        <button
          onClick={() => {
            if (onOpenQuickService) onOpenQuickService();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg font-medium text-xs shadow-md shadow-cyan-900/30 transition active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record New Service</span>
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 font-semibold border-l-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span className="truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Seeder & Technician Info Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-2">
        <button
          onClick={handleSeedData}
          disabled={seeding}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-slate-800/80 hover:bg-slate-850 hover:text-cyan-300 border border-slate-700/80 rounded-lg text-[11px] text-slate-300 transition"
          title="Add sample customers and jobs to test the system"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{seeding ? 'Populating...' : 'Seed Sample AC Data'}</span>
        </button>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold text-xs uppercase shrink-0">
              {user?.displayName ? user.displayName.charAt(0) : 'T'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-slate-200 truncate">
                {user?.displayName || (isDemoUser ? 'Demo Technician' : 'Mechanic Admin')}
              </div>
              <div className="text-[10px] text-cyan-400/90 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-cyan-400 inline" />
                {isAdmin ? 'Owner / Admin' : 'Staff Technician'}
              </div>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
