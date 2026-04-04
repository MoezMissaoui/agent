import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { AgentIngestService, type IngestUploadedFile } from './agent-ingest.service';

type AuthedRequest = Express.Request & {
  user: { userId: string; email: string };
};

const MAX_FILE_BYTES = 52_428_800;

@ApiSecurity('api-key')
@ApiTags('agents')
@Controller('agents/:agentId/documents')
export class AgentIngestController {
  constructor(private readonly ingest: AgentIngestService) {}

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Documents enregistrés pour cet agent (Control Plane)' })
  @ApiResponse({ status: 200, description: 'OK' })
  listDocuments(
    @Req() req: AuthedRequest,
    @Param('agentId', new ParseUUIDPipe({ version: '4' })) agentId: string,
  ) {
    return this.ingest.listDocuments(req.user.userId, agentId);
  }

  @Post('ingest')
  @HttpCode(202)
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Envoyer un document au Data Plane (ingestion RAG asynchrone)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Job accepté' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_BYTES },
    }),
  )
  async ingestDocument(
    @Req() req: AuthedRequest,
    @Param('agentId', new ParseUUIDPipe({ version: '4' })) agentId: string,
    @UploadedFile() file: IngestUploadedFile | undefined,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('file is required');
    }
    return this.ingest.ingestDocument(req.user.userId, agentId, file);
  }

  @Get('ingest/status/:jobId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Statut d’ingestion (progression Data Plane)' })
  @ApiResponse({ status: 200, description: 'OK' })
  getStatus(
    @Req() req: AuthedRequest,
    @Param('agentId', new ParseUUIDPipe({ version: '4' })) agentId: string,
    @Param('jobId', ParseUUIDPipe) jobId: string,
  ) {
    return this.ingest.getIngestStatus(req.user.userId, agentId, jobId);
  }
}
