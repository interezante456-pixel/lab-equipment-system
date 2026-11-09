import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User, Role, StudentStatus } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  KeyRound,
  Unlock,
  AlertTriangle,
  GraduationCap,
  Mail,
  CheckCircle2,
} from 'lucide-react';

export const UsersCRUD: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [resetPassUser, setResetPassUser] = useState<User | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form State Creación
  const [formData, setFormData] = useState({
    studentCode: '',
    fullName: '',
    email: '',
    career: 'Ingeniería de Sistemas Computacionales',
    password: 'Password123!',
    role: 'STUDENT' as Role,
    studentStatus: 'ACTIVE' as StudentStatus,
  });
  const [formError, setFormError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/users', { params });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, search]);

  const handleOpenCreate = () => {
    setFormData({
      studentCode: 'N0',
      fullName: '',
      email: '',
      career: 'Ingeniería de Sistemas Computacionales',
      password: 'Password123!',
      role: 'STUDENT',
      studentStatus: 'ACTIVE',
    });
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validación frontal del código si es estudiante: N0 + 8 dígitos
    if (formData.role === 'STUDENT') {
      const regex = /^N0\d{8}$/;
      if (!regex.test(formData.studentCode.trim().toUpperCase())) {
        setFormError('El código de estudiante debe iniciar obligatoriamente con N0 seguido de 8 dígitos (ej: N00123456)');
        return;
      }
    }

    try {
      await api.post('/users', formData);
      setIsCreateModalOpen(false);
      setActionSuccess(`Usuario ${formData.fullName} registrado correctamente.`);
      fetchUsers();
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Error al crear el usuario');
    }
  };

  // Desbloqueo de cuenta por 3 intentos fallidos
  const handleUnlockAccount = async (user: User) => {
    try {
      await api.patch(`/users/${user.id}/unlock`);
      setActionSuccess(`Cuenta de ${user.fullName} (${user.studentCode}) desbloqueada con éxito.`);
      fetchUsers();
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al desbloquear cuenta');
    }
  };

  // Reseteo de contraseña
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassUser || !newPasswordValue.trim()) return;

    try {
      await api.patch(`/users/${resetPassUser.id}`, { newPassword: newPasswordValue.trim() });
      setActionSuccess(`Contraseña de ${resetPassUser.fullName} restablecida con éxito.`);
      setResetPassUser(null);
      setNewPasswordValue('');
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al resetear contraseña');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-400" />
            Gestión de Usuarios y Accesos (CRUD)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registro de estudiantes (formato N0XXXXXXXX), administradores y desbloqueo de seguridad.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-brand-500/25 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Registrar Nuevo Usuario
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          {['ALL', 'STUDENT', 'ADMIN'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                roleFilter === r
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r === 'ALL' ? 'Todos' : r === 'STUDENT' ? 'Estudiantes' : 'Administradores'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código, nombre o correo..."
            className="w-full px-4 py-2 pl-9 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="glass-card rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Código / Nombre</th>
                <th className="px-5 py-3.5">Correo Institucional</th>
                <th className="px-5 py-3.5">Carrera</th>
                <th className="px-5 py-3.5">Rol</th>
                <th className="px-5 py-3.5">Estado / Seguridad</th>
                <th className="px-5 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    No se encontraron usuarios registrados.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isLocked = u.lockedUntil && new Date(u.lockedUntil).getTime() > Date.now();

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-100">{u.fullName}</div>
                        <span className="font-mono text-brand-300 font-semibold">{u.studentCode}</span>
                      </td>
                      <td className="px-5 py-4 text-slate-400 font-mono">
                        {u.email}
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        {u.career || 'Administración de Laboratorio'}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={u.studentStatus} />
                          {isLocked ? (
                            <span className="text-[10px] font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30 animate-pulse">
                              🔒 Bloqueado (3 fallos)
                            </span>
                          ) : (u.failedAttempts || 0) > 0 ? (
                            <span className="text-[10px] text-amber-400 font-medium">
                              ({u.failedAttempts} intento fallido)
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Desbloquear Cuenta si está bloqueada */}
                          {isLocked && (
                            <button
                              onClick={() => handleUnlockAccount(u)}
                              title="Desbloquear Cuenta Inmediatamente"
                              className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-rose-600/30 transition-all"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              Desbloquear
                            </button>
                          )}
                          {/* Resetear Clave */}
                          <button
                            onClick={() => {
                              setResetPassUser(u);
                              setNewPasswordValue('Password123!');
                            }}
                            title="Restablecer Contraseña"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                          >
                            <KeyRound className="w-4 h-4 text-brand-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrar Usuario */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Registrar Nuevo Usuario / Estudiante"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Rol del Usuario
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-brand-500"
              >
                <option value="STUDENT">Estudiante Universitario</option>
                <option value="ADMIN">Encargado de Laboratorio (Admin)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Código Institucional
              </label>
              <input
                type="text"
                required
                value={formData.studentCode}
                onChange={(e) => setFormData({ ...formData, studentCode: e.target.value.toUpperCase() })}
                placeholder={formData.role === 'STUDENT' ? 'N00123456 (N0+8 dígitos)' : 'ADMIN-002'}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nombre Completo
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Ej: Daniel Alejandro Vargas Quispe"
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Correo Institucional
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
              placeholder="alumno@universidad.edu.pe"
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs font-mono"
            />
          </div>

          {formData.role === 'STUDENT' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Carrera / Escuela Profesional
              </label>
              <input
                type="text"
                value={formData.career}
                onChange={(e) => setFormData({ ...formData, career: e.target.value })}
                placeholder="Ingeniería de Sistemas, Electrónica, etc."
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Contraseña Temporal
            </label>
            <input
              type="text"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs font-mono"
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
              Registrar Usuario
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Resetear Contraseña */}
      <Modal
        isOpen={!!resetPassUser}
        onClose={() => setResetPassUser(null)}
        title="Restablecer Contraseña de Acceso"
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-xs text-slate-300">
            Ingresa la nueva contraseña temporal para{' '}
            <strong className="text-slate-100">{resetPassUser?.fullName}</strong> ({resetPassUser?.studentCode}):
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nueva Contraseña
            </label>
            <input
              type="text"
              required
              value={newPasswordValue}
              onChange={(e) => setNewPasswordValue(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setResetPassUser(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-brand-500/20"
            >
              Guardar Contraseña
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
