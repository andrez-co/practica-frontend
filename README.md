<p align="center">
  <img src="public/favicon.svg" alt="Portal Ciudadano Logo" width="72" />
</p>

<h1 align="center">🏛️ Portal Ciudadano — Servicios Públicos y PQRS</h1>

<p align="center">
  <strong>Plataforma web institucional para la gestión integral de servicios públicos domiciliarios y radicación de Peticiones, Quejas, Reclamos y Sugerencias (PQRS) con inteligencia artificial.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8.2-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Supabase-BaaS-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Groq_AI-LLM-F55036?style=for-the-badge&logo=groq&logoColor=white" alt="Groq AI" />
</p>

---

## 📋 Descripción del Proyecto

**Portal Ciudadano** es una aplicación web full-stack diseñada para digitalizar y optimizar la interacción entre ciudadanos y entidades gubernamentales responsables de la prestación de servicios públicos domiciliarios en Colombia.

La plataforma permite a los ciudadanos:
- Consultar información detallada sobre **tres servicios públicos esenciales**: Agua y Alcantarillado, Recolección de Basura y Alumbrado Público.
- **Radicar PQRS** (Peticiones, Quejas, Reclamos y Sugerencias) con formulario digital vinculado a su cuenta.
- **Dar seguimiento en tiempo real** al estado de sus radicados, plazos legales y respuestas oficiales.
- **Adjuntar y consultar documentos PDF** como soporte normativo de cada trámite.

Y a los administradores:
- Gestionar **usuarios y PQRS** desde un dashboard especializado.
- Consultar un **asistente de IA** para auditoría normativa y análisis de radicados.

---

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Propósito |
|:---:|:---:|:---|
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="28" /> **React** | `19.2.8` | Librería de UI — Componentes funcionales con Hooks |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="28" /> **TypeScript** | `6.0.2` | Tipado estricto — Interfaces, genéricos y type-safety |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg" width="28" /> **Vite** | `8.2.0` | Bundler y Dev Server — HMR ultrarrápido |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/supabase/supabase-original.svg" width="28" /> **Supabase** | `2.116.0` | Backend-as-a-Service — Auth, PostgreSQL y Storage |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg" width="28" /> **CSS3** | — | Estilos personalizados — Variables CSS, glassmorphism, dark mode |
| 🤖 **Groq API** | — | Inferencia LLM — Chat IA para auditoría de PQRS |

---

## 🤖 Inteligencia Artificial

El portal integra un **asistente de IA** exclusivo para administradores que permite:

- **Auditoría normativa** basada en la Ley 142 de 1994 y la Ley 1755 de 2015 (Servicios Públicos Domiciliarios y Derecho de Petición en Colombia).
- **Análisis automatizado de PQRS** radicadas: resúmenes estadísticos, detección de patrones y categorización.
- **Consulta de usuarios registrados** y sus históricos de radicados.
- **Procesamiento de documentos adjuntos** (simulación de OCR para archivos de texto, imágenes y PDF).

### Proveedores y Modelos

| Proveedor | Modelos utilizados | Propósito |
|:---|:---|:---|
| **Groq** (vía proxy Vite) | `qwen/qwen3.8-27b`, `openai/gpt-oss-20b`, `qwen/qwen3.6-27b` | Chat de auditoría administrativa — fallback automático entre modelos |

La configuración de la IA utiliza **temperatura 0.3** para respuestas objetivas y concisas, con **instrucciones de sistema** que incluyen el contexto en tiempo real de usuarios y PQRS registrados.

---

## 👥 Roles y Permisos

### 🧑‍💼 Ciudadano (Usuario Público)

| Funcionalidad | Descripción |
|:---|:---|
| **Registro / Login** | Autenticación con email + contraseña o Google OAuth vía Supabase Auth |
| **Consultar servicios** | Navegar las 3 tarjetas de servicios públicos con información detallada |
| **Radicar PQRS** | Crear nueva petición, queja, reclamo o sugerencia vinculada a su cuenta |
| **Seguimiento de PQRS** | Ver estado (En trámite / Resuelto), respuestas oficiales y plazos legales |
| **Editar / Eliminar PQRS** | Modificar o eliminar radicados propios antes de resolución |
| **Adjuntar documentos** | Subir y consultar PDFs de soporte normativo |
| **Perfil de usuario** | Gestionar nombre, avatar y contraseña desde el modal de perfil |

### 🛡️ Administrador

| Funcionalidad | Descripción |
|:---|:---|
| **Dashboard completo** | Vista panorámica de todos los usuarios y todos los PQRS del sistema |
| **Gestión de PQRS** | Responder, cambiar estado, eliminar cualquier radicado |
| **Gestión de usuarios** | Consultar historial de radicados por usuario, ver roles |
| **Chat con IA** | Asistente de auditoría con contexto de datos del sistema en tiempo real |
| **Análisis normativo** | Consultar leyes y normativas aplicables a cada caso |

