import { IsString, IsOptional, IsEnum, IsNumber, Min, Max, ValidateNested, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { HeroClass, HeroClassType } from '@domain/enums/HeroClass';

/**
 * DTO: CreateHeroDTO
 *
 * PATRÓN: DTO (Data Transfer Object)
 * POR QUÉ: Define el contrato de entrada para crear héroe.
 * - Validación automática con class-validator
 * - No expone entidad de dominio
 * - Versionable independientemente
 * - Documentación automática con Swagger
 *
 * DECISIÓN: class-validator + class-transformer decorators.
 * class-transformer permite transformar plain objects a instancias de clase.
 * ALTERNATIVAS DESCARTADAS:
 * - Interface simple: sin validación runtime, sin transformación
 * - Zod schema: buena alternativa pero class-validator integra mejor con NestJS/Express
 * - Validación manual en controller: lógica dispersa, propenso a errores
 */
export class CreateHeroDTO {
  @IsString()
  @Min(2, { message: 'Name must be at least 2 characters' })
  @Max(20, { message: 'Name must be at most 20 characters' })
  name: string;

  @IsOptional()
  @IsEnum(HeroClass, { message: 'Invalid hero class' })
  classType?: HeroClassType;
}

/**
 * DTO: LevelUpDTO
 * Para distribuir puntos de atributo al subir nivel
 */
export class LevelUpDTO {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5, { message: 'Cannot allocate more than 5 points to strength' })
  strength?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5, { message: 'Cannot allocate more than 5 points to dexterity' })
  dexterity?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5, { message: 'Cannot allocate more than 5 points to vitality' })
  vitality?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5, { message: 'Cannot allocate more than 5 points to energy' })
  energy?: number;
}

/**
 * DTO: HeroResponseDTO
 * Respuesta completa del héroe (para GET /hero/:id)
 * Incluye campos computados
 */
export class HeroResponseDTO {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsEnum(HeroClass)
  classType: HeroClassType;

  @IsNumber()
  level: number;

  @IsNumber()
  experience: number;

  @IsNumber()
  xpForNextLevel: number;

  @IsNumber()
  attributePointsAvailable: number;

  @ValidateNested()
  @Type(() => StatsDTO)
  baseStats: StatsDTO;

  @ValidateNested()
  @Type(() => StatsDTO)
  allocatedStats: StatsDTO;

  @ValidateNested()
  @Type(() => StatsDTO)
  totalStats: StatsDTO;

  @IsNumber()
  maxHp: number;

  @IsNumber()
  currentHp: number;

  @IsNumber()
  maxMana: number;

  @IsNumber()
  currentMana: number;

  @IsNumber()
  baseDamage: number;
}

/**
 * DTO interno para stats
 */
export class StatsDTO {
  @IsNumber()
  strength: number;

  @IsNumber()
  dexterity: number;

  @IsNumber()
  vitality: number;

  @IsNumber()
  energy: number;
}

/**
 * DTO: ErrorResponse
 * Estándar para respuestas de error
 */
export class ErrorResponseDTO {
  @IsString()
  error: string;

  @IsString()
  code: string;

  @IsNumber()
  statusCode: number;

  @IsOptional()
  @IsString()
  details?: string;
}