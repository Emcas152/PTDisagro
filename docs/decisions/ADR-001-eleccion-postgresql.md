# ADR-001: Elección de PostgreSQL y Prisma ORM

## Estado
Aceptado

## Contexto
La plataforma de promociones de la Feria Disagro administra información financiera, reservas de inventario/asistencia, snapshots inmutables de precios unitarios y auditoría de operadores. Se requería un motor de base de datos con soporte estricto de transacciones ACID, integridad referencial y precisión en operaciones monetarias.

## Decisión
Se seleccionó **PostgreSQL 16** gestionado mediante **Prisma ORM**.

### Razones Técnicas:
1. **Transacciones ACID**: La confirmación de un registro involucra la creación/actualización del cliente, la inserción del registro maestro con subtotales y la creación de múltiples ítems con snapshots inmutables dentro de una única transacción (`prisma.$transaction`).
2. **Tipos de Datos Monetarios**: PostgreSQL soporta de forma nativa `DECIMAL(10, 2)`, lo que junto con el procesamiento en centavos enteros (`priceCents Int`) previene errores de redondeo de punto flotante IEEE 754.
3. **Restricciones e Índices**: Se implementaron restricciones de unicidad sobre `confirmationCode`, `idempotencyKey` y `email`, así como índices compuestos sobre `[type, active]` para acelerar consultas de catálogo.
4. **Seguridad y Tipado con Prisma**: Prisma ORM genera un cliente TypeScript fuertemente tipado que previene inyecciones SQL y reduce discrepancias entre el esquema relacional y el código del servidor.

## Consecuencias
- **Positivas**: Integridad de datos garantizada, prevención de inconsistencias en concurrencia y consultas optimizadas.
- **Trade-offs**: Requiere levantar un contenedor PostgreSQL para ejecución local, lo cual se resuelve mediante `docker-compose.yml`.
