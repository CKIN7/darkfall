import { CreateHeroDTO } from '../dtos/HeroDTOs';
import { HeroClass, HeroClassType } from '@domain/enums/HeroClass';

/**
 * Command: CreateHeroCommand
 *
 * PATRÓN: Command Pattern
 * POR QUÉ: Encapsula la intención de crear un héroe con todos los datos necesarios.
 * Ventajas:
 * - Separación de responsabilidades: Controller solo recibe HTTP, Command valida y ejecuta
 * - Testable: Se puede testear el comando aislado
 * - Extensible: Fácil añadir logging, undo, audit trail
 * - CQRS-friendly: Comando separado de Query
 *
 * DECISIÓN: Command inmutable con factory method que valida.
 * El Handler (HeroService) ejecuta el comando.
 * ALTERNATIVAS DESCARTADAS:
 * - Controller llama directo a Service: acopla HTTP a lógica de negocio
 * - DTO pasado directo a Service: pierde semántica de "intención", validación duplicada
 * - Command con execute(): requiere inyectar dependencias en el command (Service Locator anti-pattern)
 */
export class CreateHeroCommand {
  public readonly name: string;
  public readonly classType: HeroClassType;

  private constructor(name: string, classType: HeroClassType) {
    this.name = name;
    this.classType = classType;
  }

  /**
   * Factory method: crea comando desde DTO validado
   * PATRÓN: Factory Method
   */
  static fromDTO(dto: CreateHeroDTO): CreateHeroCommand {
    return new CreateHeroCommand(
      dto.name.trim(),
      dto.classType || HeroClass.WARRIOR
    );
  }
}