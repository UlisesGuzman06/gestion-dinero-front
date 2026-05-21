"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Mail, Lock, Globe, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      }
    });
    if (error) setError(error.message);
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-[#18181b] border border-zinc-800 rounded-lg overflow-hidden shadow-xl">
          
          {/* Top Branding Section */}
          <div className="bg-zinc-950/60 p-6 text-center border-b border-zinc-800">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-100">PLATA</h1>
            <p className="text-zinc-500 text-[10px] font-medium mt-1">Gestión Financiera Personal</p>
          </div>

          <div className="p-6 space-y-4">
            <div className="text-center">
              <h2 className="text-base font-semibold text-zinc-100 tracking-tight">Bienvenido</h2>
              <p className="text-zinc-400 text-xs mt-1">Ingresa a tu tesorería personal</p>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg text-center font-medium">
                {error === "Invalid login credentials" ? "Credenciales de acceso inválidas" : error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
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
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-banking-primary flex items-center justify-center gap-2 h-10 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Iniciar Sesión"}
                {!loading && <ArrowRight className="h-3.5 w-3.5" />}
              </button>
            </form>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800"></div>
              </div>
              <div className="relative flex justify-center text-[10px] font-medium">
                <span className="bg-[#18181b] px-3 text-zinc-500">O continúa con</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-200 px-4 py-2 rounded-lg font-medium text-xs transition-all cursor-pointer h-10"
            >
              <Globe className="h-4 w-4 text-zinc-400" />
              Google / Gmail
            </button>

            <p className="text-center text-xs text-zinc-400 mt-6">
              ¿No tienes cuenta? <span className="text-zinc-200 hover:text-zinc-100 font-medium cursor-pointer hover:underline" onClick={() => router.push('/signup')}>Regístrate</span>
            </p>
          </div>
        </div>
        
        <p className="mt-8 text-center text-zinc-600 text-[10px] font-medium">PLATA &copy; 2026</p>
      </div>
    </div>
  );
}
