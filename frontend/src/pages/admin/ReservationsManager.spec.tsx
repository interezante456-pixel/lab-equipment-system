import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReservationsManager } from './ReservationsManager';

const { get, patch } = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn() }));
vi.mock('../../services/api', () => ({ api: { get, patch } }));

const reservation = {
  id: 'r1', userId: 'u1', equipmentId: 'e1', startTime: '2030-01-01T10:00:00Z',
  endTime: '2030-01-01T12:00:00Z', status: 'PENDIENTE', createdAt: '2029-12-01T00:00:00Z',
  notes: null,
  user: { id: 'u1', studentCode: 'N001234567', fullName: 'Ada', email: 'ada@labhub.edu', career: 'Sistemas', role: 'STUDENT', studentStatus: 'ACTIVE' },
  equipment: { id: 'e1', inventoryCode: 'LAB-01', name: 'Osciloscopio', category: 'ELECTRONICA', brand: 'Tek', model: 'T1', location: 'Lab A', status: 'DISPONIBLE' },
};

describe('ReservationsManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    get.mockResolvedValue({ data: [reservation] });
    patch.mockResolvedValue({ data: {} });
  });

  it('aprueba una solicitud pendiente y actualiza la bandeja', async () => {
    render(<ReservationsManager />);
    await screen.findByText('Osciloscopio');
    fireEvent.click(screen.getByRole('button', { name: /aprobar/i }));
    await waitFor(() => expect(patch).toHaveBeenCalledWith('/reservations/r1/approve'));
    expect(await screen.findByText(/aprobada exitosamente/i)).toBeInTheDocument();
  });

  it('exige un motivo y envía el rechazo normalizado', async () => {
    render(<ReservationsManager />);
    await screen.findByText('Osciloscopio');
    fireEvent.click(screen.getByRole('button', { name: /rechazar/i }));
    const confirm = screen.getByRole('button', { name: /confirmar rechazo/i });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/motivo del rechazo/i), { target: { value: '  Equipo reservado para mantenimiento  ' } });
    fireEvent.click(confirm);
    await waitFor(() => expect(patch).toHaveBeenCalledWith('/reservations/r1/reject', {
      reason: 'Equipo reservado para mantenimiento',
    }));
  });

  it('muestra el error recibido al aprobar', async () => {
    patch.mockRejectedValue({ response: { data: { message: 'Horario ocupado' } } });
    render(<ReservationsManager />);
    await screen.findByText('Osciloscopio');
    fireEvent.click(screen.getByRole('button', { name: /aprobar/i }));
    expect(await screen.findByText('Horario ocupado')).toBeInTheDocument();
  });
});
