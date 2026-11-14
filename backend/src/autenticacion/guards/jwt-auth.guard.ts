// backend/src/autenticacion/guards/jwt-auth.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // 👇 Extraemos el token priorizando el Header Authorization (Bearer), con respaldo en cookies
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('No token found in request headers or cookies');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'clave-secreta-super-segura-recetas',
      });
      (request as any).user = payload; // Adjunta los datos del usuario al request
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return true;
  }

  private extractToken(request: Request): string | null {
    // 1. Intentar extraer del Header Authorization: Bearer <token>
    const authHeader = request.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }

    // 2. Respaldo: Extraer de las cookies si estuvieran disponibles
    if (request.cookies?.token) {
      return request.cookies.token;
    }

    return null;
  }
}