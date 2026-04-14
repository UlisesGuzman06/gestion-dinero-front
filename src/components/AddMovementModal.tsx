"use client";
import { useState, useEffect } from "react";
import { createIngreso, createGasto, updateMovement } from "@/lib/api";

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
    <div className="fixed inset-0 bg-bank-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-bank-primary p-6 text-white">
          <h2 className="text-xl font-black uppercase tracking-tighter">
            {editingMovement ? "Editar" : "Nuevo"} Movimiento
          </h2>
          <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-1">Gestión de Tesorería Personal</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              disabled={!!editingMovement}
              onClick={() => setType("gasto")}
              className={`flex-1 py-2 px-4 rounded-lg text-[10px] font-bold uppercase transition-all ${type === "gasto" ? "bg-white text-bank-danger shadow-sm" : "text-gray-500 opacity-50"}`}
            >
              Gasto
            </button>
            <button
              type="button"
              disabled={!!editingMovement}
              onClick={() => setType("ingreso")}
              className={`flex-1 py-2 px-4 rounded-lg text-[10px] font-bold uppercase transition-all ${type === "ingreso" ? "bg-white text-bank-success shadow-sm" : "text-gray-500 opacity-50"}`}
            >
              Ingreso
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Descripción</label>
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
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Monto ($)</label>
                <input
                  required
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-banking w-full"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Fecha</label>
                <input
                  required
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-banking w-full"
                />
              </div>

              {type === "gasto" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Categoría</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="input-banking w-full"
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
                      <label className="block text-[10px] font-bold text-bank-investment uppercase tracking-widest mb-1">Especificar Categoría</label>
                      <input
                        required
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="input-banking w-full border-bank-investment/30"
                        placeholder="Ej: Gimnasio, Farmacia..."
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 btn-banking ${type === "ingreso" ? "bg-bank-success border-bank-success shadow-bank-success/20" : "bg-bank-danger border-bank-danger shadow-bank-danger/20"}`}
            >
              {loading ? "Procesando..." : editingMovement ? "Guardar Cambios" : `Registrar ${type}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
