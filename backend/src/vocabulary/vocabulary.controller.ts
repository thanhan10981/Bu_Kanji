import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { CardDto, DeleteDto, ImportCardsDto, NameDto } from './vocabulary.dto';
import { VocabularyService } from './vocabulary.service';

@Controller('vocabulary')
export class VocabularyController {
  constructor(private readonly service: VocabularyService) {}
  @Get('folders') folders(@CurrentUser() u: AuthenticatedUser) { return this.service.folders(u.id); }
  @Post('folders') createFolder(@CurrentUser() u: AuthenticatedUser, @Body() b: NameDto) { return this.service.createFolder(u.id, b.name); }
  @Get('folders/:id') folder(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.service.folder(u.id, id); }
  @Patch('folders/:id') renameFolder(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() b: NameDto) { return this.service.renameFolder(u.id, id, b.name); }
  @Delete('folders/:id') deleteFolder(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() b: DeleteDto) { return this.service.deleteFolder(u.id, id, b); }
  @Post('folders/:id/sets') createSet(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() b: NameDto) { return this.service.createSet(u.id, id, b.name); }
  @Get('sets/:id') set(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.service.set(u.id, id); }
  @Patch('sets/:id') renameSet(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() b: NameDto) { return this.service.renameSet(u.id, id, b.name); }
  @Delete('sets/:id') deleteSet(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() b: DeleteDto) { return this.service.deleteSet(u.id, id, b); }
  @Post('sets/:id/cards') createCard(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() b: CardDto) { return this.service.createCard(u.id, id, b); }
  @Post('sets/:id/import') importCards(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() b: ImportCardsDto) { return this.service.importCards(u.id, id, b.cards); }
  @Patch('cards/:id') updateCard(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() b: CardDto) { return this.service.updateCard(u.id, id, b); }
  @Delete('cards/:id') deleteCard(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.service.deleteCard(u.id, id); }
}
