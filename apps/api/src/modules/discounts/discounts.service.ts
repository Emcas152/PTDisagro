/**
 * ============================================================================
 * SERVICIO DE DESCUENTOS Y POLÍTICAS PROMOCIONALES
 * ============================================================================
 *
 * Actúa como la única fuente de verdad en el backend para el cálculo
 * de descuentos, asegurando consistencia matemática sin confiar en datos
 * de precios enviados por el cliente.
 */

import { Injectable } from '@nestjs/common'
import {
  CalculationItemInput,
  DiscountCalculationResult,
  calculatePromotionalTotals,
} from '@ptdisagro/contracts'

@Injectable()
export class DiscountsService {
  /**
   * Ejecuta el motor puro de cálculo de descuentos.
   *
   * @param items - Lista de ítems con sus precios en centavos extraídos de la base de datos
   * @returns Desglose financiero determinista
   */
  calculate(items: CalculationItemInput[]): DiscountCalculationResult {
    return calculatePromotionalTotals(items)
  }
}
