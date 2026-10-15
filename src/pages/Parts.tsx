import React, { useEffect, useState } from 'react';
import {
  Package,
  Search,
  Plus,
  Filter,
  Wrench,
  DollarSign,
  Layers,
  Edit2,
  Trash2,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { PartItem, PartType } from '../types';
import { getParts, deletePart } from '../firebase/db';
import { formatCurrency, formatDate } from '../utils/formatters';
import { PartModal } from '../components/modals/PartModal';
import { useToast } from '../context/ToastContext';

export const Parts: React.FC = () => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [parts, setParts] = useState<PartItem[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [partToEdit, setPartToEdit] = useState<PartItem | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getParts();
      setParts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (part: PartItem) => {
    if (!window.confirm(`Delete part/tool "${part.name}"?`)) return;
    try {
      await deletePart(part.id);
      success('Item Deleted', `${part.name} removed.`);
      loadData();
    } catch (err: unknown) {
      error('Delete failed', err instanceof Error ? err.message : String(err));
    }
  };

  const filteredParts = parts.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.replacementReason && p.replacementReason.toLowerCase().includes(q));

    const matchesType = selectedType === 'all' || p.partType === selectedType;
    return matchesSearch && matchesType;
  });

  // Analytics
  const consumedParts = parts.filter((p) => p.partType === 'consumed_part');
  const technicianTools = parts.filter((p) => p.partType === 'technician_tool');
  const totalStockValue = parts.reduce((sum, p) => sum + (Number(p.totalPrice) || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-sky-600" />
            <span>Spare Parts & Technician Toolkit</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track replacement capacitors, copper pipes, refrigerants, and equipment toolkits
          </p>
        </div>

        <button
          onClick={() => {
            setPartToEdit(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Spare Part or Tool</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-slate-400">Total Stock Value</div>
            <div className="text-2xl font-black font-mono text-slate-900 mt-1">
              {formatCurrency(totalStockValue)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{parts.length} total inventory items</div>
          </div>
          <div className="p-3 rounded-xl bg-sky-50 text-sky-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-slate-400">Consumed Spare Parts</div>
            <div className="text-2xl font-black font-mono text-cyan-700 mt-1">
              {consumedParts.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Capacitors, refrigerants, pipes</div>
          </div>
          <div className="p-3 rounded-xl bg-cyan-50 text-cyan-600">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-slate-400">Technician Toolkit</div>
            <div className="text-2xl font-black font-mono text-indigo-700 mt-1">
              {technicianTools.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Reusable pressure pumps, gauges</div>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <Wrench className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search spare parts by name, capacitor rating, gas type, or spec..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
          />
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
        >
          <option value="all">All Categories</option>
          <option value="consumed_part">Consumed Spare Parts</option>
          <option value="technician_tool">Technician Tools</option>
        </select>
      </div>

      {/* Parts Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading parts...</div>
        ) : filteredParts.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-3">
            <Package className="w-8 h-8 mx-auto text-slate-300" />
            <p>No parts or materials match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] font-bold">
                  <th className="py-3 px-4">Part / Tool Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description / Spec</th>
                  <th className="py-3 px-4 text-center">In Stock</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Total Value</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredParts.map((part) => (
                  <tr key={part.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{part.name}</div>
                      {part.replacementReason && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {part.replacementReason}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          part.partType === 'technician_tool'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                        }`}
                      >
                        {part.partType === 'technician_tool' ? 'Toolkit' : 'Consumed Part'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs text-slate-600">
                      {part.description || '-'}
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold font-mono text-slate-800">
                      {part.quantity}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      {formatCurrency(part.unitPrice)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(part.totalPrice)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setPartToEdit(part);
                            setModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-sky-600 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(part)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <PartModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            loadData();
            setModalOpen(false);
          }}
          partToEdit={partToEdit}
        />
      )}
    </div>
  );
};
