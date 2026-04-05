import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AgentApiKeysService } from '../../agent-api-keys/agent-api-keys.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { JwtPayload } from '../strategies/jwt.strategy';

@Injectable()
export class JwtOrAgentApiKeyGuard {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly agentApiKeys: AgentApiKeysService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers?.authorization as string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const payload = await this.jwt.verifyAsync<JwtPayload>(token);
        if (payload.typ && payload.typ !== 'access') {
          throw new UnauthorizedException();
        }
        req.user = { userId: payload.sub, email: payload.email };
        return true;
      } catch {
        // Invalid JWT: fall through to agent API key
      }
    }

    const raw = req.headers['x-api-key'];
    const key = Array.isArray(raw) ? raw[0] : raw;
    if (key && typeof key === 'string') {
      const trimmed = key.trim();
      if (trimmed) {
        const resolved = await this.agentApiKeys.validateApiKey(trimmed);
        if (resolved) {
          const agentIdParam = req.params?.agentId as string | undefined;
          if (!agentIdParam) {
            throw new ForbiddenException(
              'Agent API tokens can only be used on routes that include an agent id.',
            );
          }
          if (agentIdParam !== resolved.agentUuid) {
            throw new ForbiddenException('API token does not match this assistant.');
          }
          req.user = { userId: resolved.userId, email: resolved.email };
          return true;
        }
      }
    }

    throw new UnauthorizedException();
  }
}
