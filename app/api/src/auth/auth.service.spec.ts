import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { createPrismaMock } from '../../test/prisma-mock.js';
import { AuthService } from './auth.service.js';

describe('AuthService.login', () => {
  it('signs only the user identity, leaving tenant roles to database checks', async () => {
    const prisma = createPrismaMock();
    const passwordHash = await bcrypt.hash('123456', 4);
    prisma.user.findUnique.mockResolvedValue({
      id: '33333333-3333-4333-8333-333333333333',
      passwordHash,
    });
    const signAsync = vi.fn().mockResolvedValue('token');
    const auth = new AuthService(prisma, {
      signAsync,
    } as unknown as JwtService);

    await expect(
      auth.login({ username: 'alice', password: '123456' }),
    ).resolves.toEqual({ accessToken: 'token' });
    expect(prisma.user.findUnique.mock.calls[0][0]).toEqual({
      where: { username: 'alice' },
      select: { id: true, passwordHash: true },
    });
    expect(signAsync).toHaveBeenCalledWith({
      sub: '33333333-3333-4333-8333-333333333333',
    });
  });
});
