import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Camera, QrCode, Search, CheckCircle } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedText: string) => void;
  title?: string;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Escanear Código QR (Carnet o Equipo)',
}) => {
  const [manualCode, setManualCode] = useState('');
  const [useCamera, setUseCamera] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);

  useEffect(() => {
    let html5QrCode: any = null;

    if (isOpen && useCamera) {
      import('html5-qrcode')
        .then(({ Html5Qrcode }) => {
          html5QrCode = new Html5Qrcode('qr-reader-target');
          html5QrCode
            .start(
              { facingMode: 'environment' },
              { fps: 10, qrbox: { width: 250, height: 250 } },
              (decodedText: string) => {
                html5QrCode.stop().then(() => {
                  onScanSuccess(decodedText);
                  onClose();
                });
              },
              () => {},
            )
            .catch((err: any) => {
              setScannerError('No se pudo acceder a la cámara. Usa el ingreso manual.');
              setUseCamera(false);
            });
        })
        .catch(() => {
          setScannerError('Librería de escaneo no disponible.');
        });
    }

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(() => {});
      }
    };
  }, [isOpen, useCamera, onScanSuccess, onClose]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScanSuccess(manualCode.trim());
      setManualCode('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex flex-col gap-4">
        {/* Toggle Cámara vs Manual */}
        <div className="flex rounded-xl bg-slate-800 p-1">
          <button
            type="button"
            onClick={() => setUseCamera(false)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
              !useCamera ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            Ingreso / Pistola Láser
          </button>
          <button
            type="button"
            onClick={() => setUseCamera(true)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
              useCamera ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            Cámara Web
          </button>
        </div>

        {useCamera ? (
          <div>
            <div id="qr-reader-target" className="w-full h-64 bg-slate-950 rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center text-slate-500 text-xs">
              Iniciando sensor de cámara...
            </div>
            {scannerError && (
              <p className="text-xs text-rose-400 mt-2 text-center">{scannerError}</p>
            )}
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label htmlFor="manual-qr-code" className="block text-xs font-medium text-slate-300 mb-1.5">
                Código de Estudiante (N0XXXXXXXX) o Código de Equipo (LAB-XXX)
              </label>
              <div className="relative">
                <input
                  id="manual-qr-code"
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="Ej: N00123456 o LAB-COMP-001"
                  className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent font-mono"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                💡 Consejo: Si cuentas con lector de código de barras USB/Bluetooth, enfoca este campo y presiona el gatillo.
              </p>
            </div>

            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-brand-500/20"
            >
              <CheckCircle className="w-4 h-4" />
              Procesar Código
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
};
