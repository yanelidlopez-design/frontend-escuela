import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, KeyRound, AlertCircle, BookOpen } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(username, password);
    } catch (err) {
      let mensaje = 'Credenciales incorrectas.';
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network') || err.request) {
        mensaje = 'No se pudo conectar con el servidor central.';
      } else if (err.response?.status === 401) {
        mensaje = 'Credenciales incorrectas.';
      } else if (err.response?.data?.detail) {
        mensaje = err.response.data.detail;
      }
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-600 text-white mb-4 shadow-lg shadow-sky-600/30">
            <BookOpen size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Sistema Académico</h1>
          <p className="text-sm text-slate-500 mt-1">Inicie sesión con su cuenta institucional</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-700 text-sm">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Usuario
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 text-slate-400" size={18} />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ej. admin"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Contraseña
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3 text-slate-400" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
            ) : (
              <>
                <Lock size={18} />
                <span>Ingresar al Sistema</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            Conectado a la API: <code className="text-sky-600 font-mono">/api/token/</code>
          </p>
        </div>
      </div>
    </div>
  );
};
