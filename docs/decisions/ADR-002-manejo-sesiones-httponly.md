# ADR-002: Manejo de Sesiones Administrativas Seguras (Cookies HttpOnly y Hash SHA-256)

## Estado
Aceptado

## Contexto
El panel administrativo de Disagro permite consultar participantes, modificar precios y exportar información de clientes. Guardar tokens JWT o identificadores de sesión en `localStorage` o `sessionStorage` expone las credenciales a ataques de Cross-Site Scripting (XSS).

## Decisión
Se implementó un esquema de autenticación con sesiones persistentes en base de datos y cookies `HttpOnly`:
1. **Emisión de Token**: Al autenticarse satisfactoriamente con correo y contraseña cifrada con `bcrypt` (10 rounds de salt), el servidor genera un token criptográfico seguro de 64 bytes (`crypto.randomBytes(64).toString('hex')`).
2. **Hash en Base de Datos**: El backend almacena **únicamente el hash SHA-256** del token en la tabla `sessions` junto con fecha de expiración, IP y User-Agent. Si la base de datos sufriera una brecha, los tokens reales nunca quedan expuestos.
3. **Transporte en Cookie HttpOnly**: El token en texto plano se transmite exclusivamente a través de la cookie `disagro_session` configurada con:
   - `httpOnly: true` (inaccesible desde JavaScript del navegador).
   - `secure: true` en producción (transmitida únicamente sobre HTTPS).
   - `sameSite: 'lax'` (protección contra ataques Cross-Site Request Forgery / CSRF).
   - `path: '/'`.
4. **Revocación Inmediata**: Al cerrar sesión (`POST /api/v1/auth/logout`), el registro de sesión en la base de datos se marca con `revokedAt = now()` y la cookie es limpiada inmediatamente en el cliente.

## Consecuencias
- **Positivas**: Máxima protección contra robo de credenciales vía XSS, trazabilidad por IP/dispositivo y capacidad de revocación de sesiones en tiempo real.
- **Trade-offs**: Requiere verificar la validez de la sesión en la base de datos mediante el `AuthGuard` (mitigado con índices sobre `tokenHash`).
