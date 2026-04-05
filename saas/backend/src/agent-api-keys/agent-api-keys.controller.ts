import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { AgentApiKeysService } from './agent-api-keys.service';
import { CreateAgentApiAccessTokenDto } from './dto/create-agent-api-access-token.dto';

type AuthedRequest = Express.Request & {
  user: { userId: string; email: string };
};

@ApiSecurity('api-key')
@ApiTags('agents')
@Controller('agents/:agentId/api-access-tokens')
export class AgentApiKeysController {
  constructor(private readonly apiKeys: AgentApiKeysService) {}

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List API access tokens for an assistant (max 3)' })
  @ApiOkResponse({ description: 'OK' })
  list(
    @Req() req: AuthedRequest,
    @Param('agentId', new ParseUUIDPipe({ version: '4' })) agentId: string,
  ) {
    return this.apiKeys.list(req.user.userId, agentId);
  }

  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create an API access token (secret shown once)' })
  @ApiCreatedResponse({ description: 'Created' })
  @ApiResponse({ status: 400, description: 'Max tokens reached or invalid body' })
  @ApiResponse({ status: 409, description: 'Token name already exists for this assistant' })
  create(
    @Req() req: AuthedRequest,
    @Param('agentId', new ParseUUIDPipe({ version: '4' })) agentId: string,
    @Body() dto: CreateAgentApiAccessTokenDto,
  ) {
    return this.apiKeys.create(req.user.userId, agentId, dto);
  }

  @Get(':tokenId/secret')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Reveal full API token secret (dashboard only; JWT required)',
  })
  @ApiOkResponse({ description: 'OK' })
  @ApiResponse({ status: 400, description: 'Legacy token without stored secret' })
  revealSecret(
    @Req() req: AuthedRequest,
    @Param('agentId', new ParseUUIDPipe({ version: '4' })) agentId: string,
    @Param('tokenId', new ParseUUIDPipe({ version: '4' })) tokenId: string,
  ) {
    return this.apiKeys.revealSecret(req.user.userId, agentId, tokenId);
  }

  @Delete(':tokenId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Revoke an API access token' })
  @ApiOkResponse({ description: 'Deleted' })
  remove(
    @Req() req: AuthedRequest,
    @Param('agentId', new ParseUUIDPipe({ version: '4' })) agentId: string,
    @Param('tokenId', new ParseUUIDPipe({ version: '4' })) tokenId: string,
  ) {
    return this.apiKeys.remove(req.user.userId, agentId, tokenId);
  }
}
