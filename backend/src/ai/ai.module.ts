import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';

@Module({ controllers: [AiController, ImportController], providers: [AiService, ImportService] })
export class AiModule {}
