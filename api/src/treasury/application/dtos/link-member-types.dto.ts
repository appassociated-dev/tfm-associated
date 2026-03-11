import {
  IsNotEmpty,
  IsBoolean,
  IsInt,
  IsUUID,
  IsArray,
  ValidateNested,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para una vinculación individual de tipo de socio a plan de cuota.
 */
export class MemberTypeLinkDto {
  @ApiProperty({
    description: 'ID del tipo de socio (UUID)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsNotEmpty({ message: 'El ID del tipo de socio es obligatorio.' })
  @IsUUID('4', { message: 'memberTypeId debe ser un UUID válido.' })
  memberTypeId!: string;

  @ApiProperty({
    description: 'Si esta vinculación es la predeterminada para el tipo de socio',
    example: true,
    default: false,
  })
  @IsBoolean({ message: 'isDefault debe ser un booleano.' })
  isDefault!: boolean;

  @ApiProperty({
    description: 'Orden de presentación (entero >= 0)',
    example: 1,
  })
  @IsInt({ message: 'order debe ser un número entero.' })
  @Min(0, { message: 'order no puede ser negativo.' })
  order!: number;
}

/**
 * DTO de entrada para vincular tipos de socio a un plan de cuota.
 * Contiene un array de vinculaciones con memberTypeId, isDefault y order.
 */
export class LinkMemberTypesDto {
  @ApiProperty({
    description: 'Array de vinculaciones de tipos de socio',
    type: [MemberTypeLinkDto],
  })
  @IsArray({ message: 'links debe ser un array.' })
  @ArrayMinSize(1, { message: 'Debe incluir al menos una vinculación.' })
  @ValidateNested({ each: true })
  @Type(() => MemberTypeLinkDto)
  links!: MemberTypeLinkDto[];
}
