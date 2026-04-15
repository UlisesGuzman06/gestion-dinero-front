"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import SummaryCard from "@/components/SummaryCard";
import TransactionTable from "@/components/TransactionTable";
import AddMovementModal from "@/components/AddMovementModal";
import FixedExpenses from "@/components/FixedExpenses";
import { getBalance, getIngresos, getGastos, getPaymentHistory } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User as UserIcon, Loader2 } from "lucide-react";

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  
  const [balance, setBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<any | null>(null);
  const [fetching, setFetching] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setFetching(true);
    try {
      const [bal, inc, exp, mp] = await Promise.all([
        getBalance(),
        getIngresos(),
        getGastos(),
        getPaymentHistory(),
      ]);
      
      setBalance(bal);
      
      const all = [
        ...(Array.isArray(inc) ? inc.map((i: any) => ({ ...i, tipo: "ingreso" as const })) : []),
        ...(Array.isArray(exp) ? exp.map((e: any) => ({ ...e, tipo: "gasto" as const })) : []),
        ...(Array.isArray(mp) ? mp.map((m: any) => ({ 
          ...m, 
          categoria: "Mercado Pago",
          // Map 'otros' to 'gasto' for table compatibility if needed, 
          // but TransactionTable should ideally handle it.
          tipo: m.tipo === 'ingreso' ? 'ingreso' : 'gasto'
        })) : []),
      ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      
      setTransactions(all);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setFetching(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
      fetchData();
    }
  }, [user, loading, router, fetchData]);

  const handleEditMovement = (movement: any) => {
    setEditingMovement(movement);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMovement(null);
  };

  if (loading || (!user && !loading)) {
    return (
      <div className="min-h-screen bg-bank-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-bank-primary animate-spin mx-auto" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Cargando Bóveda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50 pb-20">
      {/* Header Decorativo */}
      <header className="bg-white py-4 px-6 md:px-12 flex justify-between items-center border-b border-gray-100 sticky top-0 z-30 backdrop-blur-md bg-white/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-bank-primary rounded-xl flex items-center justify-center shadow-lg shadow-bank-primary/20">
            <span className="text-white font-black text-xl italic tracking-tighter">P</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-bank-primary tracking-tighter uppercase leading-none">Plata</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] leading-none mt-1">Gestión Patrimonial</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100">
            <UserIcon className="h-4 w-4 text-bank-primary" />
            <span className="text-[11px] font-bold text-gray-600 truncate max-w-[150px]">{user?.email}</span>
          </div>
          <button 
            onClick={signOut}
            className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="Cerrar Sesión"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 md:px-12 max-w-7xl mx-auto w-full space-y-8 mt-8">
        
        <section>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Panel de Control</h2>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Estado de situación financiera</p>
                {fetching && <Loader2 className="h-3 w-3 text-bank-primary animate-spin" />}
              </div>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full md:w-auto px-8 py-4 bg-bank-primary text-white text-[10px] uppercase font-black tracking-widest rounded-2xl shadow-2xl shadow-bank-primary/30 hover:-translate-y-1 transition-all active:scale-[0.98]"
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
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Progreso Inversión</span>
                  <span className="text-xl font-black text-bank-investment">
                    {balance?.totalADestinarInversion > 0 
                      ? Math.round((balance?.totalInvertidoReal / balance?.totalADestinarInversion) * 100) 
                      : 0}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 mb-4 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-bank-investment transition-all duration-1000 ease-out"
                    style={{ width: `${balance?.totalADestinarInversion > 0 ? Math.min((balance?.totalInvertidoReal / balance?.totalADestinarInversion) * 100, 100) : 0}%` }}
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

      <footer className="py-12 px-6 border-t border-gray-100 mt-20 bg-white">
        <p className="text-[9px] text-gray-400 text-center uppercase tracking-[0.3em] font-bold">
          Plata Sistema de Gestión Financiera &copy; 2026 • Premium Cloud Access
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
