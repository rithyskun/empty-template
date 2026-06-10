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
import { PermissionService } from '@erp/identity-core';
import type {
  CreatePermissionDto,
  UpdatePermissionDto,
  SetRolePermissionsDto,
} from '@erp/identity-core';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@erp/auth';
import type { UserPayload } from '@erp/auth';
import { PlatformRole } from '@erp/enums';

@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PermissionsController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  @Roles(PlatformRole.SUPER_ADMIN, PlatformRole.TENANT_ADMIN)
  async create(
    @Body() dto: CreatePermissionDto,
    @CurrentUser() user: UserPayload,
  ) {
    if (!dto.tenantId) dto.tenantId = user.tenantId;
    return { data: await this.permissionService.create(dto) };
  }

  @Get()
  @Roles(
    PlatformRole.SUPER_ADMIN,
    PlatformRole.TENANT_ADMIN,
    PlatformRole.VIEWER,
  )
  async list(
    @Query('roleId') roleId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: UserPayload,
  ) {
    const result = await this.permissionService.list({
      roleId,
      tenantId: user?.tenantId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    return { data: result.data, total: result.total };
  }

  @Get('role/:roleId')
  @Roles(
    PlatformRole.SUPER_ADMIN,
    PlatformRole.TENANT_ADMIN,
    PlatformRole.VIEWER,
  )
  async getRolePermissions(@Param('roleId') roleId: string) {
    const perms = await this.permissionService.getRolePermissions(roleId);
    return { data: perms };
  }

  @Get('user/:userId')
  @Roles(
    PlatformRole.SUPER_ADMIN,
    PlatformRole.TENANT_ADMIN,
    PlatformRole.VIEWER,
  )
  async getUserPermissions(@Param('userId') userId: string) {
    const perms = await this.permissionService.getUserPermissions(userId);
    return { data: perms };
  }

  @Get(':id')
  @Roles(
    PlatformRole.SUPER_ADMIN,
    PlatformRole.TENANT_ADMIN,
    PlatformRole.VIEWER,
  )
  async findOne(@Param('id') id: string) {
    const perm = await this.permissionService.findById(id);
    if (!perm) return { statusCode: 404, message: 'Permission not found' };
    return { data: perm };
  }

  @Patch(':id')
  @Roles(PlatformRole.SUPER_ADMIN, PlatformRole.TENANT_ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdatePermissionDto) {
    return { data: await this.permissionService.update(id, dto) };
  }

  @Delete(':id')
  @Roles(PlatformRole.SUPER_ADMIN, PlatformRole.TENANT_ADMIN)
  async remove(@Param('id') id: string) {
    await this.permissionService.delete(id);
    return { data: { id }, message: 'Permission deleted' };
  }

  @Post('role')
  @Roles(PlatformRole.SUPER_ADMIN, PlatformRole.TENANT_ADMIN)
  async setRolePermissions(@Body() dto: SetRolePermissionsDto) {
    const perms = await this.permissionService.setRolePermissions(
      dto.roleId,
      dto.permissions,
    );
    return { data: perms };
  }
}
