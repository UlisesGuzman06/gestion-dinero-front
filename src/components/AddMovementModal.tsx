"use client";
import { useState, useEffect } from "react";
import { createIngreso, createGasto, updateMovement } from "@/lib/api";
import { X, Loader2 } from "lucide-react";

interface AddMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingMovement?: any | null;
}

export default function AddMovementModal({ isOpen, onClose, onSuccess, editingMovement }: AddMovementModalProps) {
  const [type, setType] = useState<"ingreso" | "gasto">("gasto");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("comida");
  const [customCategory, setCustomCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingMovement) {
      setType(editingMovement.tipo);
      setDescription(editingMovement.descripcion);
      setAmount(Math.abs(editingMovement.monto).toString());
      
      if (editingMovement.tipo === "gasto") {
        const knownCategories = ["comida", "transporte", "ocio", "servicios"];
        if (knownCategories.includes(editingMovement.categoria)) {
          setCategory(editingMovement.categoria);
          setCustomCategory("");
        } else {
          setCategory("otro");
          setCustomCategory(editingMovement.categoria);
        }
      }
      
      const d = new Date(editingMovement.fecha);
      setDate(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0]);
    } else {
      setType("gasto");
      setDescription("");
      setAmount("");
      setCategory("comida");
      setCustomCategory("");
      setDate(new Date().toISOString().split("T")[0]);
    }
  }, [editingMovement, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const finalCategory = category === "otro" ? customCategory : category;
      const finalDate = new Date(date + "T12:00:00");

      const payload = {
        descripcion: description,
        monto: parseFloat(amount),
        categoria: type === "gasto" ? finalCategory : undefined,
        fecha: finalDate,
      };

      if (editingMovement) {
          await updateMovement(editingMovement.id, editingMovement.tipo, payload);
      } else {
        if (type === "ingreso") {
          await createIngreso(payload);
        } else {
          await createGasto(payload);
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      alert("Error al guardar el movimiento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-[#18181b] border border-zinc-800 shadow-2xl w-full max-w-md rounded-lg overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-zinc-950/60 px-5 py-4 border-b border-zinc-850 text-zinc-100 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold tracking-tight text-zinc-100">
              {editingMovement ? "Editar" : "Nuevo"} Movimiento
            </h2>
            <p className="text-[10px] font-medium text-zinc-500 mt-0.5">Gestión de Tesorería Personal</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Selector Gasto / Ingreso */}
          <div className="grid grid-cols-2 gap-1.5 bg-zinc-950/65 p-1 rounded-lg border border-zinc-900">
            <button
              type="button"
              disabled={!!editingMovement}
              onClick={() => setType("gasto")}
              className={`py-1.5 px-3 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                type === "gasto" 
                  ? "bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-sm" 
                  : "text-zinc-500 border border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              Gasto
            </button>
            <button
              type="button"
              disabled={!!editingMovement}
              onClick={() => setType("ingreso")}
              className={`py-1.5 px-3 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                type === "ingreso" 
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-sm" 
                  : "text-zinc-500 border border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              Ingreso
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-medium text-zinc-500 mb-1">Descripción</label>
                <input
                  required
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-banking w-full"
                  placeholder="Ej: Sueldo, Supermercado..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-zinc-500 mb-1">Monto ($)</label>
                <input
                  required
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-banking w-full font-mono"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-medium text-zinc-500 mb-1">Fecha</label>
                <input
                  required
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-banking w-full text-zinc-300 font-mono"
                />
              </div>

              {type === "gasto" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-500 mb-1">Categoría</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-850 text-zinc-100 rounded-lg px-3 py-2 outline-none text-xs"
                    >
                      <option value="comida">Comida</option>
                      <option value="transporte">Transporte</option>
                      <option value="ocio">Ocio</option>
                      <option value="servicios">Servicios</option>
                      <option value="otro">Otro (especificar...)</option>
                    </select>
                  </div>
                  
                  {category === "otro" && (
                    <div className="animate-in fade-in slide-in-from-top-1">
                      <label className="block text-[10px] font-medium text-zinc-400 mb-1">Especificar Categoría</label>
                      <input
                        required
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="input-banking w-full"
                        placeholder="Ej: Gimnasio, Farmacia..."
                      />
                    </div>
                  )}
                </div>
              )}
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
                editingMovement ? "Guardar" : `Registrar ${type === "ingreso" ? "Ingreso" : "Gasto"}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
