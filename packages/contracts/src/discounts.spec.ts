/**
 * ============================================================================
 * PRUEBAS UNITARIAS: MOTOR DE REGLAS DE DESCUENTO - DISAGRO
 * ============================================================================
 *
 * Este archivo valida exhaustivamente todas las condiciones exigidas por el
 * documento de requerimientos técnicos, cubriendo casos borde y el escenario
 * oficial de consolidación.
 */

import { describe, expect, it } from 'vitest'
import {
  calculateProductDiscount,
  calculatePromotionalTotals,
  calculateServiceDiscount,
} from './discounts'

describe('Motor de Descuentos - Reglas de Servicios', () => {
  /**
   * Caso 1: 0 servicios seleccionados
   * Regla: Menos de 2 servicios -> 0%
   */
  it('debe otorgar 0% de descuento cuando se seleccionan 0 servicios', () => {
    const resultado = calculateServiceDiscount(0, 0)
    expect(resultado.percentage).toBe(0)
    expect(resultado.discountCents).toBe(0)
  })

  /**
   * Caso 2: 1 servicio seleccionado
   * Regla: Menos de 2 servicios -> 0%
   */
  it('debe otorgar 0% de descuento cuando se selecciona 1 servicio', () => {
    const resultado = calculateServiceDiscount(1, 80000) // Q800.00
    expect(resultado.percentage).toBe(0)
    expect(resultado.discountCents).toBe(0)
  })

  /**
   * Caso 3: 2 servicios con subtotal menor a Q1,500 (ej. Q1,499.00 = 149,900 centavos)
   * Regla: >= 2 servicios y subtotal <= Q1,500 -> 3%
   */
  it('debe otorgar 3% de descuento cuando se seleccionan 2 servicios con subtotal menor a Q1,500', () => {
    const subtotalCentavos = 149900 // Q1,499.00
    const resultado = calculateServiceDiscount(2, subtotalCentavos)
    expect(resultado.percentage).toBe(3)
    // 3% de 149900 = 4497 centavos (Q44.97)
    expect(resultado.discountCents).toBe(4497)
  })

  /**
   * Caso 4: 2 servicios con subtotal exactamente Q1,500 (150,000 centavos)
   * REQUISITO CLAVE: La condición es estrictamente "mayor a Q1,500", por lo tanto
   * exactamente Q1,500 debe mantener 3% y NO subir a 5%.
   */
  it('debe otorgar 3% de descuento cuando se seleccionan 2 servicios con subtotal exactamente Q1,500', () => {
    const subtotalCentavos = 150000 // Q1,500.00 exactos
    const resultado = calculateServiceDiscount(2, subtotalCentavos)
    expect(resultado.percentage).toBe(3)
    // 3% de 150000 = 4500 centavos (Q45.00)
    expect(resultado.discountCents).toBe(4500)
  })

  /**
   * Caso 5: 2 servicios con subtotal mayor a Q1,500 (ej. Q1,500.01 o Q1,700)
   * Regla: >= 2 servicios y subtotal > Q1,500 -> 5%
   */
  it('debe otorgar 5% de descuento cuando se seleccionan 2 servicios con subtotal estrictamente mayor a Q1,500', () => {
    const subtotalCentavos = 170000 // Q1,700.00
    const resultado = calculateServiceDiscount(2, subtotalCentavos)
    expect(resultado.percentage).toBe(5)
    // 5% de 170000 = 8500 centavos (Q85.00)
    expect(resultado.discountCents).toBe(8500)
  })

  /**
   * Caso 6: Más de 2 servicios con subtotal mayor a Q1,500
   * Regla: >= 2 servicios y subtotal > Q1,500 -> 5%
   */
  it('debe otorgar 5% de descuento cuando se seleccionan más de 2 servicios con subtotal mayor a Q1,500', () => {
    const subtotalCentavos = 300000 // Q3,000.00
    const resultado = calculateServiceDiscount(4, subtotalCentavos)
    expect(resultado.percentage).toBe(5)
    expect(resultado.discountCents).toBe(15000) // Q150.00
  })
})

