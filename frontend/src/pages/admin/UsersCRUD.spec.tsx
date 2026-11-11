import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersCRUD } from './UsersCRUD';

const { get, post, patch } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn() }));
vi.mock('../../services/api', () => ({ api: { get, post, patch } }));

const lockedUser = {
  id: 'u1', studentCode: 'N001234567', fullName: 'Ada Lovelace', email: 'ada@labhub.edu',
  career: 'Sistemas', role: 'STUDENT', studentStatus: 'ACTIVE', failedAttempts: 3,
  lockedUntil: '2099-01-01T00:00:00.000Z',
};

describe('UsersCRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    get.mockResolvedValue({ data: [lockedUser] });
    post.mockResolvedValue({ data: {} });
    patch.mockResolvedValue({ data: {} });
  });

  it('rechaza el código estudiantil que no cumple el límite N0 más ocho dígitos', async () => {
    render(<UsersCRUD />);
    await screen.findByText('Ada Lovelace');
    fireEvent.click(screen.getByRole('button', { name: /registrar nuevo usuario/i }));
    expect(screen.getByLabelText(/carrera/i)).toBeInTheDocument();
    fireEvent.submit(screen.getByRole('button', { name: /registrar usuario/i }).closest('form')!);
    expect(await screen.findByText(/n0 seguido de 8 dígitos/i)).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it('registra un administrador sin exigir carrera', async () => {
    render(<UsersCRUD />);
    await screen.findByText('Ada Lovelace');
    fireEvent.click(screen.getByRole('button', { name: /registrar nuevo usuario/i }));
    fireEvent.change(screen.getByLabelText(/rol del usuario/i), { target: { value: 'ADMIN' } });
    fireEvent.change(screen.getByLabelText(/código institucional/i), { target: { value: 'admin-002' } });
    fireEvent.change(screen.getByLabelText(/nombre completo/i), { target: { value: 'Grace Hopper' } });
    fireEvent.change(screen.getByLabelText(/correo institucional/i), { target: { value: 'GRACE@LABHUB.EDU' } });
    expect(screen.queryByLabelText(/carrera/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /registrar usuario/i }));
    await waitFor(() => expect(post).toHaveBeenCalledWith('/users', expect.objectContaining({
      role: 'ADMIN', studentCode: 'ADMIN-002', fullName: 'Grace Hopper', email: 'grace@labhub.edu',
    })));
  });

  it('desbloquea la cuenta y permite abrir el reseteo de contraseña', async () => {
    render(<UsersCRUD />);
    await screen.findByText('Ada Lovelace');
    fireEvent.click(screen.getByRole('button', { name: /desbloquear/i }));
    await waitFor(() => expect(patch).toHaveBeenCalledWith('/users/u1/unlock'));
    fireEvent.click(screen.getByTitle(/restablecer contraseña/i));
    expect(screen.getByLabelText(/nueva contraseña/i)).toHaveValue('Password123!');
  });
});
