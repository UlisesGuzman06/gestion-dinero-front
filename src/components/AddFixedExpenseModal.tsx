"use client";
import { useState, useEffect } from "react";
import { createGastoFijo, updateGastoFijo } from "@/lib/api";

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
    <div className="fixed inset-0 bg-bank-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-bank-primary p-6 text-white">
          <h2 className="text-xl font-black uppercase tracking-tighter">
            {editingGasto ? "Editar" : "Nuevo"} Gasto Fijo
          </h2>
          <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-1">Configuración de pago mensual</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Nombre del Servicio</label>
              <input
                required
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="input-banking w-full"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Monto Mensual</label>
              <input
                required
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="input-banking w-full"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Link de Pago</label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="input-banking w-full"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-banking"
            >
              {loading ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
