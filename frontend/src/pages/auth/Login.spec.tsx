import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Login } from './Login';

const { login, navigate } = vi.hoisted(() => ({ login: vi.fn(), navigate: vi.fn() }));

vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ login }) }));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderLogin = () => render(<MemoryRouter><Login /></MemoryRouter>);

  it('muestra una validación si faltan credenciales', () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /ingresar a la plataforma/i }));
    expect(screen.getByText(/por favor ingrese su/i)).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('envía credenciales y redirige a catálogo para un estudiante', async () => {
    login.mockResolvedValue({ role: 'STUDENT' });
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText(/n00123456/i), { target: { value: 'n001234567' } });
    fireEvent.change(screen.getByPlaceholderText(/•••/i), { target: { value: 'clave-prueba' } });
    fireEvent.click(screen.getByRole('button', { name: /ingresar a la plataforma/i }));
    await waitFor(() => expect(login).toHaveBeenCalledWith('N001234567', 'clave-prueba'));
    expect(navigate).toHaveBeenCalledWith('/catalog');
  });

  it('muestra alerta de bloqueo recibida desde el servicio de autenticación', async () => {
    login.mockRejectedValue({ response: { data: { message: 'Cuenta bloqueada tras 3 intentos' } } });
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText(/n00123456/i), { target: { value: 'N001234567' } });
    fireEvent.change(screen.getByPlaceholderText(/•••/i), { target: { value: 'clave' } });
    fireEvent.click(screen.getByRole('button', { name: /ingresar a la plataforma/i }));
    expect(await screen.findByText(/alerta de seguridad/i)).toBeInTheDocument();
    expect(screen.getByText(/cuenta bloqueada/i)).toBeInTheDocument();
  });
});
