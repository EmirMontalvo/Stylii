-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.cita_servicios (
  cita_id bigint NOT NULL,
  servicio_id bigint NOT NULL,
  precio_cobrado numeric NOT NULL,
  CONSTRAINT cita_servicios_pkey PRIMARY KEY (cita_id, servicio_id),
  CONSTRAINT cita_servicios_cita_id_fkey FOREIGN KEY (cita_id) REFERENCES public.citas(id),
  CONSTRAINT cita_servicios_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES public.servicios(id)
);
CREATE TABLE public.citas (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  negocio_id bigint,
  sucursal_id bigint,
  empleado_id bigint,
  cliente_nombre text NOT NULL,
  cliente_telefono text,
  cliente_email text,
  fecha_hora_inicio timestamp with time zone NOT NULL,
  fecha_hora_fin timestamp with time zone NOT NULL,
  estado text DEFAULT 'pendiente'::text CHECK (estado = ANY (ARRAY['pendiente'::text, 'confirmada'::text, 'cancelada'::text, 'completada'::text])),
  pagado boolean DEFAULT false,
  monto_total numeric,
  stripe_payment_id text,
  tipo_reserva text DEFAULT 'web'::text CHECK (tipo_reserva = ANY (ARRAY['web'::text, 'whatsapp'::text, 'manual'::text])),
  notas text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT citas_pkey PRIMARY KEY (id),
  CONSTRAINT citas_negocio_id_fkey FOREIGN KEY (negocio_id) REFERENCES public.negocios(id),
  CONSTRAINT citas_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id),
  CONSTRAINT citas_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleados(id)
);
CREATE TABLE public.empleados (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  sucursal_id bigint,
  negocio_id bigint,
  nombre text NOT NULL,
  especialidad text,
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT empleados_pkey PRIMARY KEY (id),
  CONSTRAINT empleados_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id),
  CONSTRAINT empleados_negocio_id_fkey FOREIGN KEY (negocio_id) REFERENCES public.negocios(id)
);
CREATE TABLE public.negocio_suscripciones (
  negocio_id bigint NOT NULL,
  plan_id integer,
  estado text CHECK (estado = ANY (ARRAY['trial'::text, 'active'::text, 'past_due'::text, 'canceled'::text])),
  fecha_fin_periodo timestamp with time zone,
  stripe_subscription_id text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT negocio_suscripciones_pkey PRIMARY KEY (negocio_id),
  CONSTRAINT negocio_suscripciones_negocio_id_fkey FOREIGN KEY (negocio_id) REFERENCES public.negocios(id),
  CONSTRAINT negocio_suscripciones_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.planes(id)
);
CREATE TABLE public.negocios (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nombre text NOT NULL,
  stripe_customer_id text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT negocios_pkey PRIMARY KEY (id)
);
CREATE TABLE public.planes (
  id integer NOT NULL,
  codigo text NOT NULL UNIQUE,
  nombre text NOT NULL,
  precio_mxn numeric NOT NULL,
  limite_sucursales integer NOT NULL,
  limite_empleados_sucursal integer NOT NULL,
  descripcion text,
  activo boolean DEFAULT true,
  CONSTRAINT planes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.servicios (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  sucursal_id bigint,
  negocio_id bigint,
  nombre text NOT NULL,
  precio_base numeric NOT NULL,
  duracion_minutos integer NOT NULL,
  imagen_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT servicios_pkey PRIMARY KEY (id),
  CONSTRAINT servicios_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id),
  CONSTRAINT servicios_negocio_id_fkey FOREIGN KEY (negocio_id) REFERENCES public.negocios(id)
);
CREATE TABLE public.sucursales (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  negocio_id bigint,
  nombre text NOT NULL,
  direccion text,
  telefono text,
  stripe_account_id text,
  onboarding_completo boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sucursales_pkey PRIMARY KEY (id),
  CONSTRAINT sucursales_negocio_id_fkey FOREIGN KEY (negocio_id) REFERENCES public.negocios(id)
);
CREATE TABLE public.usuarios_perfiles (
  id uuid NOT NULL,
  negocio_id bigint,
  sucursal_id bigint,
  nombre_completo text,
  email text UNIQUE,
  rol text CHECK (rol = ANY (ARRAY['owner'::text, 'branch'::text, 'admin'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT usuarios_perfiles_pkey PRIMARY KEY (id),
  CONSTRAINT usuarios_perfiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT usuarios_perfiles_negocio_id_fkey FOREIGN KEY (negocio_id) REFERENCES public.negocios(id),
  CONSTRAINT usuarios_perfiles_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id)
);