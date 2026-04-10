# 📋 Documentación Técnica: Reconstrucción de Plataforma para Barberías

## 1. Análisis de Capas

### Frontend (Angular 21+) (Rebuild)
- **Paradigma**: Standalone Components (evitar módulos pesados).
- **Estilos**: Angular Material para componentes base y SCSS modular para el diseño premium.
- **Estado**: RXJS (BehaviorSubjects) para manejar la sesión de usuario y el flujo de reserva del bot.

### Backend (Supabase)
- **Base de Datos**: PostgreSQL con aislamiento mediante RLS basándose en `negocio_id`.
- **Autenticación**: Email/Password nativo.
- **Edge Functions**: Todas las integraciones pesadas (Stripe, Gemini) deben ir aquí.

### Pagos (Stripe Connect)
- **Suscripciones**: Uso de Stripe Checkout para los planes del negocio (`price_id` fijos).
- **Depósitos de Citas**: Uso de Stripe Connect Express para que cada sucursal reciba su dinero.

---

## 2. Definición del Esquema (Postgres)

Para empezar "desde cero", estas son las tablas esenciales:

- **`negocios`**: Registro principal.
- **`usuarios_perfiles`**: Vincula `auth.users` con un `negocio_id` y un `rol` (owner/branch).
- **`sucursales`**: Detalles de cada local.
- **`empleados`**: Relacionados a una sucursal.
- **`servicios`**: Catálogo con precios y duración.
- **`citas`**: El corazón del sistema (Fecha, Hora, Estado, Pago).
- **`negocio_suscripciones`**: Control de acceso según el plan.

---

## 3. Flujo Crítico: El Chatbot de Reservas

El chatbot no debe ser un simple formulario, sino una secuencia conversacional:
1. **Saludo**: Identifica la sucursal.
2. **Servicios**: Carga dinámica desde Supabase.
3. **Paciencia**: El usuario elije empleado o "cualquiera".
4. **Calendario**: Consulta de slots disponibles (verificar choques de horarios).
5. **Confirmación**: Resumen visual.
6. **Pago**: Redirección a Stripe si el servicio requiere anticipo.

---

## 4. IA Generativa (Dashboards)
Implementar una función en `/supabase/functions/ai-chat` que reciba:
- Mensaje del usuario.
- Contexto del negocio (JSON de citas y ventas recientes).
- Responda usando Gemini 2.5 Flash para dar insights de negocio.

---

## 5. Próximos Pasos (Checklist)
- [ ] Configurar proyecto en Supabase Cloud.
- [ ] Ejecutar scripts SQL iniciales (Tablas).
- [ ] Crear nueva app Angular: `npx -y @angular/cli@latest new barber-app`.
- [ ] Configurar `environment.ts` con keys de Supabase.
- [ ] Implementar el `AuthService` y el primer Login.
