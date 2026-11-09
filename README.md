# 🚀 LabHub - Sistema Universitario de Préstamos y Reservas de Laboratorio

Sistema integral de gestión de reservas de equipos de laboratorio universitario diseñado con arquitectura **Fullstack TypeScript**, autenticación segura JWT con control de bloqueos por fuerza bruta, transacciones ACID para evitar colisiones de horarios, y despliegue contenerizado mediante **Docker & Docker Compose**.

---

## 🛠️ Stack Tecnológico (Según Especificación)

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, QR Generator & Scanner, jsPDF.
- **Backend:** NestJS, TypeScript, Passport JWT, Class Validator, Helmet.
- **ORM & Base de Datos:** Prisma ORM, PostgreSQL 16.
- **Testing:** Vitest, Istanbul Coverage.
- **Infraestructura:** Docker, Docker Compose, Nginx (Reverse Proxy).

---

## 📋 Historias de Usuario Implementadas

- **HU-01: Autenticación Segura y Control de Bloqueos:**
  - Login con código de estudiante en formato estricto: `N0` seguido de 8 dígitos (`^N0\d{8}$`).
  - Mensaje de credenciales inválidas: `"Credenciales inválidas"`.
  - **Bloqueo temporal por 15 minutos** al acumular 3 intentos fallidos consecutivos.
- **HU-02: Catálogo y Filtrado de Equipos:**
  - Filtros exactos por categorías: `"Cómputo"`, `"Electrónica"` y `"Redes"`.
  - Mensaje exacto cuando no hay equipos disponibles: `"No hay equipos disponibles en esta categoría"`.
- **HU-03: Reserva de Equipos (Flujo Crítico):**
  - Validación transaccional contra cruce de horarios para el mismo equipo.
  - Regla de negocio: Máximo un (1) equipo reservado o prestado de forma simultánea por estudiante.
  - Bloqueo inmediato si el estudiante se encuentra penalizado.
- **HU-04: Gestión de Solicitudes (Panel de Administrador):**
  - Aprobación y rechazo con **motivo obligatorio**.
- **HU-05: Devolución y Penalización Automática:**
  - Al marcar devolución el equipo pasa a `Disponible`.
  - Si la hora de devolución física supera la hora fin acordada, el sistema cambia automáticamente el estado del alumno a **"Penalizado"** (7 días de suspensión).
- **HU-06: Carnet Digital QR del Estudiante:**
  - Credencial digital para escaneo ágil en ventanilla.
- **HU-07: Gestión Integral de Equipos (CRUD Admin):**
  - Registro de equipos con fotos, especificaciones, ubicación y generación de código QR.
- **HU-08: Gestión de Penalizaciones y Levantamiento:**
  - Panel administrativo para levantar sanciones con justificación médica o académica.
- **HU-11: Dashboard y Métricas de Uso:**
  - Gráficos de distribución de inventario y tasa de puntualidad.
- **HU-13: Administración y Creación de Usuarios (CRUD Admin):**
  - Creación de alumnos (`N0XXXXXXXX`) o administradores, reseteo de claves y botón para **desbloquear cuentas** bloqueadas tras 3 intentos.
- **HU-14: Escaneo Rápido con Cámara / Lector QR:**
  - Despacho y devolución rápida en ventanilla sin teclear manualmente.
- **HU-15: Acta Oficial de Préstamo en PDF:**
  - Descarga en 1 clic de constancia formal con cláusula de responsabilidad del estudiante.

---

## 🐳 Despliegue con Docker (Opción Recomendada)

Para levantar todos los servicios (PostgreSQL 16, Backend NestJS, Frontend Nginx y Adminer) en un solo comando:

```bash
# 1. Clonar o ingresar a la carpeta del proyecto
cd lab-equipment-system

# 2. Levantar los contenedores en segundo plano
docker compose up --build -d
```

### URLs de Acceso:
- 🌐 **Frontend (Aplicación Web):** [http://localhost](http://localhost) (o [http://localhost:5173](http://localhost:5173))
- ⚙️ **Backend API REST:** [http://localhost:3000/api](http://localhost:3000/api)
- 🗄️ **Adminer (Gestor Visual de PostgreSQL):** [http://localhost:8080](http://localhost:8080)
  - Sistema: `PostgreSQL`
  - Servidor: `postgres`
  - Usuario: `postgres`
  - Contraseña: `postgres`
  - Base de datos: `lab_system_db`

---

## 💻 Ejecución en Desarrollo Local (Sin Docker)

### 1. Backend (NestJS + Prisma):
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run start:dev
```

### 2. Frontend (React + Vite):
```bash
cd frontend
npm install
npm run dev
```

### 3. Ejecutar Pruebas Unitarias (Vitest):
```bash
cd backend
npm test
```

---

## 🔑 Cuentas Preconfiguradas (Datos de Prueba)

| Rol | Código Institucional | Contraseña | Estado |
| :--- | :--- | :--- | :--- |
| **Administrador / Encargado** | `ADMIN-001` | `Admin123!` | Habilitado |
| **Estudiante Activo** | `N001234567` | `Password123!` | Habilitado |
| **Estudiante Activo 2** | `N009876543` | `Password123!` | Habilitado |
| **Estudiante Penalizado** | `N001122334` | `Password123!` | Penalizado (7 días) |

