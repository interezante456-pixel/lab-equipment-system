import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationDropdown } from './NotificationDropdown';

const { get, patch } = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn() }));
vi.mock('../services/api', () => ({ api: { get, patch } }));

describe('NotificationDropdown', () => {
  beforeEach(() => { vi.clearAllMocks(); get.mockResolvedValue({ data: [{ id: 'n1', title: 'Reserva aprobada', message: 'Lista para retiro', isRead: false, createdAt: '2026-01-01T10:00:00Z' }] }); });

  it('carga y marca como leídas las notificaciones sin solicitar backend real', async () => {
    render(<NotificationDropdown />);
    await waitFor(() => expect(get).toHaveBeenCalledWith('/notifications'));
    fireEvent.click(screen.getByRole('button'));
    expect(await screen.findByText('Reserva aprobada')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /marcar leídas/i }));
    await waitFor(() => expect(patch).toHaveBeenCalledWith('/notifications/read-all'));
    expect(screen.queryByText(/1 nuevas/i)).not.toBeInTheDocument();
  });
});
