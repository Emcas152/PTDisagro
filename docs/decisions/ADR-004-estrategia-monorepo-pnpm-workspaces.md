# ADR-004: Estrategia de Monorepo con pnpm Workspaces

## Estado
Aceptado

## Contexto
El proyecto requiere asumir las responsabilidades de dos equipos diferenciados (Frontend y Backend), compartiendo contratos de API, DTOs, esquemas Zod de validación y la política de descuentos, asegurando al mismo tiempo pipelines de CI/CD independientes y dependencias reproducibles.

## Decisión
Se estructuró el proyecto como un monorepo utilizando **pnpm workspaces**:
- `packages/contracts`: Biblioteca compartida sin dependencias de frameworks web. Contiene tipos TypeScript, enumeraciones, esquemas Zod y el motor puro de cálculo de descuentos.
- `apps/api`: Aplicación de Backend construida sobre NestJS 10 y Fastify.
- `apps/web`: Aplicación de Frontend construida sobre Next.js 14, Material UI v5 y Tailwind CSS.

### Beneficios de pnpm:
1. **Instalaciones Rápidas y Eficientes**: pnpm utiliza enlaces duros (hard links) y almacenamiento global basado en contenido (content-addressable storage), reduciendo drásticamente el uso de espacio en disco y el tiempo de descarga en CI.
2. **Prevención de Phantoms Dependencies**: A diferencia de npm o yarn clásico, pnpm no aplana (hoist) arbitrariamente el árbol de módulos, previniendo que un paquete importe accidentalmente dependencias no declaradas.
3. **Control de Versiones Unificado**: Permite ejecutar comandos cruzados (`pnpm --parallel dev`, `pnpm -r typecheck`, `pnpm -r test`) desde la raíz del repositorio.

## Consecuencias
- **Positivas**: Los contratos tipados entre frontend y backend se sincronizan en tiempo de compilación. Un cambio en un DTO alerta inmediatamente a ambos equipos.
- **Trade-offs**: La configuración inicial de Docker requiere copiar los archivos `pnpm-workspace.yaml` y los paquetes relacionados en etapas multi-stage.
