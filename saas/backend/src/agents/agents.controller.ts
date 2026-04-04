import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';

type AuthedRequest = Express.Request & {
  user: { userId: string; email: string };
};

@ApiSecurity('api-key')
@ApiTags('agents')
@Controller('agents')
export class AgentsController {
  constructor(private readonly agents: AgentsService) {}

  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Créer un agent (Control Plane + profil Data Plane)' })
  create(@Req() req: AuthedRequest, @Body() dto: CreateAgentDto) {
    return this.agents.create(req.user.userId, dto);
  }
}
