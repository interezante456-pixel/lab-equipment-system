import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StudentIDCard } from './StudentIDCard';

const { toDataURL, useAuth } = vi.hoisted(() => ({ toDataURL: vi.fn(), useAuth: vi.fn() }));
vi.mock('qrcode', () => ({ default: { toDataURL } }));
vi.mock('../../context/AuthContext', () => ({ useAuth }));

const user = {
  id: 'u1', studentCode: 'N001234567', fullName: 'Ada Lovelace', email: 'ada@labhub.edu',
  career: 'Sistemas', role: 'STUDENT', studentStatus: 'ACTIVE',
};

describe('StudentIDCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user });
  });

  it('genera el QR con la identidad del estudiante', async () => {
    toDataURL.mockResolvedValue('data:image/png;base64,qr');
    render(<StudentIDCard />);
    const image = await screen.findByRole('img', { name: /carnet qr/i });
    expect(image).toHaveAttribute('src', 'data:image/png;base64,qr');
    expect(toDataURL).toHaveBeenCalledWith(expect.stringContaining('N001234567'), expect.objectContaining({ width: 280 }));
  });

  it('gestiona el rechazo del generador QR sin dejar una promesa sin controlar', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    toDataURL.mockRejectedValue(new Error('QR no disponible'));
    render(<StudentIDCard />);
    await waitFor(() => expect(errorSpy).toHaveBeenCalledWith(
      'No se pudo generar el código QR del estudiante', expect.any(Error),
    ));
    expect(screen.queryByRole('img', { name: /carnet qr/i })).not.toBeInTheDocument();
    errorSpy.mockRestore();
  });

  it('no intenta generar QR cuando no existe código estudiantil', () => {
    useAuth.mockReturnValue({ user: null });
    render(<StudentIDCard />);
    expect(toDataURL).not.toHaveBeenCalled();
  });
});
