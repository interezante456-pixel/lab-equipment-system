import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Catalog } from './Catalog';

const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('../../services/api', () => ({ api: { get, post } }));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { studentStatus: 'ACTIVE' } }) }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

const equipment = { id: 'e1', inventoryCode: 'LAB-01', name: 'Osciloscopio', category: 'ELECTRONICA', brand: 'Tek', model: 'T1', location: 'Lab A', status: 'DISPONIBLE' };

describe('Catalog', () => {
  beforeEach(() => { vi.clearAllMocks(); get.mockResolvedValue({ data: { items: [equipment] } }); });

  it('consulta el catálogo con el filtro de categoría seleccionado', async () => {
    render(<Catalog />);
    await screen.findByText('Osciloscopio');
    fireEvent.click(screen.getByRole('button', { name: /electrónica/i }));
    await waitFor(() => expect(get).toHaveBeenLastCalledWith('/equipment', { params: { category: 'ELECTRONICA' } }));
  });

  it('envía una solicitud de reserva con el rango horario elegido', async () => {
    post.mockResolvedValue({ data: {} });
    render(<Catalog />);
    await screen.findByText('Osciloscopio');
    fireEvent.click(screen.getByRole('button', { name: /solicitar reserva/i }));
    fireEvent.change(screen.getByLabelText(/hora de inicio/i), { target: { value: '10:00' } });
    fireEvent.change(screen.getByLabelText(/hora de fin/i), { target: { value: '12:00' } });
    fireEvent.click(screen.getByRole('button', { name: /confirmar solicitud/i }));
    await waitFor(() => expect(post).toHaveBeenCalledWith('/reservations', expect.objectContaining({ equipmentId: 'e1', startTime: expect.stringMatching(/T10:00:00$/), endTime: expect.stringMatching(/T12:00:00$/) })));
    expect(await screen.findByText(/solicitud enviada/i)).toBeInTheDocument();
  });
});
