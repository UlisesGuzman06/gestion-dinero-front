import { deleteMovement, createPaymentPreference } from "@/lib/api";

interface Transaction {
  id: string;
  fecha: string;
  descripcion: string;
  monto: number;
  tipo: "ingreso" | "gasto" | "inversion";
  categoria?: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
  onRefresh: () => void;
  onEdit: (transaction: Transaction) => void;
}

export default function TransactionTable({ transactions, onRefresh, onEdit }: TransactionTableProps) {
  const handleDelete = async (id: string, type: "ingreso" | "gasto" | "inversion") => {
    if (confirm("¿Estás seguro de que quieres borrar este movimiento?")) {
      try {
        await deleteMovement(id, type);
        onRefresh();
      } catch (error) {
        console.error("Error al borrar:", error);
        alert("Ocurrió un error al intentar borrar.");
      }
    }
  };

  const handlePayMP = async (transaction: Transaction) => {
    try {
      const { init_point } = await createPaymentPreference(transaction.descripcion, transaction.monto);
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

  return (
    <div className="card-banking overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Fecha</th>
            <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Descripción</th>
            <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Monto</th>
            <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((t) => (
            <tr key={t.id} className="hover:bg-gray-50 transition-colors group">
              <td className="px-6 py-4 text-xs text-gray-500 italic">
                {new Date(t.fecha).toLocaleDateString("es-AR", { day: 'numeric', month: 'short' })}
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">{t.descripcion}</span>
                  {t.categoria && (
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                      {t.categoria}
                    </span>
                  )}
                </div>
              </td>
              <td className={`px-6 py-4 text-sm font-bold text-right ${
                t.tipo === "ingreso" ? "text-bank-success" : 
                t.tipo === "gasto" ? "text-bank-danger" : "text-bank-investment"
              }`}>
                {t.tipo === "ingreso" ? "+" : "-"}${Math.abs(t.monto).toLocaleString("es-AR")}
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-4">
                  {t.tipo === "gasto" && (
                    <button 
                      onClick={() => handlePayMP(t)}
                      className="text-[10px] font-black uppercase text-bank-primary hover:text-blue-700 transition-all tracking-tighter opacity-0 group-hover:opacity-100"
                    >
                      Pagar
                    </button>
                  )}
                  {t.categoria !== "Mercado Pago" && (
                    <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => onEdit(t)}
                        className="text-[10px] font-black uppercase text-gray-400 hover:text-bank-primary transition-all tracking-tighter"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDelete(t.id, t.tipo)}
                        className="text-[10px] font-black uppercase text-red-400 hover:text-red-600 transition-all tracking-tighter"
                      >
                        Borrar
                      </button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {transactions.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-xs uppercase tracking-widest">
                No hay movimientos registrados
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
