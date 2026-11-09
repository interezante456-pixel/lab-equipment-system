import React from 'react';
import { Modal } from './Modal';
import { Download, Printer, QrCode } from 'lucide-react';

interface QRViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  qrDataUrl: string;
  inventoryCode: string;
  equipmentName: string;
}

export const QRViewerModal: React.FC<QRViewerModalProps> = ({
  isOpen,
  onClose,
  title,
  qrDataUrl,
  inventoryCode,
  equipmentName,
}) => {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Etiqueta QR - ${inventoryCode}</title>
            <style>
              body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .card { border: 2px dashed #333; padding: 20px; text-align: center; border-radius: 12px; width: 280px; }
              h2 { margin: 0 0 8px 0; font-size: 18px; }
              p { margin: 4px 0; font-size: 14px; color: #555; }
              img { width: 200px; height: 200px; margin: 10px 0; }
            </style>
          </head>
          <body>
            <div class="card">
              <h2>LABORATORIO UNIVERSITARIO</h2>
              <img src="${qrDataUrl}" />
              <p><strong>${inventoryCode}</strong></p>
              <p>${equipmentName}</p>
            </div>
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR_${inventoryCode}.png`;
    link.click();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center">
        <div className="p-4 bg-white rounded-2xl shadow-inner mb-4">
          <img src={qrDataUrl} alt={`QR ${inventoryCode}`} className="w-56 h-56 object-contain" />
        </div>

        <span className="font-mono text-sm px-3 py-1 bg-slate-800 text-brand-400 rounded-lg font-bold">
          {inventoryCode}
        </span>
        <h4 className="font-semibold text-slate-200 mt-2">{equipmentName}</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Etiqueta de inventario oficial para escaneo de entrega y devolución física.
        </p>

        <div className="grid grid-cols-2 gap-3 w-full mt-6">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium text-sm transition-colors border border-slate-700"
          >
            <Printer className="w-4 h-4 text-brand-400" />
            Imprimir
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-medium text-sm transition-colors shadow-lg shadow-brand-500/20"
          >
            <Download className="w-4 h-4" />
            Descargar
          </button>
        </div>
      </div>
    </Modal>
  );
};
