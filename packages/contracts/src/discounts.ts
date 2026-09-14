/**
 * ============================================================================
 * MOTOR DE CÁLCULO DE DESCUENTOS Y PROMOCIONES - FERIA DISAGRO
 * ============================================================================
 *
 * Este módulo contiene la lógica de negocio pura y determinista para calcular
 * los descuentos aplicables a Servicios y Productos.
 *
 * Principios técnicos aplicados:
 * 1. Todos los cálculos monetarios se procesan en centavos enteros (1 Q = 100 centavos)
 *    para evitar discrepancias e imprecisiones de punto flotante binario (IEEE 754).
 * 2. Las reglas de servicios y productos son independientes entre sí.
 * 3. Se aplica el descuento más alto aplicable dentro de cada categoría.
 * 4. La condición de servicios es estrictamente mayor a Q1,500 (> 150,000 centavos).
 */

/**
 * Representa la estructura de entrada de un ítem para el cálculo
 */
export interface CalculationItemInput {
  catalogItemId: string
  name?: string
  priceCents: number
  quantity: number
  type: 'SERVICE' | 'PRODUCT'
}

/**
 * Resultado integral del desglose financiero de descuentos y totales
 */
export interface DiscountCalculationResult {
  // Cantidades totales seleccionadas
  servicesCount: number
  productsCount: number

  // Subtotales en centavos enteros
  serviceSubtotalCents: number
  productSubtotalCents: number
  generalSubtotalCents: number

  // Subtotales convertidos a Quetzales con decimales
  serviceSubtotal: number
  productSubtotal: number
  generalSubtotal: number

  // Desglose del descuento de Servicios
  serviceDiscountPercentage: number
  serviceDiscountCents: number
  serviceDiscountAmount: number

  // Desglose del descuento de Productos
  productDiscountPercentage: number
  productDiscountCents: number
  productDiscountAmount: number

  // Ahorro total acumulado y monto final estimado
  totalSavingsCents: number
  totalSavingsAmount: number
  estimatedTotalCents: number
  estimatedTotal: number
}

/**
 * Calcula el porcentaje y monto de descuento aplicable a la categoría de SERVICIOS.
 *
 * Reglas de negocio evaluadas:
 * 1. Menos de 2 servicios (< 2) -> 0% de descuento.
 * 2. 2 o más servicios (>= 2) con subtotal <= Q1,500 -> 3% de descuento.
 * 3. 2 o más servicios (>= 2) con subtotal estrictamente mayor a Q1,500 (> 150,000 centavos) -> 5% de descuento.
 *
 * @param selectedServicesCount - Cantidad de servicios seleccionados por el cliente
 * @param serviceSubtotalCents - Subtotal acumulado de los servicios en centavos
 * @returns Objeto con el porcentaje aplicado (0, 3 o 5) y el monto descontado en centavos
 */
export function calculateServiceDiscount(
  selectedServicesCount: number,
  serviceSubtotalCents: number,
): { percentage: number; discountCents: number } {
  // Caso 1: Si el cliente selecciona menos de 2 servicios, no recibe descuento
  if (selectedServicesCount < 2) {
    return { percentage: 0, discountCents: 0 }
  }

  // Caso 3: Si selecciona 2 o más y el subtotal es estrictamente mayor a Q1,500 (150,000 centavos)
  // NOTA ARQUITECTÓNICA: Es estrictamente mayor (>), por lo que Q1,500 exactos no califica para 5%
  if (serviceSubtotalCents > 150000) {
    const percentage = 5
    const discountCents = Math.round(serviceSubtotalCents * (percentage / 100))
    return { percentage, discountCents }
  }

  // Caso 2: Si selecciona 2 o más servicios y su suma es menor o igual a Q1,500
  const percentage = 3
  const discountCents = Math.round(serviceSubtotalCents * (percentage / 100))
  return { percentage, discountCents }
}

/**
 * Calcula el porcentaje y monto de descuento aplicable a la categoría de PRODUCTOS.
 *
 * Reglas de negocio evaluadas:
 * 1. Menos de 3 productos (< 3) -> 0% de descuento.
 * 2. 3 o 4 productos (3 <= unidades <= 4) -> 3% de descuento.
 * 3. 5 o más productos (>= 5 unidades) -> 5% de descuento.
 *
 * @param selectedProductsTotalUnits - Suma de unidades de productos seleccionados
 * @param productSubtotalCents - Subtotal acumulado de los productos en centavos
 * @returns Objeto con el porcentaje aplicado (0, 3 o 5) y el monto descontado en centavos
 */
