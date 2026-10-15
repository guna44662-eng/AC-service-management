import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  AirVent,
  ChevronRight,
  Edit2,
  Trash2,
  Calendar,
} from 'lucide-react';
import { Customer, ACUnit } from '../types';
import { getCustomers, getACUnits, deleteCustomer } from '../firebase/db';
import { formatDate } from '../utils/formatters';
import { CustomerModal } from '../components/modals/CustomerModal';
import { useToast } from '../context/ToastContext';

export const Customers: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [acUnits, setAcUnits] = useState<ACUnit[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [c, u] = await Promise.all([getCustomers(), getACUnits()]);
      setCustomers(c);
      setAcUnits(u);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete customer ${customer.fullName}?`)) {
      return;
    }
    try {
      await deleteCustomer(customer.id);
      success('Customer Deleted', `${customer.fullName} removed.`);
      loadData();
    } catch (err: unknown) {
      error('Delete failed', err instanceof Error ? err.message : String(err));
    }
  };

  // Unique areas
  const areas = Array.from(new Set(customers.map((c) => c.area).filter(Boolean)));

  // Filtered customers
  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.fullName.toLowerCase().includes(q) ||
      c.mobileNumber.toLowerCase().includes(q) ||
      c.customerCode.toLowerCase().includes(q) ||
      c.area.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q);

    const matchesArea = selectedArea === 'all' || c.area === selectedArea;
    return matchesSearch && matchesArea;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-600" />
            <span>Customer Directory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage household profiles, AC equipment, service records and billing history
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCustomer(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, mobile (+91), ID (CUST-), or area..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap">Filter Area:</span>
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
          >
            <option value="all">All Areas ({customers.length})</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Customers List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading customers...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-3">
            <Users className="w-8 h-8 mx-auto text-slate-300" />
            <p>No customers found matching your search.</p>
            <button
              onClick={() => {
                setEditingCustomer(null);
                setModalOpen(true);
              }}
              className="px-4 py-2 bg-sky-50 text-sky-600 font-semibold rounded-lg hover:bg-sky-100 transition"
            >
              Register First Customer
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] font-bold">
                  <th className="py-3 px-4">Customer ID / Name</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Area & Address</th>
                  <th className="py-3 px-4 text-center">AC Units</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((cust) => {
                  const customerUnits = acUnits.filter((u) => u.customerId === cust.id);
                  return (
                    <tr
                      key={cust.id}
                      onClick={() => navigate(`/customers/${cust.id}`)}
                      className="hover:bg-slate-50/80 transition cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[10px] text-cyan-600 font-bold">
                          {cust.customerCode}
                        </div>
                        <div className="font-bold text-sm text-slate-900 group-hover:text-sky-600 transition">
                          {cust.fullName}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cust.mobileNumber}</span>
                        </div>
                        {cust.altMobileNumber && (
                          <div className="text-[10px] text-slate-400 ml-5">
                            Alt: {cust.altMobileNumber}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{cust.area}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate ml-4.5">
                          {cust.address}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                          <AirVent className="w-3.5 h-3.5" />
                          {customerUnits.length}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">
                        {formatDate(cust.createdAt)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCustomer(cust);
                              setModalOpen(true);
                            }}
                            title="Edit Customer"
                            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, cust)}
                            title="Delete Customer"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-sky-600 transition ml-1" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Modal */}
      {modalOpen && (
        <CustomerModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            loadData();
            setModalOpen(false);
          }}
          customerToEdit={editingCustomer}
        />
      )}
    </div>
  );
};