describe('Motor de Descuentos - Reglas de Productos', () => {
  /**
   * Caso 1: 0 productos
   * Regla: Menos de 3 productos -> 0%
   */
  it('debe otorgar 0% de descuento con 0 productos', () => {
    const resultado = calculateProductDiscount(0, 0)
    expect(resultado.percentage).toBe(0)
    expect(resultado.discountCents).toBe(0)
  })

  /**
   * Caso 2: 1 producto
   * Regla: Menos de 3 productos -> 0%
   */
  it('debe otorgar 0% de descuento con 1 producto', () => {
    const resultado = calculateProductDiscount(1, 35000)
    expect(resultado.percentage).toBe(0)
    expect(resultado.discountCents).toBe(0)
  })

  /**
   * Caso 3: 2 productos
   * Regla: Menos de 3 productos -> 0%
   */
  it('debe otorgar 0% de descuento con 2 productos', () => {
    const resultado = calculateProductDiscount(2, 70000)
    expect(resultado.percentage).toBe(0)
    expect(resultado.discountCents).toBe(0)
  })

  /**
   * Caso 4: 3 productos
   * Regla: 3 o 4 productos -> 3%
   */
  it('debe otorgar 3% de descuento con 3 productos seleccionados', () => {
    const subtotalCentavos = 100000 // Q1,000.00
    const resultado = calculateProductDiscount(3, subtotalCentavos)
    expect(resultado.percentage).toBe(3)
    expect(resultado.discountCents).toBe(3000) // Q30.00
  })

  /**
   * Caso 5: 4 productos
   * Regla: 3 o 4 productos -> 3%
   */
  it('debe otorgar 3% de descuento con 4 productos seleccionados', () => {
    const subtotalCentavos = 120000 // Q1,200.00
    const resultado = calculateProductDiscount(4, subtotalCentavos)
    expect(resultado.percentage).toBe(3)
    expect(resultado.discountCents).toBe(3600) // Q36.00
  })

  /**
   * Caso 6: 5 productos
   * Regla: 5 productos o más -> 5%
   */
  it('debe otorgar 5% de descuento con 5 productos seleccionados', () => {
    const subtotalCentavos = 100000 // Q1,000.00
    const resultado = calculateProductDiscount(5, subtotalCentavos)
    expect(resultado.percentage).toBe(5)
    expect(resultado.discountCents).toBe(5000) // Q50.00
  })

  /**
   * Caso 7: Más de 5 productos
   * Regla: 5 productos o más -> 5%
   */
  it('debe otorgar 5% de descuento con más de 5 productos seleccionados', () => {
    const subtotalCentavos = 200000 // Q2,000.00
    const resultado = calculateProductDiscount(8, subtotalCentavos)
    expect(resultado.percentage).toBe(5)
    expect(resultado.discountCents).toBe(10000) // Q100.00
  })
})

describe('Motor de Descuentos - Escenario Oficial Integrado (Especificación)', () => {
  /**
   * Ejemplo obligatorio del requerimiento:
   * Servicios:
   *  - Servicio A: Q800.00
   *  - Servicio B: Q900.00
   *  - Subtotal: Q1,700.00 -> Descuento: 5% -> Ahorro: Q85.00
   *
   * Productos:
   *  - 5 productos con subtotal Q1,000.00 -> Descuento: 5% -> Ahorro: Q50.00
   *
   * Consolidado:
   *  - Subtotal general: Q2,700.00
   *  - Ahorro total: Q135.00
   *  - Total estimado: Q2,565.00
   */
  it('debe calcular exactamente los valores del ejemplo oficial de la especificación técnica', () => {
    const items = [
      {
        catalogItemId: 'srv-1',
        name: 'Servicio A',
        priceCents: 80000, // Q800.00
        quantity: 1,
        type: 'SERVICE' as const,
      },
      {
        catalogItemId: 'srv-2',
        name: 'Servicio B',
        priceCents: 90000, // Q900.00
        quantity: 1,
        type: 'SERVICE' as const,
      },
      {
        catalogItemId: 'prd-1',
        name: 'Producto 1',
        priceCents: 20000, // Q200.00
        quantity: 2, // 2 unidades
        type: 'PRODUCT' as const,
      },
      {
        catalogItemId: 'prd-2',
        name: 'Producto 2',
        priceCents: 20000, // Q200.00
        quantity: 3, // 3 unidades -> Total productos = 5 unidades (Q1,000.00)
        type: 'PRODUCT' as const,
      },
    ]

    const resultado = calculatePromotionalTotals(items)

    // Validaciones de Servicios
    expect(resultado.servicesCount).toBe(2)
    expect(resultado.serviceSubtotal).toBe(1700)
    expect(resultado.serviceDiscountPercentage).toBe(5)
    expect(resultado.serviceDiscountAmount).toBe(85)

    // Validaciones de Productos
    expect(resultado.productsCount).toBe(5)
    expect(resultado.productSubtotal).toBe(1000)
    expect(resultado.productDiscountPercentage).toBe(5)
    expect(resultado.productDiscountAmount).toBe(50)

    // Validaciones Consolidado General
    expect(resultado.generalSubtotal).toBe(2700)
    expect(resultado.totalSavingsAmount).toBe(135)
    expect(resultado.estimatedTotal).toBe(2565)
  })
})