export function calculateProductDiscount(
  selectedProductsTotalUnits: number,
  productSubtotalCents: number,
): { percentage: number; discountCents: number } {
  // Caso 1: Si selecciona menos de 3 productos en total, no aplica descuento
  if (selectedProductsTotalUnits < 3) {
    return { percentage: 0, discountCents: 0 }
  }

  // Caso 2: Si selecciona entre 3 y 4 productos en total, aplica 3%
  if (selectedProductsTotalUnits === 3 || selectedProductsTotalUnits === 4) {
    const percentage = 3
    const discountCents = Math.round(productSubtotalCents * (percentage / 100))
    return { percentage, discountCents }
  }

  // Caso 3: Si selecciona 5 productos o más, aplica el 5%
  const percentage = 5
  const discountCents = Math.round(productSubtotalCents * (percentage / 100))
  return { percentage, discountCents }
}

/**
 * Función orquestadora que recibe los ítems seleccionados con sus precios oficiales de base de datos,
 * calcula subtotales, aplica descuentos independientes por categoría y determina el total estimado final.
 *
 * @param items - Lista de ítems verificados con precios en centavos y cantidades
 * @returns Objeto con el desglose financiero completo listo para el contrato de la API y el frontend
 */
export function calculatePromotionalTotals(
  items: CalculationItemInput[],
): DiscountCalculationResult {
  let serviceSubtotalCents = 0
  let productSubtotalCents = 0
  let servicesCount = 0
  let productsCount = 0

  // Recorrer los ítems para segregar subtotales y conteos de Servicios vs Productos
  for (const item of items) {
    const itemTotalCents = item.priceCents * item.quantity

    if (item.type === 'SERVICE') {
      servicesCount += item.quantity
      serviceSubtotalCents += itemTotalCents
    } else if (item.type === 'PRODUCT') {
      productsCount += item.quantity
      productSubtotalCents += itemTotalCents
    }
  }

  // 1. Cálculo del descuento para servicios (independiente)
  const serviceDiscount = calculateServiceDiscount(
    servicesCount,
    serviceSubtotalCents,
  )

  // 2. Cálculo del descuento para productos (independiente)
  const productDiscount = calculateProductDiscount(
    productsCount,
    productSubtotalCents,
  )

  // 3. Cálculos de consolidación general
  const generalSubtotalCents = serviceSubtotalCents + productSubtotalCents
  const totalSavingsCents =
    serviceDiscount.discountCents + productDiscount.discountCents
  const estimatedTotalCents = generalSubtotalCents - totalSavingsCents

  return {
    servicesCount,
    productsCount,

    serviceSubtotalCents,
    productSubtotalCents,
    generalSubtotalCents,

    // Conversión a valores en Quetzales para compatibilidad con vistas
    serviceSubtotal: serviceSubtotalCents / 100,
    productSubtotal: productSubtotalCents / 100,
    generalSubtotal: generalSubtotalCents / 100,

    serviceDiscountPercentage: serviceDiscount.percentage,
    serviceDiscountCents: serviceDiscount.discountCents,
    serviceDiscountAmount: serviceDiscount.discountCents / 100,

    productDiscountPercentage: productDiscount.percentage,
    productDiscountCents: productDiscount.discountCents,
    productDiscountAmount: productDiscount.discountCents / 100,

    totalSavingsCents,
    totalSavingsAmount: totalSavingsCents / 100,
    estimatedTotalCents,
    estimatedTotal: estimatedTotalCents / 100,
  }
}

/**
 * Convierte un monto numérico en Quetzales a una cadena con formato de moneda guatemalteca (ej. Q. 1,500.00).
 *
 * @param amountInQuetzales - Monto numérico en Quetzales
 * @returns Cadena formateada amigable para el usuario
 */
export function formatQuetzales(amountInQuetzales: number): string {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(amountInQuetzales)
    .replace('GTQ', 'Q.')
    .trim()
}
