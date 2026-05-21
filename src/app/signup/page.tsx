"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowLeft, Loader2 } from "lucide-react";

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
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <button 
          onClick={() => router.push('/login')}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors text-[10px] font-medium mb-4 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al Login
        </button>

        <div className="bg-[#18181b] border border-zinc-800 rounded-lg overflow-hidden shadow-xl">
          <div className="bg-zinc-950/60 p-6 text-center border-b border-zinc-800">
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">Únete a PLATA</h1>
            <p className="text-[10px] text-zinc-500 font-medium mt-1">Crea tu cuenta de tesorería</p>
          </div>

          <form onSubmit={handleSignup} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg text-center font-medium">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-zinc-500 mb-1 block">Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-3.5 w-3.5 text-zinc-500" />
                  </div>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg text-xs placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-0 transition-all font-sans"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-medium text-zinc-500 mb-1 block">Contraseña</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-3.5 w-3.5 text-zinc-500" />
                  </div>
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg text-xs placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-0 transition-all font-sans"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-banking-primary flex items-center justify-center gap-2 h-10 disabled:opacity-50 mt-2"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Crear Cuenta"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
