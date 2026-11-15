// backend/src/autenticacion/guards/jwt-auth.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('No token found in request headers or cookies');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'clave_secreta_para_jwt_2026',
      });
      (request as any).user = payload;
    } catch (error: any) {
      // 👇 IMPRIME EL ERROR REAL EN LA TERMINAL DE NESTJS
      console.error('❌ Error al verificar el token en el Guard:', error.message);
      throw new UnauthorizedException('Invalid or expired token');
    }
    return true;
  }

  private extractToken(request: Request): string | null {
    try {
      // 1. Extraer de las cabeceras asegurando compatibilidad con minúsculas/mayúsculas
      const headers = request.headers || {};
      const authHeader = headers['authorization'] || headers['Authorization'];

      if (authHeader && typeof authHeader === 'string') {
        const [type, token] = authHeader.split(' ');
        if (type === 'Bearer' && token) {
          return token.trim();
        }
      }

      // 2. Respaldo por cookies si estuvieran presentes
      if (request.cookies && request.cookies.token) {
        return request.cookies.token;
      }
    } catch (e) {
      // Si ocurre cualquier error al leer headers/cookies, retornamos null
      return null;
    }

    return null;
  }
}