"use client";
import { useEffect, useState, useCallback } from "react";
import SummaryCard from "@/components/SummaryCard";
import TransactionTable from "@/components/TransactionTable";
import AddMovementModal from "@/components/AddMovementModal";
import FixedExpenses from "@/components/FixedExpenses";
import { getBalance, getIngresos, getGastos } from "@/lib/api";

export default function Dashboard() {
  const [balance, setBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<any | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [bal, inc, exp] = await Promise.all([
        getBalance(),
        getIngresos(),
        getGastos(),
      ]);
      
      setBalance(bal);
      
      const all = [
        ...(Array.isArray(inc) ? inc.map((i: any) => ({ ...i, tipo: "ingreso" as const })) : []),
        ...(Array.isArray(exp) ? exp.map((e: any) => ({ ...e, tipo: "gasto" as const })) : []),
      ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      
      setTransactions(all);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEditMovement = (movement: any) => {
    setEditingMovement(movement);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMovement(null);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50 pb-20">
      {/* Header Decorativo */}
      <header className="bg-white py-6 px-6 md:px-12 flex justify-between items-center border-b border-gray-100 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-bank-primary rounded-xl flex items-center justify-center shadow-lg shadow-bank-primary/20">
            <span className="text-white font-black text-xl italic tracking-tighter">P</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-bank-primary tracking-tighter uppercase leading-none">Plata</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] leading-none mt-1">Gestión Patrimonial</p>
          </div>
        </div>
        <div className="hidden md:block">
           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic select-none">Consola de Control • Versión 2.0</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 md:px-12 max-w-7xl mx-auto w-full space-y-8">
        
        <section>
          <div className="flex justify-between items-end mb-6">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Panel de Control</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Estado de situación financiera</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-bank-primary text-white text-[10px] uppercase font-black tracking-widest rounded-xl shadow-xl shadow-bank-primary/20 hover:-translate-y-0.5 transition-all"
            >
              + Registrar Movimiento
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard 
              title="Balance General" 
              amount={`$${(balance?.balanceActual || 0).toLocaleString("es-AR")}`} 
              subtitle="Capital líquido disponible" 
            />
            <SummaryCard 
              title="Ingresos del Mes" 
              amount={`+$${(balance?.totalIngresos || 0).toLocaleString("es-AR")}`} 
              subtitle="Total percibido" 
              color="success"
            />
            <SummaryCard 
              title="Gastos del Mes" 
              amount={`-$${(balance?.totalGastos || 0).toLocaleString("es-AR")}`} 
              subtitle="Total ejecutado" 
              color="danger"
            />
            <SummaryCard 
              title="Cuota Inversión (15%)" 
              amount={`$${(balance?.totalADestinarInversion || 0).toLocaleString("es-AR")}`} 
              subtitle="Fondo de crecimiento" 
              color="investment"
            />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 space-y-4">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-4 h-[1px] bg-gray-300"></span>
              Historial Transaccional
            </h3>
            <TransactionTable 
              transactions={transactions} 
              onRefresh={fetchData} 
              onEdit={handleEditMovement}
            />
          </section>

          <section className="space-y-8">
            <FixedExpenses onRefresh={fetchData} />

            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-4 h-[1px] bg-gray-300"></span>
                Meta de Ahorro
              </h3>
              <div className="card-banking p-6">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Progreso Inversión</span>
                  <span className="text-xl font-black text-bank-investment">
                    {balance?.totalADestinarInversion > 0 
                      ? Math.round((balance?.totalInvertidoReal / balance?.totalADestinarInversion) * 100) 
                      : 0}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 mb-4">
                  <div 
                    className={`h-full bg-bank-investment transition-all duration-500`}
                    style={{ width: `${balance?.totalADestinarInversion > 0 ? (balance?.totalInvertidoReal / balance?.totalADestinarInversion) * 100 : 0}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-gray-400 italic leading-relaxed">
                  Has reservado <span className="font-bold text-gray-700">${(balance?.totalInvertidoReal || 0).toLocaleString("es-AR")}</span> de los <span className="font-bold text-gray-700">${(balance?.totalADestinarInversion || 0).toLocaleString("es-AR")}</span> sugeridos.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="py-12 px-6 border-t border-gray-100 mt-auto bg-white">
        <p className="text-[9px] text-gray-400 text-center uppercase tracking-[0.3em] font-bold">
          Plata Sistema de Gestión Financiera &copy; 2026
        </p>
      </footer>

      <AddMovementModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSuccess={fetchData}
        editingMovement={editingMovement}
      />
    </div>
  );
}
