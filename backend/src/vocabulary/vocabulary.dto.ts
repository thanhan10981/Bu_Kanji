import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsOptional, IsString, Length, Matches, MaxLength, Min, ValidateNested } from 'class-validator';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;
const reading = ({ value }: { value: unknown }) => typeof value === 'string' ? value.normalize('NFC').replace(/\s/gu, '') : value;

export class NameDto {
  @Transform(trim) @IsString() @Length(1, 120)
  name!: string;
}

export class CardDto {
  @Transform(trim) @IsString() @Length(1, 500)
  meaning!: string;

  @Transform(reading) @IsString() @Length(1, 200) @Matches(/^[\u3041-\u3096ー]+$/u)
  reading!: string;

  @IsOptional() @Transform(trim) @IsString() @MaxLength(200)
  japanese?: string;
}

export class DeleteDto {
  @IsInt() @Min(0)
  expectedSetCount!: number;
  @IsInt() @Min(0)
  expectedCardCount!: number;
}

export class ImportCardsDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(200) @ValidateNested({ each: true }) @Type(() => CardDto)
  cards!: CardDto[];
}
