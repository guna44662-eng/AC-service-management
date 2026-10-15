import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X, AirVent, PlusCircle } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { ServiceModal } from '../modals/ServiceModal';

export const AppLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickServiceOpen, setQuickServiceOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar onOpenQuickService={() => setQuickServiceOpen(true)} />
      </div>

      {/* Mobile Sidebar Backdrop & Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 z-50">
            <div className="absolute top-3 right-3">
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <Sidebar
              onCloseMobile={() => setMobileOpen(false)}
              onOpenQuickService={() => setQuickServiceOpen(true)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 md:hidden">
              <div className="w-7 h-7 rounded-lg bg-sky-500 text-white flex items-center justify-center">
                <AirVent className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-slate-800">CoolCare Pro</span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuickServiceOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-700 shadow-sm transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Record Service</span>
            </button>
          </div>
        </header>

        {/* Dynamic Route View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Quick Service Global Modal */}
      {quickServiceOpen && (
        <ServiceModal
          isOpen={quickServiceOpen}
          onClose={() => setQuickServiceOpen(false)}
          onSuccess={() => {
            setQuickServiceOpen(false);
          }}
        />
      )}
    </div>
  );
};