> **Nota:** El acceso al panel de administración está restringido a cuentas autorizadas por email.

---

## 📁 Estructura del Proyecto

```
proyecto-domingos/
├── public/
│   ├── favicon.svg              # Ícono del portal (escudo institucional)
│   └── icons.svg                # Sprite de íconos SVG
├── src/
│   ├── components/
│   │   ├── AdminAiChat.tsx      # Chat con IA (Groq) para administradores
│   │   ├── AdminAiChat.css
│   │   ├── AdminDashboard.tsx   # Dashboard completo de administración
│   │   ├── AdminDashboard.css
│   │   ├── AuthModal.tsx        # Modal de login/registro (Supabase Auth)
│   │   ├── AuthModal.css
│   │   ├── ConfirmDeleteModal.tsx  # Modal de confirmación de eliminación
│   │   ├── ConfirmDeleteModal.css
│   │   ├── CreatePqrsModal.tsx  # Formulario para radicar nueva PQRS
│   │   ├── CreatePqrsModal.css
│   │   ├── EditPqrsModal.tsx    # Formulario para editar PQRS existente
│   │   ├── FastPdfViewerModal.tsx  # Visor rápido de PDFs con Blob URL
│   │   ├── FastPdfViewerModal.css
│   │   ├── ProfileModal.tsx     # Modal de perfil de usuario
│   │   ├── ProfileModal.css
│   │   ├── ServiceDetailModal.tsx  # Tipos e interfaz de detalle de servicio
│   │   ├── ServiceDetailModal.css
│   │   ├── ServiceDetailPage.tsx   # Página completa de detalle por servicio
│   │   ├── ServiceDetailPage.css
│   │   ├── TarjetaTramite.tsx   # Tarjeta visual de cada servicio público
│   │   └── TarjetaTramite.css
│   ├── context/
│   │   └── AuthContext.tsx      # Context global de autenticación (Supabase)
│   ├── lib/
│   │   └── supabaseClient.ts   # Singleton de Supabase Client
│   ├── utils/
│   │   └── pdfHelper.ts        # Utilidades para optimización de PDFs (Blob cache)
│   ├── App.tsx                  # Componente raíz — Enrutamiento y layout
│   ├── App.css                  # Estilos globales del portal
│   ├── index.css                # Reset y variables CSS base
│   └── main.tsx                 # Punto de entrada — ReactDOM.createRoot
├── .env                         # Variables de entorno (Supabase + API Keys)
├── .env.example                 # Plantilla de variables de entorno
├── index.html                   # HTML principal del SPA
├── vite.config.ts               # Configuración de Vite (proxy Groq API)
├── tsconfig.json                # Configuración base TypeScript
├── tsconfig.app.json            # Configuración TypeScript para la app
├── tsconfig.node.json           # Configuración TypeScript para Node
├── package.json                 # Dependencias y scripts
└── supabase_migration_direccion.sql  # Migración SQL para campo dirección
```

---

## 🚀 Cómo Ejecutar el Proyecto

### Prerrequisitos

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- Una cuenta de **Supabase** con un proyecto configurado

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/proyecto-domingos.git
cd proyecto-domingos

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase y API keys
```

### Variables de Entorno Requeridas

| Variable | Descripción |
|:---|:---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase (Settings → API → Project URL) |
| `VITE_SUPABASE_ANON_KEY` | Clave pública anon de Supabase (Settings → API → anon public) |
| `VITE_GROQ_API_KEY` | API Key de Groq para el asistente de IA (opcional) |

### Ejecución en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

### Build de Producción

```bash
npm run build
npm run preview
```

### Linter

```bash
npm run lint
```

---

## 🗄️ Base de Datos (Supabase)

El proyecto utiliza las siguientes tablas en PostgreSQL:

| Tabla | Propósito |
|:---|:---|
| `ciudadanos` | Registro de usuarios/ciudadanos (sincronizado con Supabase Auth) |
| `pqrs` | Radicados de PQRS con estado, categoría, descripción y respuesta oficial |
| `documentos_formativos` | Documentos PDF adjuntos vinculados a radicados |
| `documentos_normativos` | Documentos normativos de respaldo (fallback) |

---

## 🔒 Autenticación

La autenticación se gestiona completamente a través de **Supabase Auth**:

- **Email + Contraseña**: Registro y login tradicional
- **Google OAuth**: Login con cuenta de Google (un clic)
- **Persistencia de sesión**: Token almacenado en `localStorage` con auto-refresh
- **Sincronización de perfil**: El nombre y avatar del usuario se sincronizan con la tabla `ciudadanos`

---

## 📄 Licencia

Este proyecto fue desarrollado como parte de un programa académico (Diplomado). Todos los derechos reservados.

---

<p align="center">
  Desarrollado con ❤️ usando React, TypeScript, Supabase y Groq AI
</p>
