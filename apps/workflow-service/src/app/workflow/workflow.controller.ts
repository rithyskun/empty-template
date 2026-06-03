import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { WorkflowCoreService } from '@erp/workflow-core';
import type {
  CreateWorkflowDefinitionDto,
  UpdateWorkflowDefinitionDto,
  CreateWorkflowInstanceDto,
  ActOnStageDto,
} from '@erp/workflow-core';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@erp/auth';
import type { UserPayload } from '@erp/auth';
import { PlatformRole } from '@erp/enums';

@Controller('workflow')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkflowController {
  constructor(private readonly service: WorkflowCoreService) {}

  // --- Definitions ---

  @Post('definitions')
  @Roles(PlatformRole.MAKER, PlatformRole.TENANT_ADMIN)
  async createDefinition(@Body() dto: CreateWorkflowDefinitionDto) {
    return { data: await this.service.createDefinition(dto) };
  }

  @Get('definitions')
  @Roles(
    PlatformRole.MAKER,
    PlatformRole.CHECKER,
    PlatformRole.VIEWER,
    PlatformRole.TENANT_ADMIN,
  )
  async listDefinitions() {
    return { data: await this.service.listDefinitions() };
  }

  @Get('definitions/:id')
  @Roles(
    PlatformRole.MAKER,
    PlatformRole.CHECKER,
    PlatformRole.VIEWER,
    PlatformRole.TENANT_ADMIN,
  )
  async findDefinition(@Param('id') id: string) {
    const data = await this.service.findDefinitionById(id);
    return { data };
  }

  @Patch('definitions/:id')
  @Roles(PlatformRole.MAKER, PlatformRole.TENANT_ADMIN)
  async updateDefinition(
    @Param('id') id: string,
    @Body() dto: UpdateWorkflowDefinitionDto,
  ) {
    return { data: await this.service.updateDefinition(id, dto) };
  }

  @Delete('definitions/:id')
  @Roles(PlatformRole.TENANT_ADMIN)
  async deleteDefinition(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    await this.service.deleteDefinition(id, user.userId);
    return { data: { id }, message: 'Definition deleted' };
  }

  // --- Built-in Definitions ---

  @Get('built-in')
  @Roles(
    PlatformRole.MAKER,
    PlatformRole.CHECKER,
    PlatformRole.VIEWER,
    PlatformRole.TENANT_ADMIN,
  )
  async getBuiltInDefinitions() {
    return { data: this.service.getAllDefinitions() };
  }

  // --- Instances ---

  @Post('instances')
  @Roles(PlatformRole.MAKER, PlatformRole.TENANT_ADMIN)
  async createInstance(
    @Body() dto: CreateWorkflowInstanceDto,
    @CurrentUser() user: UserPayload,
  ) {
    if (!dto.tenantId) dto.tenantId = user.tenantId;
    if (!dto.createdBy) dto.createdBy = user.userId;
    return { data: await this.service.createInstance(dto) };
  }

  @Get('instances')
  @Roles(
    PlatformRole.MAKER,
    PlatformRole.CHECKER,
    PlatformRole.VIEWER,
    PlatformRole.TENANT_ADMIN,
  )
  async listInstances(
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: string,
    @Query('entityType') entityType?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: UserPayload,
  ) {
    const result = await this.service.listInstances({
      tenantId: tenantId || user?.tenantId,
      status,
      entityType,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    return { data: result.data, total: result.total };
  }

  @Get('instances/:id')
  @Roles(
    PlatformRole.MAKER,
    PlatformRole.CHECKER,
    PlatformRole.VIEWER,
    PlatformRole.TENANT_ADMIN,
  )
  async findInstance(@Param('id') id: string) {
    const data = await this.service.findInstanceById(id);
    return { data };
  }

  @Patch('instances/:id')
  @Roles(PlatformRole.MAKER, PlatformRole.TENANT_ADMIN)
  async updateInstance(
    @Param('id') id: string,
    @Body() dto: Partial<CreateWorkflowInstanceDto>,
  ) {
    return { data: await this.service.updateInstance(id, dto) };
  }

  @Delete('instances/:id')
  @Roles(PlatformRole.TENANT_ADMIN)
  async deleteInstance(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    await this.service.deleteInstance(id, user.userId);
    return { data: { id }, message: 'Instance deleted' };
  }

  @Post('instances/:id/initialize')
  @Roles(PlatformRole.MAKER, PlatformRole.TENANT_ADMIN)
  async initializeStages(
    @Param('id') id: string,
    @Body() body: { definitionCode: string },
  ) {
    return {
      data: await this.service.initializeStages(id, body.definitionCode),
    };
  }

  @Post('instances/:id/stages/:stageOrder/act')
  @Roles(
    PlatformRole.MAKER,
    PlatformRole.CHECKER,
    PlatformRole.AUTHORIZER,
    PlatformRole.TENANT_ADMIN,
  )
  async actOnStage(
    @Param('id') id: string,
    @Param('stageOrder') stageOrder: string,
    @Body() dto: ActOnStageDto,
  ) {
    return { data: await this.service.actOnStage(id, Number(stageOrder), dto) };
  }
}
