import { Controller, Get, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

type AuthedRequest = Express.Request & {
  user: { userId: string; email: string };
};

@ApiSecurity('api-key')
@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Dashboard metrics for the signed-in user (agents, docs, chat)' })
  @ApiResponse({ status: 200, description: 'OK' })
  getDashboard(@Req() req: AuthedRequest) {
    return this.dashboard.getDashboard(req.user.userId);
  }
}
