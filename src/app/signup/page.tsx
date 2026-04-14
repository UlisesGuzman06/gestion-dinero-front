"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, ArrowLeft, Loader2 } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      alert("¡Cuenta creada! Revisa tu email para confirmar.");
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-bank-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button 
          onClick={() => router.push('/login')}
          className="flex items-center gap-2 text-gray-400 hover:text-bank-primary transition-colors text-[10px] font-bold uppercase mb-6 tracking-widest"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al Login
        </button>

        <div className="bg-white rounded-[32px] shadow-2xl border border-white/20 overflow-hidden">
          <div className="bg-bank-investment p-8 text-center text-white">
            <h1 className="text-2xl font-black uppercase tracking-tight mb-1">Únete a PLATA</h1>
            <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest">Nueva membrecía de tesorería</p>
          </div>

          <form onSubmit={handleSignup} className="p-8 space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl text-center font-medium">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-bank-investment/20 focus:border-bank-investment transition-all"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-bank-investment/20 focus:border-bank-investment transition-all"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-bank-investment text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-bank-investment/20 hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear Cuenta"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
