# ADR-003: Interpretación de Descuentos y Regla Estrictamente Mayor a Q1,500

## Estado
Aceptado

## Contexto
El requerimiento de negocio especifica:
- Servicios:
  1. Menos de 2 servicios: 0%.
  2. 2 o más servicios: 3%.
  3. 2 o más servicios y la suma de sus precios es mayor a Q1,500: 5%.
- Productos:
  1. Menos de 3 productos: 0%.
  2. 3 o 4 productos: 3%.
  3. 5 productos o más: 5%.

Existía la ambigüedad habitual en implementaciones de comercio electrónico sobre si "mayor a Q1,500" incluye o no el valor exacto de Q1,500.00.

## Decisión
1. **Condición Estricta**: Se definió e implementó formalmente que la condición es **estrictamente mayor a Q1,500.00** (`serviceSubtotalCents > 150000`). Un cliente con exactamente Q1,500.00 en servicios recibirá un 3% de descuento. Para calificar al 5%, el subtotal debe ser al menos Q1,500.01.
2. **Cálculos en Centavos Enteros**: Para evitar imprecisiones de representación en coma flotante (estándar IEEE 754), todas las sumas, porcentajes y deducciones se calculan en números enteros en centavos y se redondean utilizando `Math.round(subtotalCents * (percentage / 100))`.
3. **Independencia de Categorías**: Los descuentos de servicios y productos no se mezclan ni transfieren. El descuento de servicios aplica únicamente al subtotal de servicios, y el de productos al de productos.

## Consecuencias
- **Positivas**: Reglas completamente deterministas, verificadas por una suite de pruebas unitarias al 100% de cobertura de casos borde.
- **Trade-offs**: Los clientes deben ser informados claramente en la interfaz cuando están cerca del umbral de Q1,500.
