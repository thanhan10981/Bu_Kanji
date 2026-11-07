import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsInt, IsString, Length, Max, Min, ValidateNested } from 'class-validator';
import { CardDto } from '../vocabulary/vocabulary.dto';

export const IMPORT_MAX_BYTES = 100 * 1024 * 1024;
export const IMPORT_PART_BYTES = 2 * 1024 * 1024;
export class CreateImportDto {
  @IsString() @Length(1, 240) name!: string;
  @IsInt() @Min(1) @Max(IMPORT_MAX_BYTES) size!: number;
  @IsInt() @Min(0) @Max(Number.MAX_SAFE_INTEGER) lastModified!: number;
  @IsIn(['gpt-5.6-terra', 'gpt-5.6-luna']) model!: string;
}
export class ImportResultDto {
  @IsArray() @ArrayMaxSize(200) @ValidateNested({ each: true }) @Type(() => CardDto)
  cards!: CardDto[];
}
