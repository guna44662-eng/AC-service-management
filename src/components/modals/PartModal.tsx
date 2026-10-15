import React, { useState, useEffect } from 'react';
import { X, Package, DollarSign, Layers } from 'lucide-react';
import { PartItem, PartType } from '../../types';
import { addPart, updatePart } from '../../firebase/db';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';

interface PartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (part: PartItem) => void;
  partToEdit?: PartItem | null;
}

export const PartModal: React.FC<PartModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  partToEdit,
}) => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(350);
  const [partType, setPartType] = useState<PartType>('consumed_part');
  const [replacementReason, setReplacementReason] = useState('');

  useEffect(() => {
    if (partToEdit) {
      setName(partToEdit.name || '');
      setDescription(partToEdit.description || '');
      setQuantity(partToEdit.quantity || 1);
      setUnitPrice(partToEdit.unitPrice || 0);
      setPartType(partToEdit.partType || 'consumed_part');
      setReplacementReason(partToEdit.replacementReason || '');
    } else {
      setName('');
      setDescription('');
      setQuantity(1);
      setUnitPrice(350);
      setPartType('consumed_part');
      setReplacementReason('');
    }
  }, [partToEdit, isOpen]);

  if (!isOpen) return null;

  const totalPrice = quantity * unitPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error('Part Name Required', 'Please enter the spare part or tool name.');
      return;
    }

    setLoading(true);
    try {
      if (partToEdit) {
        await updatePart(partToEdit.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          quantity: Number(quantity) || 1,
          unitPrice: Number(unitPrice) || 0,
          totalPrice,
          partType,
          replacementReason: replacementReason.trim() || undefined,
        });
        success('Item Updated', `${name} details have been updated.`);
        onSuccess({
          ...partToEdit,
          name: name.trim(),
          description: description.trim() || undefined,
          quantity: Number(quantity) || 1,
          unitPrice: Number(unitPrice) || 0,
          totalPrice,
          partType,
          replacementReason: replacementReason.trim() || undefined,
        });
      } else {
        const newPart = await addPart({
          name: name.trim(),
          description: description.trim() || undefined,
          quantity: Number(quantity) || 1,
          unitPrice: Number(unitPrice) || 0,
          totalPrice,
          partType,
          replacementReason: replacementReason.trim() || undefined,
        });
        success('Item Added', `${name} saved to inventory.`);
        onSuccess(newPart);
      }
      onClose();
    } catch (err: unknown) {
      error('Failed to save item', err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {partToEdit ? 'Edit Spare Part / Tool' : 'Add Spare Part or Tool'}
              </h3>
              <p className="text-xs text-slate-300">Catalog and stock tracking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Part Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Category <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPartType('consumed_part')}
                className={`p-2.5 rounded-lg border text-xs font-semibold text-left transition ${
                  partType === 'consumed_part'
                    ? 'border-sky-500 bg-sky-50 text-sky-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div>🔧 Consumed Spare Part</div>
                <div className="text-[10px] text-slate-400 font-normal mt-0.5">Capacitor, pipe, gas, etc.</div>
              </button>
              <button
                type="button"
                onClick={() => setPartType('technician_tool')}
                className={`p-2.5 rounded-lg border text-xs font-semibold text-left transition ${
                  partType === 'technician_tool'
                    ? 'border-sky-500 bg-sky-50 text-sky-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div>🧰 Technician Tool</div>
                <div className="text-[10px] text-slate-400 font-normal mt-0.5">Jet pump, manifold gauge</div>
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Part or Material Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dual Run Capacitor 45uF / R32 Gas Can"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
            />
          </div>

          {/* Qty & Unit Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Quantity in Stock <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Unit Price (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Math.max(0, Number(e.target.value) || 0))}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white text-right"
              />
            </div>
          </div>

          {/* Total Value */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center text-xs">
            <span className="text-slate-600">Total Stock Value:</span>
            <span className="font-mono font-bold text-sm text-sky-700">{formatCurrency(totalPrice)}</span>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Specification / Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 450VAC 50/60Hz, heavy duty metal casing, suitable for 1.5 Ton AC..."
              className="w-full p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Saving...' : partToEdit ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
