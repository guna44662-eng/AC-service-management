import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AirVent,
  Search,
  Plus,
  Filter,
  User,
  Wrench,
  Calendar,
  Edit2,
  Trash2,
  ChevronRight,
  MapPin,
  Tag,
} from 'lucide-react';
import { ACUnit, Customer, ServiceRecord } from '../types';
import { getACUnits, getCustomers, getServices, deleteACUnit } from '../firebase/db';
import { formatDate } from '../utils/formatters';
import { ACUnitModal } from '../components/modals/ACUnitModal';
import { ServiceModal } from '../components/modals/ServiceModal';
import { useToast } from '../context/ToastContext';

export const ACUnits: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [acUnits, setAcUnits] = useState<ACUnit[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCapacity, setSelectedCapacity] = useState('all');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [unitToEdit, setUnitToEdit] = useState<ACUnit | null>(null);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [serviceACUnit, setServiceACUnit] = useState<ACUnit | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, c, s] = await Promise.all([getACUnits(), getCustomers(), getServices()]);
      setAcUnits(u);
      setCustomers(c);
      setServices(s);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (unit: ACUnit) => {
    if (!window.confirm(`Delete ${unit.brand} ${unit.acType} unit?`)) return;
    try {
      await deleteACUnit(unit.id);
      success('AC Unit Deleted', `${unit.brand} unit removed.`);
      loadData();
    } catch (err: unknown) {
      error('Delete failed', err instanceof Error ? err.message : String(err));
    }
  };

  const brands = Array.from(new Set(acUnits.map((u) => u.brand).filter(Boolean)));

  const filteredUnits = acUnits.filter((u) => {
    const cust = customers.find((c) => c.id === u.customerId);
    const q = searchQuery.toLowerCase().trim();

    const matchesSearch =
      !q ||
      u.brand.toLowerCase().includes(q) ||
      (u.modelNumber && u.modelNumber.toLowerCase().includes(q)) ||
      (u.serialNumber && u.serialNumber.toLowerCase().includes(q)) ||
      (u.locationInHome && u.locationInHome.toLowerCase().includes(q)) ||
      (cust && cust.fullName.toLowerCase().includes(q)) ||
      (cust && cust.mobileNumber.includes(q));

    const matchesBrand = selectedBrand === 'all' || u.brand === selectedBrand;
    const matchesType = selectedType === 'all' || u.acType === selectedType;
    const matchesCapacity = selectedCapacity === 'all' || u.capacity === selectedCapacity;

    return matchesSearch && matchesBrand && matchesType && matchesCapacity;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <AirVent className="w-6 h-6 text-cyan-600" />
            <span>AC Equipment Register</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Customer air conditioners, specifications, serials and maintenance history
          </p>
        </div>
        <button
          onClick={() => {
            setUnitToEdit(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Register New AC Unit</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by brand, customer name, phone, serial or room location..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 shrink-0">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
            >
              <option value="all">All Brands ({brands.length})</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
            >
              <option value="all">All Types</option>
              <option value="Inverter Split">Inverter Split</option>
              <option value="Split">Split</option>
              <option value="Window">Window</option>
              <option value="Other">Other</option>
            </select>

            <select
              value={selectedCapacity}
              onChange={(e) => setSelectedCapacity(e.target.value)}
              className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
            >
              <option value="all">All Tonnages</option>
              <option value="1 ton">1 Ton</option>
              <option value="1.5 ton">1.5 Ton</option>
              <option value="2 ton">2 Ton</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of AC Units */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading AC units...</div>
      ) : filteredUnits.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-xs text-slate-400 space-y-3">
          <AirVent className="w-8 h-8 mx-auto text-slate-300" />
          <p>No AC units match the selected filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUnits.map((unit) => {
            const customer = customers.find((c) => c.id === unit.customerId);
            const unitServices = services.filter((s) => s.acUnitId === unit.id);
            const lastService = unitServices[0]; // Already sorted by date desc

            return (
              <div
                key={unit.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                        <AirVent className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900">{unit.brand}</h3>
                        <div className="text-[11px] text-cyan-600 font-semibold">
                          {unit.acType} • {unit.capacity}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setUnitToEdit(unit);
                          setModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-sky-600 rounded"
                        title="Edit AC Unit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(unit)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Delete AC Unit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Customer association */}
                  <div className="mt-3.5 p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-semibold text-[10px] uppercase">Owner:</span>
                      {customer ? (
                        <button
                          onClick={() => navigate(`/customers/${customer.id}`)}
                          className="font-bold text-slate-800 hover:text-sky-600 flex items-center gap-1"
                        >
                          <span>{customer.fullName}</span>
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </div>
                    {customer && (
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{customer.area}</span>
                      </div>
                    )}
                  </div>

                  {/* Specifications */}
                  <div className="mt-3 text-xs space-y-1 text-slate-600">
                    {unit.locationInHome && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Location:</span>
                        <span className="font-semibold text-slate-800">{unit.locationInHome}</span>
                      </div>
                    )}
                    {unit.modelNumber && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Model:</span>
                        <span className="font-mono text-slate-800">{unit.modelNumber}</span>
                      </div>
                    )}
                    {unit.serialNumber && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Serial:</span>
                        <span className="font-mono text-slate-800">{unit.serialNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1 border-t border-slate-100">
                      <span className="text-slate-400">Last Serviced:</span>
                      <span className="font-semibold text-slate-800">
                        {lastService ? formatDate(lastService.serviceDate) : 'Never serviced'}
                      </span>
                    </div>
                  </div>

                  {unit.notes && (
                    <div className="mt-2.5 text-[11px] text-slate-500 bg-slate-50/80 p-2 rounded-lg">
                      {unit.notes}
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    <span className="font-bold text-sky-600">{unitServices.length}</span> jobs logged
                  </span>
                  <button
                    onClick={() => {
                      setServiceACUnit(unit);
                      setServiceModalOpen(true);
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-800"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Record Service →</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {modalOpen && (
        <ACUnitModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            loadData();
            setModalOpen(false);
          }}
          unitToEdit={unitToEdit}
        />
      )}

      {serviceModalOpen && serviceACUnit && (
        <ServiceModal
          isOpen={serviceModalOpen}
          onClose={() => {
            setServiceModalOpen(false);
            setServiceACUnit(null);
          }}
          onSuccess={() => {
            loadData();
            setServiceModalOpen(false);
            setServiceACUnit(null);
          }}
          defaultCustomerId={serviceACUnit.customerId}
          defaultACUnitId={serviceACUnit.id}
        />
      )}
    </div>
  );
};
