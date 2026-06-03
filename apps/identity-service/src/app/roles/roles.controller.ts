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
import { RoleService } from '@erp/identity-core';
import type {
  CreateRoleDto,
  UpdateRoleDto,
  AssignRoleDto,
} from '@erp/identity-core';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@erp/auth';
import type { UserPayload } from '@erp/auth';
import { PlatformRole } from '@erp/enums';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @Roles(PlatformRole.SUPER_ADMIN, PlatformRole.TENANT_ADMIN)
  async create(@Body() dto: CreateRoleDto, @CurrentUser() user: UserPayload) {
    if (!dto.tenantId) dto.tenantId = user.tenantId;
    return { data: await this.roleService.create(dto) };
  }

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: UserPayload,
  ) {
    const result = await this.roleService.list({
      tenantId: user?.tenantId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    return { data: result.data, total: result.total };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const role = await this.roleService.findById(id);
    if (!role) return { statusCode: 404, message: 'Role not found' };
    return { data: role };
  }

  @Patch(':id')
  @Roles(PlatformRole.SUPER_ADMIN, PlatformRole.TENANT_ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return { data: await this.roleService.update(id, dto) };
  }

  @Delete(':id')
  @Roles(PlatformRole.SUPER_ADMIN, PlatformRole.TENANT_ADMIN)
  async remove(@Param('id') id: string) {
    await this.roleService.delete(id);
    return { data: { id }, message: 'Role deleted' };
  }

  @Post('assign')
  @Roles(PlatformRole.SUPER_ADMIN, PlatformRole.TENANT_ADMIN)
  async assignRole(
    @Body() dto: AssignRoleDto,
    @CurrentUser() user: UserPayload,
  ) {
    await this.roleService.assignRole(
      dto.userId,
      dto.roleId,
      user.userId,
      user.tenantId,
    );
    return { message: 'Role assigned' };
  }

  @Delete('assign/:userId/:roleId')
  @Roles(PlatformRole.SUPER_ADMIN, PlatformRole.TENANT_ADMIN)
  async unassignRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    await this.roleService.unassignRole(userId, roleId);
    return { message: 'Role unassigned' };
  }

  @Get('user/:userId')
  async getUserRoles(@Param('userId') userId: string) {
    const roles = await this.roleService.getUserRoles(userId);
    return { data: roles };
  }
}
