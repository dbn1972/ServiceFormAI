import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CustomComponentService } from './custom-component.service';
import { TenantStaffAuthGuard } from '../auth/guards/tenant-staff-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { CreateCustomComponentDto } from './dto/create-custom-component.dto';
import { UpdateCustomComponentDto } from './dto/update-custom-component.dto';

@Controller('producer/custom-components')
@UseGuards(TenantStaffAuthGuard, RolesGuard)
export class CustomComponentController {
  constructor(private readonly service: CustomComponentService) {}

  @Post()
  @Roles('admin', 'officer')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @TenantId() tenantId: string,
    @Body() dto: CreateCustomComponentDto,
  ) {
    return { success: true, data: await this.service.create(tenantId, dto) };
  }

  @Get()
  @Roles('admin', 'officer', 'clerk')
  async findAll(@TenantId() tenantId: string) {
    return { success: true, data: await this.service.findAll(tenantId) };
  }

  @Get(':id')
  @Roles('admin', 'officer', 'clerk')
  async findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return { success: true, data: await this.service.findOne(tenantId, id) };
  }

  @Put(':id')
  @Roles('admin', 'officer')
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomComponentDto,
  ) {
    return {
      success: true,
      data: await this.service.update(tenantId, id, dto),
    };
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return { success: true, data: await this.service.remove(tenantId, id) };
  }
}
