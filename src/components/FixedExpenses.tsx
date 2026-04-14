"use client";
import { useEffect, useState } from "react";
import { getGastosFijos, deleteGastoFijo, createPaymentPreference } from "@/lib/api";
import AddFixedExpenseModal from "./AddFixedExpenseModal";

interface GastoFijo {
  id: string;
  nombre: string;
  monto: number;
  link?: string;
}

interface FixedExpensesProps {
  onRefresh?: () => void;
}

export default function FixedExpenses({ onRefresh }: FixedExpensesProps) {
  const [gastos, setGastos] = useState<GastoFijo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGasto, setEditingGasto] = useState<GastoFijo | null>(null);

  const fetchData = async () => {
    try {
      const data = await getGastosFijos();
      if (Array.isArray(data)) setGastos(data);
    } catch (error) {
      console.error("Error fetching fixed expenses:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    fetchData();
    if (onRefresh) onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Eliminar gasto fijo?")) {
      await deleteGastoFijo(id);
      handleRefresh();
    }
  };

  const handleEdit = (gasto: GastoFijo) => {
    setEditingGasto(gasto);
    setIsModalOpen(true);
  };

  const handlePayMP = async (gasto: GastoFijo) => {
    try {
      const { init_point } = await createPaymentPreference(gasto.nombre, gasto.monto);
      if (init_point) {
        const width = 600;
        const height = 800;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        window.open(
          init_point, 
          "MercadoPago", 
          `width=${width},height=${height},top=${top},left=${left},scrollbars=yes`
        );
      }
    } catch (error) {
      console.error("Error creating MP preference:", error);
      alert("Error al procesar el pago con Mercado Pago");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGasto(null);
  };

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
          <span className="w-4 h-[1px] bg-gray-300"></span>
          Gastos Fijos y Pagos
        </h3>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="text-[10px] font-black uppercase text-bank-primary hover:text-blue-700 transition-colors tracking-tighter"
        >
          + Nuevo Fijo
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {gastos.map(g => (
          <div key={g.id} className="card-banking p-4 flex justify-between items-center group hover:border-bank-primary/30 transition-all">
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-tighter text-gray-900">{g.nombre}</span>
              <span className="text-[10px] font-bold text-gray-400 italic">${g.monto.toLocaleString("es-AR")}</span>
            </div>
            <div className="flex items-center gap-2">
               <button 
                 onClick={() => {
                   if (g.link) {
                     window.open(g.link.startsWith('http') ? g.link : `https://${g.link}`, "_blank");
                   } else {
                     handlePayMP(g);
                   }
                 }}
                 className="text-[9px] font-bold uppercase text-bank-primary hover:text-blue-700 transition-all"
               >
                 Pagar
               </button>
               <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all ml-2">
                 <button 
                   onClick={() => handleEdit(g)}
                   className="text-[9px] font-bold uppercase text-gray-400 hover:text-gray-600"
                 >
                   Editar
                 </button>
                 <button 
                   onClick={() => handleDelete(g.id)}
                   className="text-[9px] font-bold uppercase text-red-300 hover:text-red-500"
                 >
                   Borrar
                 </button>
               </div>
            </div>
          </div>
        ))}
        {gastos.length === 0 && (
          <div className="p-8 text-center border-2 border-dashed border-gray-100 rounded-xl">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">No tienes gastos fijos configurados</p>
          </div>
        )}
      </div>

      <AddFixedExpenseModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSuccess={handleRefresh} 
        editingGasto={editingGasto}
      />
    </section>
  );
}
