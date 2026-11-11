import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/StatusBadge';
import QRCode from 'qrcode';
import { QrCode, User, GraduationCap, ShieldCheck, AlertTriangle } from 'lucide-react';

export const StudentIDCard: React.FC = () => {
  const { user } = useAuth();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (user?.studentCode) {
      void QRCode.toDataURL(
        JSON.stringify({
          code: user.studentCode,
          name: user.fullName,
          status: user.studentStatus,
          timestamp: Date.now(),
        }),
        { width: 280, margin: 2, color: { dark: '#0F172A', light: '#FFFFFF' } },
      )
        .then(setQrDataUrl)
        .catch((error) => {
          console.error('No se pudo generar el código QR del estudiante', error);
          setQrDataUrl('');
        });
    }
  }, [user]);

  const isPenalized = user?.studentStatus === 'PENALIZED';

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
          <QrCode className="w-6 h-6 text-brand-400" />
          Mi Carnet Digital de Préstamos
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Presenta este código QR en la ventanilla del laboratorio para retiro y devolución ágil de equipos.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center pt-4">
        {/* Credencial Digital Card */}
        <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-slate-700/80 bg-gradient-to-b from-slate-900 to-slate-950 relative">
          {/* Header del carnet */}
          <div className="bg-gradient-to-r from-brand-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-200">
                Universidad Nacional
              </p>
              <h3 className="font-extrabold text-sm tracking-tight">Laboratorio Integrado</h3>
            </div>
            <ShieldCheck className="w-6 h-6 text-indigo-200" />
          </div>

          <div className="p-6 flex flex-col items-center text-center">
            {/* QR Code */}
            <div className="p-3 bg-white rounded-2xl shadow-xl mb-4">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Carnet QR" className="w-48 h-48 object-contain" />
              ) : (
                <div className="w-48 h-48 bg-slate-100 animate-pulse rounded-lg" />
              )}
            </div>

            {/* Código en grande */}
            <span className="font-mono text-base font-extrabold px-4 py-1.5 bg-slate-800 text-brand-400 rounded-xl border border-slate-700">
              {user?.studentCode}
            </span>

            {/* Nombre y Carrera */}
            <h2 className="text-base font-bold text-slate-100 mt-3">{user?.fullName}</h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
              <GraduationCap className="w-3.5 h-3.5 text-brand-400" />
              <span>{user?.career || 'Ingeniería de Sistemas'}</span>
            </div>

            {/* Estado de Habilitación */}
            <div className="mt-4">
              <StatusBadge status={user?.studentStatus || 'ACTIVE'} />
            </div>

            {isPenalized && (
              <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-[11px] flex items-start gap-2 text-left">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  Sanción activa por devolución fuera de hora. Acércate a administración con el encargado de laboratorio para regularizar tu situación.
                </span>
              </div>
            )}
          </div>

          <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800/80 text-[10px] text-slate-500 text-center font-mono">
            Válido para ciclo académico en curso • Intransferible
          </div>
        </div>
      </div>
    </div>
  );
};
