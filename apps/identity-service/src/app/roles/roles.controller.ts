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
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  PermissionsGuard,
  Permissions,
  CurrentUser,
} from '@erp/auth';
import type { UserPayload } from '@erp/auth';
import { PlatformRole } from '@erp/enums';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @Roles(PlatformRole.SUPER_ADMIN, PlatformRole.TENANT_ADMIN)
  @Permissions('roles:create')
  async create(@Body() dto: CreateRoleDto, @CurrentUser() user: UserPayload) {
    if (!dto.tenantId) dto.tenantId = user.tenantId;
    return { data: await this.roleService.create(dto) };
  }

  @Get()
  @Permissions('roles:read')
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @CurrentUser() user?: UserPayload,
  ) {
    const result = await this.roleService.list({
      tenantId: user?.tenantId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
    return { data: result.data, total: result.total };
  }

  @Get('stats')
  @Permissions('roles:read')
  async stats() {
    return { data: await this.roleService.getRoleStats() };
  }

  @Get('active')
  @Permissions('roles:read')
  async active(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: UserPayload,
  ) {
    const result = await this.roleService.list({
      tenantId: user?.tenantId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      isActive: true,
    });
    return { data: result.data, total: result.total };
  }

  @Get(':id')
  @Permissions('roles:read')
  async findOne(@Param('id') id: string) {
    const role = await this.roleService.findById(id);
    if (!role) return { statusCode: 404, message: 'Role not found' };
    return { data: role };
  }

  @Patch(':id')
  @Roles(PlatformRole.SUPER_ADMIN, PlatformRole.TENANT_ADMIN)
  @Permissions('roles:update')
  async update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return { data: await this.roleService.update(id, dto) };
  }

  @Delete(':id')
  @Roles(PlatformRole.SUPER_ADMIN, PlatformRole.TENANT_ADMIN)
  @Permissions('roles:delete')
  async remove(@Param('id') id: string) {
    await this.roleService.delete(id);
    return { data: { id }, message: 'Role deleted' };
  }

  @Post('assign')
  @Roles(PlatformRole.SUPER_ADMIN, PlatformRole.TENANT_ADMIN)
  @Permissions('roles:assign')
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
  @Permissions('roles:unassign')
  async unassignRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    await this.roleService.unassignRole(userId, roleId);
    return { message: 'Role unassigned' };
  }

  @Get('user/:userId')
  @Permissions('roles:read')
  async getUserRoles(@Param('userId') userId: string) {
    const roles = await this.roleService.getUserRoles(userId);
    return { data: roles };
  }
}
