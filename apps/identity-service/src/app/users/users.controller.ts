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
import { UserService } from '@erp/identity-core';
import type {
  CreateUserDto,
  UpdateUserDto,
  ResetPasswordDto,
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
import { PlatformRole, UserStatus } from '@erp/enums';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles(PlatformRole.SUPER_ADMIN, PlatformRole.TENANT_ADMIN)
  @Permissions('users:create')
  async create(@Body() dto: CreateUserDto, @CurrentUser() user: UserPayload) {
    if (!dto.tenantId) dto.tenantId = user.tenantId;
    return { data: await this.userService.create(dto) };
  }

  @Get()
  @Roles(
    PlatformRole.SUPER_ADMIN,
    PlatformRole.TENANT_ADMIN,
    PlatformRole.VIEWER,
  )
  @Permissions('users:read')
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @CurrentUser() user?: UserPayload,
  ) {
    const result = await this.userService.list({
      tenantId: user?.tenantId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      status: status as UserStatus,
    });
    return { data: result.data, total: result.total };
  }

  @Get('stats')
  @Roles(
    PlatformRole.SUPER_ADMIN,
    PlatformRole.TENANT_ADMIN,
    PlatformRole.VIEWER,
  )
  @Permissions('users:read')
  async stats() {
    return { data: await this.userService.getUserStats() };
  }

  @Get(':id')
  @Roles(
    PlatformRole.SUPER_ADMIN,
    PlatformRole.TENANT_ADMIN,
    PlatformRole.VIEWER,
  )
  @Permissions('users:read')
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    if (!user) return { statusCode: 404, message: 'User not found' };
    return { data: user };
  }

  @Patch(':id')
  @Roles(PlatformRole.SUPER_ADMIN, PlatformRole.TENANT_ADMIN)
  @Permissions('users:update')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return { data: await this.userService.update(id, dto) };
  }

  @Delete(':id')
  @Roles(PlatformRole.SUPER_ADMIN, PlatformRole.TENANT_ADMIN)
  @Permissions('users:delete')
  async remove(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    await this.userService.delete(id, user.userId);
    return { data: { id }, message: 'User deleted' };
  }

  @Post(':id/activate')
  @Roles(PlatformRole.SUPER_ADMIN, PlatformRole.TENANT_ADMIN)
  @Permissions('users:update')
  async activate(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    const result = await this.userService.activateUser(id, user.userId);
    return { data: result, message: 'User activated successfully' };
  }

  @Post(':id/deactivate')
  @Roles(PlatformRole.SUPER_ADMIN, PlatformRole.TENANT_ADMIN)
  @Permissions('users:update')
  async deactivate(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    const result = await this.userService.deactivateUser(id, user.userId);
    return { data: result, message: 'User deactivated successfully' };
  }

  @Post(':id/suspend')
  @Roles(PlatformRole.SUPER_ADMIN, PlatformRole.TENANT_ADMIN)
  @Permissions('users:update')
  async suspend(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    const result = await this.userService.suspendUser(id, user.userId);
    return { data: result, message: 'User suspended successfully' };
  }

  @Post(':id/reset-password')
  @Roles(PlatformRole.SUPER_ADMIN, PlatformRole.TENANT_ADMIN)
  @Permissions('users:update')
  async resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    await this.userService.resetPassword(id, dto.newPassword);
    return { message: 'Password reset successfully' };
  }

  @Post(':id/approve')
  @Roles(PlatformRole.SUPER_ADMIN, PlatformRole.TENANT_ADMIN)
  @Permissions('users:approve')
  async approve(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    const result = await this.userService.approveUser(id, user.userId);
    return { data: result, message: 'User approved successfully' };
  }

  @Post(':id/reject')
  @Roles(PlatformRole.SUPER_ADMIN, PlatformRole.TENANT_ADMIN)
  @Permissions('users:reject')
  async reject(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    const result = await this.userService.rejectUser(id, user.userId);
    return { data: result, message: 'User rejected successfully' };
  }
}
