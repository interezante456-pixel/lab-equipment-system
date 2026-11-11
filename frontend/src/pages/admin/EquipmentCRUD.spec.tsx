import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EquipmentCRUD } from './EquipmentCRUD';

const { get, post, patch } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn() }));
vi.mock('../../services/api', () => ({ api: { get, post, patch } }));

const equipment = {
  id: 'eq-1', inventoryCode: 'LAB-01', name: 'Osciloscopio', category: 'ELECTRONICA',
  brand: 'Tektronix', model: 'TBS', serialNumber: 'SN-1', location: 'Lab A', status: 'DISPONIBLE',
};

describe('EquipmentCRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    get.mockResolvedValue({ data: { items: [equipment] } });
    post.mockResolvedValue({ data: {} });
    patch.mockResolvedValue({ data: {} });
  });

  it('carga el inventario y aplica el filtro de categoría', async () => {
    render(<EquipmentCRUD />);
    expect(await screen.findByText('Osciloscopio')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'REDES' }));
    await waitFor(() => expect(get).toHaveBeenLastCalledWith('/equipment', { params: { category: 'REDES' } }));
  });

  it('registra un equipo mediante controles asociados a sus etiquetas', async () => {
    render(<EquipmentCRUD />);
    await screen.findByText('Osciloscopio');
    fireEvent.click(screen.getByRole('button', { name: /registrar nuevo equipo/i }));

    fireEvent.change(screen.getByLabelText(/código de inventario/i), { target: { value: 'lab-02' } });
    fireEvent.change(screen.getByLabelText(/nombre descriptivo/i), { target: { value: 'Multímetro' } });
    fireEvent.change(screen.getByLabelText('Marca'), { target: { value: 'Fluke' } });
    fireEvent.change(screen.getByLabelText('Modelo'), { target: { value: '87V' } });
    fireEvent.change(screen.getByLabelText(/número de serie/i), { target: { value: 'SN-2' } });
    fireEvent.change(screen.getByLabelText(/ubicación física/i), { target: { value: 'Lab B' } });
    fireEvent.change(screen.getByLabelText(/url de imagen/i), { target: { value: 'https://example.test/equipo.png' } });
    fireEvent.change(screen.getByLabelText(/especificaciones técnicas/i), { target: { value: 'CAT III' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar y generar qr/i }));

    await waitFor(() => expect(post).toHaveBeenCalledWith('/equipment', expect.objectContaining({
      inventoryCode: 'LAB-02', name: 'Multímetro', brand: 'Fluke', model: '87V', location: 'Lab B',
    })));
  });

  it('informa el error devuelto al guardar un equipo', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    post.mockRejectedValue({ response: { data: { message: 'Código duplicado' } } });
    render(<EquipmentCRUD />);
    await screen.findByText('Osciloscopio');
    fireEvent.click(screen.getByRole('button', { name: /registrar nuevo equipo/i }));
    const submit = screen.getByRole('button', { name: /guardar y generar qr/i });
    fireEvent.submit(submit.closest('form')!);
    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Código duplicado'));
    alertSpy.mockRestore();
  });
});
