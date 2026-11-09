import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Laptop, Lock, User, AlertCircle, ShieldAlert, ArrowRight, Check } from 'lucide-react';

export const Login: React.FC = () => {
  const [studentCode, setStudentCode] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLockedAlert, setIsLockedAlert] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLockedAlert(false);

    if (!studentCode.trim() || !password) {
      setErrorMessage('Por favor ingrese su código institucional y contraseña');
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedUser = await login(studentCode.trim(), password);
      if (loggedUser.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/catalog');
      }
    } catch (err: any) {
      const serverMsg = err.response?.data?.message || 'Error de conexión con el servidor';
      setErrorMessage(serverMsg);

      if (serverMsg.includes('bloqueada') || serverMsg.includes('3 intentos')) {
        setIsLockedAlert(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillQuickCredentials = (code: string, pass: string) => {
    setStudentCode(code);
    setPassword(pass);
    setErrorMessage(null);
    setIsLockedAlert(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.25),rgba(255,255,255,0))]">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-400 shadow-xl shadow-brand-500/30 mb-4">
            <Laptop className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Laboratorio Universitario
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Plataforma Integral de Préstamos y Reservas de Equipos
          </p>
        </div>

        {/* Card Form */}
        <div className="glass-card rounded-3xl p-8 shadow-2xl border border-slate-800/80">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-100">Iniciar Sesión</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Estudiantes: ingresen con su código <span className="font-mono text-brand-400 font-semibold">N0 + 8 dígitos</span>
            </p>
          </div>

          {/* Alert Messages */}
          {errorMessage && (
            <div
              className={`p-4 rounded-xl mb-6 flex items-start gap-3 border ${
                isLockedAlert
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              {isLockedAlert ? (
                <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
              )}
              <div className="text-xs leading-relaxed">
                <span className="font-bold block mb-0.5">
                  {isLockedAlert ? 'Alerta de Seguridad (Bloqueo Temporal)' : 'Aviso de Acceso'}
                </span>
                {errorMessage}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Código Institucional
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                  placeholder="Ej: N00123456 o ADMIN-001"
                  className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono tracking-wide"
                />
                <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 hover:bg-brand-500 disabled:bg-brand-800 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-brand-500/25"
            >
              {isSubmitting ? 'Verificando credenciales...' : 'Ingresar a la Plataforma'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Selector Rápido de Prueba (Demo Helper) */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Accesos Rápidos de Prueba (Demo):
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => fillQuickCredentials('N001234567', 'Password123!')}
                className="text-left px-3 py-2 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition-colors flex items-center justify-between"
              >
                <span>👨‍🎓 <strong>Estudiante Activo:</strong> N001234567</span>
                <span className="text-[10px] text-brand-400">Rellenar</span>
              </button>
              <button
                type="button"
                onClick={() => fillQuickCredentials('ADMIN-001', 'Admin123!')}
                className="text-left px-3 py-2 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition-colors flex items-center justify-between"
              >
                <span>🛡️ <strong>Encargado de Lab:</strong> ADMIN-001</span>
                <span className="text-[10px] text-brand-400">Rellenar</span>
              </button>
              <button
                type="button"
                onClick={() => fillQuickCredentials('N001122334', 'Password123!')}
                className="text-left px-3 py-2 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition-colors flex items-center justify-between"
              >
                <span>⚠️ <strong>Estudiante Penalizado:</strong> N001122334</span>
                <span className="text-[10px] text-brand-400">Rellenar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
