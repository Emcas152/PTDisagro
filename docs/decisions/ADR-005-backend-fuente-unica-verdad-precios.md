# ADR-005: Backend como Única Fuente de Verdad para Precios y Descuentos

## Estado
Aceptado

## Contexto
En aplicaciones cliente-servidor, los clientes web pueden ser interceptados o alterados (usando herramientas como Postman, DevTools o proxies HTTP) para modificar precios unitarios, subtotales o porcentajes de descuento antes de enviar la confirmación final de registro.

## Decisión
Se estableció el principio de arquitectura **Zero Trust en Precios del Cliente**:
1. **Payload del Cliente Reducido**: El Frontend envía únicamente `{ catalogItemId: string, quantity: number }` junto a los datos del participante. No se aceptan campos de precio, descuento ni subtotal en el payload de creación o actualización.
2. **Consulta a Base de Datos**: El backend consulta la base de datos para recuperar el precio oficial vigente de cada ítem seleccionado (`dbItem.priceCents`).
3. **Verificación de Disponibilidad**: Se valida en el servidor que cada ítem exista y mantenga `active: true`. Si un producto fue desactivado en el catálogo mientras el usuario navegaba, la transacción es rechazada con un mensaje claro (`400 Bad Request`).
4. **Cálculo Transaccional y Snapshots Inmutables**: El cálculo financiero es realizado exclusivamente en el servidor mediante `DiscountsService`. Al confirmarse el registro, se guardan snapshots inmutables del nombre (`nameSnapshot`) y del precio unitario (`unitPriceSnapshot`) en `RegistrationItem`, asegurando que futuros aumentos o cambios de precio en el catálogo no alteren retrospectivamente cotizaciones ya confirmadas.

## Consecuencias
- **Positivas**: Inmunidad total contra manipulación de precios desde el cliente, auditoría fidedigna e integridad contable.
- **Trade-offs**: Requiere una consulta adicional a base de datos al confirmar, lo cual está indexado y optimizado por clave primaria (`id in (...)`).
