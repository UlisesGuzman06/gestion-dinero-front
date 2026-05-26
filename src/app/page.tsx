"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import SummaryCard from "@/components/SummaryCard";
import TransactionTable from "@/components/TransactionTable";
import AddMovementModal from "@/components/AddMovementModal";
import FixedExpenses from "@/components/FixedExpenses";
import TickerBar from "@/components/TickerBar";
import { getBalance, getIngresos, getGastos, getPaymentHistory, getCotizaciones, getInversiones } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User as UserIcon, Loader2, LayoutDashboard, Wallet } from "lucide-react";
import InversionesManager from "@/components/InversionesManager";

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const [balance, setBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [inversiones, setInversiones] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<any | null>(null);
  const [fetching, setFetching] = useState(false);
  const [cotizaciones, setCotizaciones] = useState<any>(null);
  const [dolarizar, setDolarizar] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "inversiones">("dashboard");
  const [selectedPeriod, setSelectedPeriod] = useState<string>(() => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    return `${now.getFullYear()}-${mm}`;
  });
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);

  const getPeriodLabel = useCallback(() => {
    if (selectedPeriod === "all") return "Historial";
    const [y, m] = selectedPeriod.split("-");
    const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    const label = dateObj.toLocaleDateString("es-AR", { month: "long" });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [selectedPeriod]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setFetching(true);
    try {
      let targetYear: number | undefined;
      let targetMonth: number | undefined;

      if (selectedPeriod !== "all") {
        const [yStr, mStr] = selectedPeriod.split("-");
        targetYear = parseInt(yStr, 10);
        targetMonth = parseInt(mStr, 10) - 1;
      }

      const [bal, inc, exp, mp, cotis, invs] = await Promise.all([
        getBalance(targetYear, targetMonth),
        getIngresos(),
        getGastos(),
        getPaymentHistory(),
        getCotizaciones().catch(err => {
          console.error("Error al cargar cotizaciones:", err);
          return null;
        }),
        getInversiones().catch(err => {
          console.error("Error al cargar inversiones:", err);
          return [];
        })
      ]);

      setBalance(bal);
      setCotizaciones(cotis);
      setInversiones(invs);

      const now = new Date();
      const rawAll = [
        ...(Array.isArray(inc) ? inc.map((i: any) => ({ ...i, tipo: "ingreso" as const })) : []),
        ...(Array.isArray(exp) ? exp.map((e: any) => ({ ...e, tipo: "gasto" as const })) : []),
        ...(Array.isArray(mp) ? mp.map((m: any) => ({
          ...m,
          categoria: "Mercado Pago",
          tipo: m.tipo === 'ingreso' ? 'ingreso' : 'gasto'
        })) : []),
      ];

      // Generar lista de períodos disponibles (YYYY-MM) a partir de los datos
      const periodsSet = new Set<string>();
      rawAll.forEach(item => {
        if (item.fecha) {
          const yyyymm = item.fecha.split('T')[0].substring(0, 7);
          if (/^\d{4}-\d{2}$/.test(yyyymm)) {
            periodsSet.add(yyyymm);
          }
        }
      });
      // Asegurarse de que el mes actual esté en la lista
      const nowPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      periodsSet.add(nowPeriod);

      const sortedPeriods = Array.from(periodsSet).sort().reverse();
      setAvailablePeriods(sortedPeriods);

      // Extracción de año/mes timezone-safe basada en cadenas
      const getYearAndMonth = (dateStr: string) => {
        const parts = dateStr.split('T')[0].split('-');
        return {
          year: parseInt(parts[0], 10),
          month: parseInt(parts[1], 10) - 1,
        };
      };

      const filtered = rawAll.filter(item => {
        if (!item.fecha) return false;
        if (selectedPeriod === "all") return true;
        const { year, month } = getYearAndMonth(item.fecha);
        return year === targetYear && month === targetMonth;
      }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

      setTransactions(filtered);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setFetching(false);
    }
  }, [user, selectedPeriod]);

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

  const formatAmount = (amount: number, prefixSymbol = "") => {
    if (dolarizar && cotizaciones?.dolares?.mep?.venta) {
      const converted = amount / cotizaciones.dolares.mep.venta;
      return `${prefixSymbol}u$s ${converted.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${prefixSymbol}$${amount.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
  };

  if (loading || (!user && !loading)) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-6 w-6 text-zinc-500 animate-spin mx-auto" />
          <p className="text-xs text-zinc-500 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex font-sans bg-[#09090b]">
      {/* Sidebar Navigation - Desktop only */}
      <aside className="hidden md:flex md:w-64 md:fixed md:inset-y-0 bg-[#09090b] border-r border-zinc-900 p-5 flex-col z-30">
        {/* Brand/Logo */}
        <div className="flex items-center gap-2.5 pb-6 border-b border-zinc-900">
          <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-zinc-950 font-bold text-sm tracking-tight">P</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-zinc-150 tracking-tight leading-none">Plata</h1>
            <p className="text-[10px] font-medium text-zinc-500 mt-1">Gestión Patrimonial</p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-1 mt-6">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-zinc-900 text-zinc-100 border border-zinc-800"
                : "text-zinc-450 hover:bg-zinc-900/50 hover:text-zinc-200 border border-transparent"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Resumen
          </button>
          <button
            onClick={() => setActiveTab("inversiones")}
            className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === "inversiones"
                ? "bg-zinc-900 text-zinc-100 border border-zinc-800"
                : "text-zinc-455 hover:bg-zinc-900/50 hover:text-zinc-200 border border-transparent"
            }`}
          >
            <Wallet className="h-4 w-4" />
            Mi Portafolio
          </button>
        </nav>

        {/* Market Rates Widget in Sidebar */}
        <div className="border-t border-zinc-900 pt-4 pb-4">
          <TickerBar isSidebar={true} />
        </div>

        {/* User profile & Logout */}
        <div className="border-t border-zinc-900 pt-4">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
                <UserIcon className="h-3.5 w-3.5 text-zinc-500" />
              </div>
              <span className="text-xs font-medium text-zinc-400 truncate max-w-[120px]">
                {user?.email?.split('@')[0]}
              </span>
            </div>
            <button 
              onClick={signOut}
              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen bg-[#09090b]">
        {/* Header - Mobile only */}
        <header className="flex md:hidden bg-zinc-950 border-b border-zinc-900 py-3.5 px-6 justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-zinc-100 rounded-lg flex items-center justify-center">
              <span className="text-zinc-950 font-bold text-xs">P</span>
            </div>
            <h1 className="text-sm font-bold text-zinc-100 tracking-tight">Plata</h1>
          </div>
          
          <button 
            onClick={signOut}
            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
            title="Cerrar Sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        {/* Tab Navigation - Mobile only */}
        <div className="flex md:hidden border-b border-zinc-900 bg-zinc-950/90 backdrop-blur sticky top-[53px] z-20 px-6 gap-6">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`py-3 text-xs font-medium flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "dashboard"
                ? "border-zinc-300 text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Resumen
          </button>
          <button
            onClick={() => setActiveTab("inversiones")}
            className={`py-3 text-xs font-medium flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "inversiones"
                ? "border-zinc-300 text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Wallet className="h-3.5 w-3.5" />
            Mi Portafolio
          </button>
        </div>

        {/* Inner page content container */}
        <main className="flex-1 p-4 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto">
          {activeTab === "dashboard" ? (
            <div className="space-y-8">
              {/* Header Title & Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-zinc-900">
                <div className="space-y-0.5">
                  <h2 className="text-xl font-bold tracking-tight text-zinc-100">Resumen Financiero</h2>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-zinc-500">Estado de tu situación patrimonial y flujos</p>
                    {fetching && <Loader2 className="h-3 w-3 text-zinc-400 animate-spin" />}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {/* Selector de Período */}
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="w-full sm:w-auto bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-lg px-2.5 py-1.5 outline-none text-xs cursor-pointer font-medium hover:border-zinc-700 transition-colors"
                  >
                    <option value="all">Todos los meses</option>
                    {availablePeriods.map(p => {
                      const [y, m] = p.split("-");
                      const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
                      const label = dateObj.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
                      const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);
                      return (
                        <option key={p} value={p}>
                          {capitalizedLabel}
                        </option>
                      );
                    })}
                  </select>

                  {cotizaciones?.dolares?.mep && (
                    <button
                      onClick={() => setDolarizar(!dolarizar)}
                      className={`w-full sm:w-auto px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                        dolarizar
                          ? "bg-zinc-900 border-zinc-800 text-zinc-200"
                          : "bg-[#09090b] border-zinc-900 text-zinc-450 hover:text-zinc-200 hover:border-zinc-800"
                       }`}
                    >
                      {dolarizar ? "Ver en Pesos ($)" : "Ver en Dólares (u$s)"}
                    </button>
                  )}
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="w-full sm:w-auto px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-medium rounded-lg shadow-sm transition-all cursor-pointer text-center"
                  >
                    + Registrar Movimiento
                  </button>
                </div>
              </div>

              {/* Tarjetas de Resumen - Full Width */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
                <SummaryCard 
                  title="Balance General" 
                  amount={formatAmount((balance?.balanceActual || 0) + (balance?.totalInvertidoReal || 0))} 
                  subtitle="Total líquido + invertido" 
                />
                <SummaryCard 
                  title="Disponible para Gastar" 
                  amount={formatAmount(balance?.balanceActual || 0)} 
                  subtitle={dolarizar ? "Convertido al Dólar MEP" : "Capital líquido disponible"} 
                  color="success"
                />
                <SummaryCard 
                  title="Balance Invertido" 
                  amount={formatAmount(balance?.totalInvertidoReal || 0)} 
                  subtitle="Capital en inversiones" 
                  color="investment"
                />
                <SummaryCard 
                  title={`Ingresos (${getPeriodLabel()})`} 
                  amount={formatAmount(balance?.totalIngresos || 0, "+")} 
                  subtitle="Total percibido" 
                  color="success"
                />
                <SummaryCard 
                  title={`Gastos (${getPeriodLabel()})`} 
                  amount={formatAmount(balance?.totalGastos || 0, "-")} 
                  subtitle="Total ejecutado" 
                  color="danger"
                />
                <SummaryCard 
                  title={`Cuota Inversión (${getPeriodLabel()})`} 
                  amount={formatAmount(balance?.totalADestinarInversion || 0)} 
                  subtitle="Inversión sugerida (15%)" 
                  color="investment"
                />
              </div>

              {/* Grid 2-Columnas Principal */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Columna Izquierda (Principal - 2/3) */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Historial Transaccional */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-500"></span>
                      Historial Transaccional
                    </h3>
                    <TransactionTable 
                      transactions={transactions} 
                      onRefresh={fetchData} 
                      onEdit={handleEditMovement}
                      dolarizar={dolarizar}
                      cotizaciones={cotizaciones}
                    />
                  </div>
                </div>

                {/* Columna Derecha (Sidebar lateral widgets - 1/3) */}
                <div className="space-y-8">
                  {/* Gastos Fijos */}
                  <FixedExpenses 
                    onRefresh={fetchData} 
                    dolarizar={dolarizar}
                    cotizaciones={cotizaciones}
                  />

                  {/* Meta de Ahorro */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                      Meta de Ahorro
                    </h3>
                    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-lg p-5">
                      <div className="flex justify-between items-end mb-2.5">
                        <span className="text-[11px] font-medium text-zinc-400">Progreso Inversión sugerida (15%)</span>
                        <span className="text-xs font-semibold text-indigo-400">
                          {balance?.totalADestinarInversion > 0 
                            ? Math.round((balance?.totalInvertidoReal / balance?.totalADestinarInversion) * 100) 
                            : 0}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-850 rounded-full overflow-hidden mb-3">
                        <div 
                          className="h-full bg-indigo-500 transition-all duration-500 ease-out rounded-full"
                          style={{ width: `${balance?.totalADestinarInversion > 0 ? Math.min((balance?.totalInvertidoReal / balance?.totalADestinarInversion) * 100, 100) : 0}%` }}
                        ></div>
                      </div>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">
                        Has reservado <span className="font-semibold text-zinc-300">{formatAmount(balance?.totalInvertidoReal || 0)}</span> de los <span className="font-semibold text-zinc-300">{formatAmount(balance?.totalADestinarInversion || 0)}</span> sugeridos para {selectedPeriod === "all" ? "este mes" : getPeriodLabel().toLowerCase()}.
                      </p>
                    </div>
                  </div>

                  {/* Mercado / Cotizaciones - Solo visible en móviles */}
                  <div className="block md:hidden">
                    <TickerBar />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Title & Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-zinc-900">
                <div className="space-y-0.5">
                  <h2 className="text-xl font-bold tracking-tight text-zinc-100">Mi Portafolio</h2>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-zinc-500">Seguimiento de inversiones y tenencias crypto/manuales</p>
                    {fetching && <Loader2 className="h-3 w-3 text-zinc-400 animate-spin" />}
                  </div>
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  {cotizaciones?.dolares?.mep && (
                    <button
                      onClick={() => setDolarizar(!dolarizar)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                        dolarizar
                          ? "bg-zinc-900 border-zinc-800 text-zinc-200"
                          : "bg-[#09090b] border-zinc-900 text-zinc-450 hover:text-zinc-200 hover:border-zinc-800"
                      }`}
                    >
                      {dolarizar ? "Ver en Pesos ($)" : "Ver en Dólares (u$s)"}
                    </button>
                  )}
                </div>
              </div>

              <InversionesManager 
                inversiones={inversiones}
                cotizaciones={cotizaciones}
                dolarizar={dolarizar}
                onRefresh={fetchData}
              />
            </div>
          )}
        </main>
      </div>

      <AddMovementModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSuccess={fetchData}
        editingMovement={editingMovement}
      />
    </div>
  );
}
