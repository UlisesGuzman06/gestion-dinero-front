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
    <div className="min-h-screen bg-bank-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-bank-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-bank-investment/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white rounded-[32px] shadow-2xl border border-white/20 backdrop-blur-xl overflow-hidden">
          <div className="bg-bank-primary p-8 text-center">
            <h1 className="text-4xl font-black text-white italic tracking-tighter mb-2">PLATA</h1>
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em]">Gestión Financiera de Élite</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800">Bienvenido de nuevo</h2>
              <p className="text-gray-500 text-sm mt-1">Ingresa a tu tesorería personal</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl text-center font-medium animate-in shake">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400 group-focus-within:text-bank-primary transition-colors" />
                  </div>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-bank-primary/20 focus:border-bank-primary transition-all"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Contraseña</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-bank-primary transition-colors" />
                  </div>
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-bank-primary/20 focus:border-bank-primary transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-bank-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-bank-primary/20 hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Iniciar Sesión"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                <span className="bg-white px-4 text-gray-400">O continúa con</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-100 py-3.5 rounded-2xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm active:scale-[0.98]"
            >
              <Globe className="h-5 w-5" />
              Google / Gmail
            </button>

            <p className="text-center text-xs text-gray-400 mt-8">
              ¿No tienes cuenta? <span className="text-bank-primary font-bold cursor-pointer hover:underline" onClick={() => router.push('/signup')}>Regístrate</span>
            </p>
          </div>
        </div>
        
        <p className="mt-8 text-center text-gray-400 text-[10px] uppercase font-bold tracking-[0.3em]">Pure Silver Architecture 2026</p>
      </div>
    </div>
  );
}
