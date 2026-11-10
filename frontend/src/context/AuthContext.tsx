import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (studentCode: string, password: string) => Promise<User>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeUser(value: unknown): User | null {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.studentCode !== 'string' ||
    typeof candidate.fullName !== 'string' ||
    typeof candidate.email !== 'string' ||
    (candidate.role !== 'STUDENT' && candidate.role !== 'ADMIN') ||
    (candidate.studentStatus !== 'ACTIVE' && candidate.studentStatus !== 'PENALIZED')
  ) {
    return null;
  }

  return {
    id: candidate.id,
    studentCode: candidate.studentCode,
    fullName: candidate.fullName,
    email: candidate.email,
    role: candidate.role,
    studentStatus: candidate.studentStatus,
    ...(typeof candidate.career === 'string' && { career: candidate.career }),
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('lab_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('lab_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/profile');
          const profile = normalizeUser(res.data);
          if (!profile) throw new Error('El perfil recibido no tiene el formato esperado.');
          setUser(profile);
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };

    void initAuth();
  }, []);

  const login = async (studentCode: string, password: string): Promise<User> => {
    const response = await api.post('/auth/login', { studentCode, password });
    const { access_token, user: rawUser } = response.data;
    const loggedUser = normalizeUser(rawUser);
    if (typeof access_token !== 'string' || !loggedUser) {
      throw new Error('La respuesta de autenticación no tiene el formato esperado.');
    }

    localStorage.setItem('lab_token', access_token);

    setToken(access_token);
    setUser(loggedUser);
    return loggedUser;
  };

  const logout = () => {
    localStorage.removeItem('lab_token');
    localStorage.removeItem('lab_user');
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      const profile = normalizeUser(res.data);
      if (!profile) throw new Error('El perfil recibido no tiene el formato esperado.');
      setUser(profile);
    } catch (e) {
      console.error('Error al actualizar perfil:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
