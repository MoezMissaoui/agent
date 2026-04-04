import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { AgentChatService } from './agent-chat.service';
import { SendChatMessageDto } from './dto/send-chat-message.dto';

type AuthedRequest = Express.Request & {
  user: { userId: string; email: string };
};

@ApiSecurity('api-key')
@ApiTags('agents')
@Controller('agents/:agentId/chat')
export class AgentChatController {
  constructor(private readonly chat: AgentChatService) {}

  @Get('status')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Indique si le chat RAG est autorisé (≥1 document READY)' })
  @ApiResponse({ status: 200, description: 'OK' })
  getStatus(
    @Req() req: AuthedRequest,
    @Param('agentId', new ParseUUIDPipe({ version: '4' })) agentId: string,
  ) {
    return this.chat.getStatus(req.user.userId, agentId);
  }

  @Get('sessions')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Lister les sessions de chat' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 403, description: 'Chat désactivé (pas de document ingéré)' })
  listSessions(
    @Req() req: AuthedRequest,
    @Param('agentId', new ParseUUIDPipe({ version: '4' })) agentId: string,
  ) {
    return this.chat.listSessions(req.user.userId, agentId);
  }

  @Post('sessions')
  @HttpCode(201)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Créer une session de chat' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 403, description: 'Chat désactivé' })
  createSession(
    @Req() req: AuthedRequest,
    @Param('agentId', new ParseUUIDPipe({ version: '4' })) agentId: string,
  ) {
    return this.chat.createSession(req.user.userId, agentId);
  }

  @Get('sessions/:sessionId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Messages d’une session' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 403, description: 'Chat désactivé' })
  @ApiResponse({ status: 404, description: 'Session introuvable' })
  getSession(
    @Req() req: AuthedRequest,
    @Param('agentId', new ParseUUIDPipe({ version: '4' })) agentId: string,
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
  ) {
    return this.chat.getSessionMessages(req.user.userId, agentId, sessionId);
  }

  @Delete('sessions/:sessionId')
  @HttpCode(204)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Supprimer une session de chat et ses messages' })
  @ApiResponse({ status: 204, description: 'No content' })
  @ApiResponse({ status: 403, description: 'Chat désactivé' })
  @ApiResponse({ status: 404, description: 'Session introuvable' })
  deleteSession(
    @Req() req: AuthedRequest,
    @Param('agentId', new ParseUUIDPipe({ version: '4' })) agentId: string,
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
  ) {
    return this.chat.deleteSession(req.user.userId, agentId, sessionId);
  }

  @Post('sessions/:sessionId/messages')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Envoyer un message (RAG via Data Plane)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 403, description: 'Chat désactivé' })
  @ApiResponse({ status: 502, description: 'Data Plane / LLM indisponible' })
  sendMessage(
    @Req() req: AuthedRequest,
    @Param('agentId', new ParseUUIDPipe({ version: '4' })) agentId: string,
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Body() dto: SendChatMessageDto,
  ) {
    return this.chat.sendMessage(req.user.userId, agentId, sessionId, dto.content);
  }
}
