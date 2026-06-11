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
import type { CreateUserDto, UpdateUserDto } from '@erp/identity-core';
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
    @CurrentUser() user?: UserPayload,
  ) {
    const result = await this.userService.list({
      tenantId: user?.tenantId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    return { data: result.data, total: result.total };
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
