import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/auth/Login';
import { Catalog } from './pages/student/Catalog';
import { MyReservations } from './pages/student/MyReservations';
import { StudentIDCard } from './pages/student/StudentIDCard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ReservationsManager } from './pages/admin/ReservationsManager';
import { DispatchReturns } from './pages/admin/DispatchReturns';
import { EquipmentCRUD } from './pages/admin/EquipmentCRUD';
import { UsersCRUD } from './pages/admin/UsersCRUD';
import { PenaltiesManager } from './pages/admin/PenaltiesManager';
import { Role } from './types';

// Guard de Rutas Protegidas
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-brand-400">
        <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/catalog'} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Ruta Pública: Login */}
      <Route path="/login" element={<Login />} />

      {/* Rutas de Estudiante */}
      <Route
        path="/catalog"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <Catalog />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-reservations"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <MyReservations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/id-card"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentIDCard />
          </ProtectedRoute>
        }
      />

      {/* Rutas de Administrador */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reservations"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <ReservationsManager />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dispatch"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DispatchReturns />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/equipment"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <EquipmentCRUD />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <UsersCRUD />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/penalties"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <PenaltiesManager />
          </ProtectedRoute>
        }
      />

      {/* Ruta Raíz por Defecto */}
      <Route
        path="*"
        element={
          <Navigate
            to={user ? (user.role === 'ADMIN' ? '/admin/dashboard' : '/catalog') : '/login'}
            replace
          />
        }
      />
    </Routes>
  );
};

