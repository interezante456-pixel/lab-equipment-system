import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { RolesGuard } from '../src/common/guards/roles.guard';

const contextFor = (user: any) => ({ getHandler: () => 'handler', getClass: () => 'class', switchToHttp: () => ({ getRequest: () => ({ user }) }) }) as any;

describe('RolesGuard', () => {
  it('permite una ruta sin roles requeridos', () => {
    const guard = new RolesGuard({ getAllAndOverride: vi.fn().mockReturnValue(undefined) } as any);
    expect(guard.canActivate(contextFor(null))).toBe(true);
  });

  it('rechaza una petición sin rol cuando la ruta exige ADMIN', () => {
    const guard = new RolesGuard({ getAllAndOverride: vi.fn().mockReturnValue(['ADMIN']) } as any);
    expect(() => guard.canActivate(contextFor({}))).toThrow(ForbiddenException);
  });

  it('permite al administrador en una ruta administrativa', () => {
    const guard = new RolesGuard({ getAllAndOverride: vi.fn().mockReturnValue(['ADMIN']) } as any);
    expect(guard.canActivate(contextFor({ role: 'ADMIN' }))).toBe(true);
  });
});
