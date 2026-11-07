import { Body, Controller, Delete, Get, Param, ParseIntPipe, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { CreateImportDto, ImportResultDto } from './import.dto';
import { ImportService } from './import.service';

@Controller('ai/imports')
export class ImportController {
  constructor(private readonly service: ImportService) {}
  @Post() create(@CurrentUser() u: AuthenticatedUser, @Body() body: CreateImportDto) { return this.service.create(u.id, body); }
  @Get(':id') status(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.service.status(u.id, id); }
  @Delete(':id') remove(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.service.remove(u.id, id); }
  @Put(':id/parts/:index') part(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Param('index', ParseIntPipe) index: number, @Body() body: Buffer) { return this.service.part(u.id, id, index, body); }
  @Post(':id/prepare') prepare(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.service.prepare(u.id, id); }
  @Get(':id/batches/:index') batch(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Param('index', ParseIntPipe) index: number) { return this.service.batch(u.id, id, index); }
  @Put(':id/batches/:index') result(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Param('index', ParseIntPipe) index: number, @Body() body: ImportResultDto) { return this.service.result(u.id, id, index, body); }
}
