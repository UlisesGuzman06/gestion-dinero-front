"use client";
import { useEffect, useState } from "react";
import { getGastosFijos, deleteGastoFijo, createPaymentPreference } from "@/lib/api";
import AddFixedExpenseModal from "./AddFixedExpenseModal";
import { CreditCard, Edit2, Trash2, Calendar } from "lucide-react";

interface GastoFijo {
  id: string;
  nombre: string;
  monto: number;
  link?: string;
}

interface FixedExpensesProps {
  onRefresh?: () => void;
  dolarizar?: boolean;
  cotizaciones?: any;
}

export default function FixedExpenses({ 
  onRefresh, 
  dolarizar = false, 
  cotizaciones 
}: FixedExpensesProps) {
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

  // Helper de formateo de moneda
  const formatAmount = (amount: number) => {
    if (dolarizar && cotizaciones?.dolares?.mep?.venta) {
      const converted = amount / cotizaciones.dolares.mep.venta;
      return `u$s ${converted.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${amount.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
  };

  return (
    <section className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500"></span>
          Gastos Fijos
        </h3>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          + Nuevo Gasto
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {gastos.map(g => (
          <div 
            key={g.id} 
            className="p-3.5 bg-zinc-900/40 border border-zinc-800/80 rounded-lg flex justify-between items-center group transition-all"
          >
            <div className="flex flex-col">
              <span className="text-xs font-medium text-zinc-200">{g.nombre}</span>
              <span className="text-[11px] text-zinc-500 font-mono mt-0.5">{formatAmount(g.monto)}</span>
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
                 className="px-2 py-0.5 rounded border border-zinc-800 text-[10px] font-medium text-zinc-350 bg-zinc-900 hover:bg-zinc-800 transition-all flex items-center gap-1 cursor-pointer"
               >
                 <CreditCard className="h-3 w-3 text-zinc-500" />
                 Pagar
               </button>
               
               <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 ml-1">
                 <button 
                   onClick={() => handleEdit(g)}
                   className="p-1 text-zinc-550 hover:text-zinc-300 transition-colors cursor-pointer"
                   title="Editar"
                 >
                   <Edit2 className="h-3 w-3" />
                 </button>
                 <button 
                   onClick={() => handleDelete(g.id)}
                   className="p-1 text-zinc-550 hover:text-red-400 transition-colors cursor-pointer"
                   title="Borrar"
                 >
                   <Trash2 className="h-3 w-3" />
                 </button>
               </div>
            </div>
          </div>
        ))}
        {gastos.length === 0 && (
          <div className="p-8 text-center border border-dashed border-zinc-800/80 rounded-lg bg-zinc-900/10">
            <p className="text-xs text-zinc-500">No tienes gastos fijos configurados</p>
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
