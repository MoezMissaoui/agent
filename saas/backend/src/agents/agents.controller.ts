import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { AgentsService } from './agents.service';
import { AgentResponseDto } from './dto/agent-response.dto';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

type AuthedRequest = Express.Request & {
  user: { userId: string; email: string };
};

@ApiSecurity('api-key')
@ApiTags('agents')
@Controller('agents')
export class AgentsController {
  constructor(private readonly agents: AgentsService) {}

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Lister les agents du compte' })
  @ApiResponse({ status: 200, description: 'OK', type: AgentResponseDto, isArray: true })
  findAll(@Req() req: AuthedRequest) {
    return this.agents.findAll(req.user.userId);
  }

  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Créer un agent' })
  @ApiResponse({ status: 201, description: 'Created', type: AgentResponseDto })
  create(@Req() req: AuthedRequest, @Body() dto: CreateAgentDto) {
    return this.agents.create(req.user.userId, dto);
  }

  @Get(':agentId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Détail d’un agent' })
  @ApiResponse({ status: 200, description: 'OK', type: AgentResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(
    @Req() req: AuthedRequest,
    @Param('agentId', new ParseUUIDPipe({ version: '4' })) agentId: string,
  ) {
    return this.agents.findOne(req.user.userId, agentId);
  }

  @Patch(':agentId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mettre à jour un agent' })
  @ApiResponse({ status: 200, description: 'OK', type: AgentResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(
    @Req() req: AuthedRequest,
    @Param('agentId', new ParseUUIDPipe({ version: '4' })) agentId: string,
    @Body() dto: UpdateAgentDto,
  ) {
    return this.agents.update(req.user.userId, agentId, dto);
  }

  @Delete(':agentId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Supprimer un agent (documents et sessions liés en cascade)' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(
    @Req() req: AuthedRequest,
    @Param('agentId', new ParseUUIDPipe({ version: '4' })) agentId: string,
  ) {
    return this.agents.remove(req.user.userId, agentId);
  }
}
