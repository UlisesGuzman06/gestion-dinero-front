"use client";
import { useState, useEffect } from "react";
import { createGastoFijo, updateGastoFijo } from "@/lib/api";
import { X, Loader2 } from "lucide-react";

interface GastoFijo {
  id: string;
  nombre: string;
  monto: number;
  link?: string;
}

interface AddFixedExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingGasto?: GastoFijo | null;
}

export default function AddFixedExpenseModal({ isOpen, onClose, onSuccess, editingGasto }: AddFixedExpenseModalProps) {
  const [nombre, setNombre] = useState("");
  const [monto, setMonto] = useState("");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingGasto) {
      setNombre(editingGasto.nombre);
      setMonto(editingGasto.monto.toString());
      setLink(editingGasto.link || "");
    } else {
      setNombre("");
      setMonto("");
      setLink("");
    }
  }, [editingGasto, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        nombre,
        monto: parseFloat(monto),
        link: link || undefined,
      };

      if (editingGasto) {
        await updateGastoFijo(editingGasto.id, payload);
      } else {
        await createGastoFijo(payload);
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      alert("Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-[#18181b] border border-zinc-800 shadow-2xl w-full max-w-md rounded-lg overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-zinc-950/60 px-5 py-4 border-b border-zinc-800 text-zinc-100 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold tracking-tight text-zinc-100">
              {editingGasto ? "Editar" : "Nuevo"} Gasto Fijo
            </h2>
            <p className="text-[10px] font-medium text-zinc-500 mt-0.5">Configuración de pago mensual</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-medium text-zinc-500 mb-1">Nombre del Servicio</label>
              <input
                required
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="input-banking w-full text-xs"
                placeholder="Ej: Internet, Luz, Alquiler..."
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium text-zinc-500 mb-1">Monto Mensual ($)</label>
              <input
                required
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="input-banking w-full text-xs font-mono"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium text-zinc-500 mb-1">Link de Pago (Opcional)</label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="input-banking w-full text-xs"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-zinc-850">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-banking-secondary flex items-center justify-center h-9"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-banking-primary flex items-center justify-center h-9 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Guardar"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
