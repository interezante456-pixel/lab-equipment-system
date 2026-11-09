import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Equipment, EquipmentCategory, EquipmentStatus } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { QRViewerModal } from '../../components/QRViewerModal';
import {
  Box,
  Plus,
  Search,
  QrCode,
  Edit,
  Trash2,
  Wrench,
  CheckCircle2,
  MapPin,
  Tag,
} from 'lucide-react';

export const EquipmentCRUD: React.FC = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [qrModalData, setQrModalData] = useState<{ isOpen: boolean; dataUrl: string; code: string; name: string }>({
    isOpen: false,
    dataUrl: '',
    code: '',
    name: '',
  });

  // Form State
  const [formData, setFormData] = useState({
    inventoryCode: '',
    name: '',
    category: 'COMPUTO' as EquipmentCategory,
    brand: '',
    model: '',
    serialNumber: '',
    location: '',
    specifications: '',
    imageUrl: '',
    status: 'DISPONIBLE' as EquipmentStatus,
  });

  const fetchEquipments = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/equipment', { params });
      setEquipments(res.data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipments();
  }, [categoryFilter, search]);

  const handleOpenCreate = () => {
    setFormData({
      inventoryCode: '',
      name: '',
      category: 'COMPUTO',
      brand: '',
      model: '',
      serialNumber: '',
      location: '',
      specifications: '',
      imageUrl: '',
      status: 'DISPONIBLE',
    });
    setEditingEquipment(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (eq: Equipment) => {
    setEditingEquipment(eq);
    setFormData({
      inventoryCode: eq.inventoryCode,
      name: eq.name,
      category: eq.category,
      brand: eq.brand,
      model: eq.model,
      serialNumber: eq.serialNumber || '',
      location: eq.location,
      specifications: eq.specifications || '',
      imageUrl: eq.imageUrl || '',
      status: eq.status,
    });
    setIsCreateModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEquipment) {
        await api.patch(`/equipment/${editingEquipment.id}`, formData);
      } else {
        await api.post('/equipment', formData);
      }
      setIsCreateModalOpen(false);
      fetchEquipments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al guardar el equipo');
    }
  };

  const handleShowQR = async (eq: Equipment) => {
    try {
      const res = await api.get(`/equipment/${eq.id}/qr`);
      setQrModalData({
        isOpen: true,
        dataUrl: res.data.qrDataUrl,
        code: res.data.inventoryCode,
        name: res.data.name,
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al generar el QR');
    }
  };

  const handleToggleMaintenance = async (eq: Equipment) => {
    const nextStatus: EquipmentStatus =
      eq.status === 'MANTENIMIENTO' ? 'DISPONIBLE' : 'MANTENIMIENTO';
    try {
      await api.patch(`/equipment/${eq.id}`, { status: nextStatus });
      fetchEquipments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al cambiar estado');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Box className="w-6 h-6 text-brand-400" />
            Inventario de Equipos (CRUD)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Alta, edición, baja técnica y generación de códigos QR para el inventario del laboratorio.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-brand-500/25 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Registrar Nuevo Equipo
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          {['ALL', 'COMPUTO', 'ELECTRONICA', 'REDES'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                categoryFilter === cat
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'Todos' : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código o nombre..."
            className="w-full px-4 py-2 pl-9 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Tabla de Equipos */}
      <div className="glass-card rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Código / Equipo</th>
                <th className="px-5 py-3.5">Categoría</th>
                <th className="px-5 py-3.5">Marca / Serie</th>
                <th className="px-5 py-3.5">Ubicación</th>
                <th className="px-5 py-3.5">Estado</th>
                <th className="px-5 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    Cargando equipos...
                  </td>
                </tr>
              ) : equipments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    No se encontraron equipos registrados.
                  </td>
                </tr>
              ) : (
                equipments.map((eq) => (
                  <tr key={eq.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-100">{eq.name}</div>
                      <span className="font-mono text-brand-300 font-semibold">{eq.inventoryCode}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium text-[11px]">
                        {eq.category}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div>{eq.brand} - {eq.model}</div>
                      <span className="text-[11px] text-slate-500 font-mono">SN: {eq.serialNumber || 'N/A'}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        {eq.location}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={eq.status} />
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Generar QR */}
                        <button
                          onClick={() => handleShowQR(eq)}
                          title="Ver y Descargar Código QR"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-brand-400 border border-slate-700 transition-colors"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        {/* Mantenimiento */}
                        <button
                          onClick={() => handleToggleMaintenance(eq)}
                          title={eq.status === 'MANTENIMIENTO' ? 'Quitar de Mantenimiento' : 'Poner en Mantenimiento'}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            eq.status === 'MANTENIMIENTO'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20'
                          }`}
                        >
                          <Wrench className="w-4 h-4" />
                        </button>
                        {/* Editar */}
                        <button
                          onClick={() => handleOpenEdit(eq)}
                          title="Editar Equipo"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar Equipo */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingEquipment ? 'Editar Información de Equipo' : 'Registrar Nuevo Equipo en Inventario'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Código de Inventario (Único)
              </label>
              <input
                type="text"
                required
                disabled={!!editingEquipment}
                value={formData.inventoryCode}
                onChange={(e) => setFormData({ ...formData, inventoryCode: e.target.value.toUpperCase() })}
                placeholder="Ej: LAB-COMP-005"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Categoría Oficial
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as EquipmentCategory })}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-brand-500"
              >
                <option value="COMPUTO">Cómputo</option>
                <option value="ELECTRONICA">Electrónica</option>
                <option value="REDES">Redes y Telecomunicaciones</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nombre Descriptivo del Equipo
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Multímetro Digital de Banco Fluke 8846A"
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Marca</label>
              <input
                type="text"
                required
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Fluke, Dell, Cisco..."
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Modelo</label>
              <input
                type="text"
                required
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="8846A"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Número de Serie</label>
              <input
                type="text"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                placeholder="SN-123456"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Ubicación Física en Laboratorio
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ej: Mesa 03 - Laboratorio B"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                URL de Imagen / Fotografía
              </label>
              <input
                type="text"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Especificaciones Técnicas Detalladas
            </label>
            <textarea
              rows={2}
              value={formData.specifications}
              onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
              placeholder="Voltaje, resolución, procesador, puertos..."
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-brand-500/20"
            >
              {editingEquipment ? 'Actualizar Equipo' : 'Guardar y Generar QR'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Visor de QR */}
      <QRViewerModal
        isOpen={qrModalData.isOpen}
        onClose={() => setQrModalData({ ...qrModalData, isOpen: false })}
        title="Código QR Oficial del Equipo"
        qrDataUrl={qrModalData.dataUrl}
        inventoryCode={qrModalData.code}
        equipmentName={qrModalData.name}
      />
    </div>
  );
};
