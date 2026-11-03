import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VocabularyFolder, VocabularySet, VocabularyCard } from './entities';
import { VocabularyController } from './vocabulary.controller';
import { VocabularyService } from './vocabulary.service';
@Module({
  imports: [TypeOrmModule.forFeature([VocabularyFolder, VocabularySet, VocabularyCard])],
  controllers: [VocabularyController], providers: [VocabularyService],
})
export class VocabularyModule {}
