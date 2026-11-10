import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('../services/api', () => ({ api: { get, post } }));

const Consumer = () => {
  const { user, isLoading, login } = useAuth();
  return <><span>{isLoading ? 'loading' : user?.fullName || 'anonymous'}</span><button onClick={() => login('N001234567', 'clave')}>login</button></>;
};

describe('AuthProvider', () => {
  beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });

  it('restaura el perfil remoto cuando existe un token almacenado', async () => {
    localStorage.setItem('lab_token', 'test-token');
    get.mockResolvedValue({ data: { id: 'u1', studentCode: 'N001234567', fullName: 'Ada', email: 'ada@labhub.edu', role: 'STUDENT', studentStatus: 'ACTIVE' } });
    render(<AuthProvider><Consumer /></AuthProvider>);
    expect(await screen.findByText('Ada')).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith('/auth/profile');
  });

  it('persiste token y usuario después de un login exitoso', async () => {
    post.mockResolvedValue({ data: { access_token: 'token-prueba', user: { id: 'u1', studentCode: 'N001234567', fullName: 'Ana', email: 'ana@labhub.edu', role: 'STUDENT', studentStatus: 'ACTIVE' } } });
    render(<AuthProvider><Consumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByText('anonymous')).toBeInTheDocument());
    screen.getByRole('button', { name: 'login' }).click();
    expect(await screen.findByText('Ana')).toBeInTheDocument();
    expect(localStorage.getItem('lab_token')).toBe('token-prueba');
  });
});
