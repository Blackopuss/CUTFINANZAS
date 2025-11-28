# CUTFINANZAS - Gestor de Finanzas Personal

Sistema integral para la gestión de finanzas personales, desarrollado con Vue.js, Node.js y MySQL. Incluye análisis de gastos, gestión de tarjetas y una potente integración con IA local para el análisis de tickets y asistencia financiera.

## Características

-   **Dashboard Interactivo**: Visualiza tus gastos e ingresos con gráficos detallados y filtros de fecha (incluyendo vista histórica completa).
-   **Gestión de Transacciones**: Registra, edita y elimina gastos e ingresos. Categorización automática y personalizada.
-   **Análisis de Tickets con IA**: Sube una foto de tu ticket y deja que la IA extraiga automáticamente el monto, la fecha, la categoría y los productos.
-   **Asistente Financiero (Chat)**: Chatea con tus datos financieros para obtener resúmenes y consejos personalizados.
-   **Múltiples Tarjetas**: Gestiona saldos de diferentes tarjetas de débito y crédito.

## Requisitos Previos

Para ejecutar este proyecto necesitas tener instalado:

-   **Node.js** (Versión 20 o superior recomendada)
-   **MySQL** (Base de datos relacional)
-   **Servidor de IA Local** (Opcional, para funciones de IA):
    -   Se recomienda usar [LM Studio](https://lmstudio.ai/) o similar.
    -   Modelo recomendado: `qwen/qwen2.5-vl-7b` (o cualquier modelo con capacidades de visión).
    -   Debe estar corriendo en `http://192.168.56.1:1234` (o puedes configurar esta URL en `backend/routes/aiRoutes.js`).

## Instalación

1. **Clonar el repositorio**:
    ```bash
    git clone <url-del-repositorio>
    cd CUTFINANZAS
    ```

2. **Instalar dependencias del Backend**:
    ```bash
    cd backend
    npm install
    ```

3. **Instalar dependencias del Frontend**:
    ```bash
    cd ../frontend
    npm install
    ```

## Configuración

### Base de Datos
El proyecto utiliza MySQL. Por defecto, intenta conectarse con las siguientes credenciales (definidas en `backend/server.js`):
-   **Host**: `localhost`
-   **Usuario**: `admin`
-   **Contraseña**: `123456789`
-   **Base de datos**: `finanzas`

> **Nota**: Asegúrate de crear un usuario en MySQL con estas credenciales o actualiza el archivo `backend/server.js` con tu configuración propia. La base de datos y las tablas se crearán automáticamente al iniciar el servidor.

### Variables de Entorno (Backend)
Crea un archivo `.env` en la carpeta `backend` con el siguiente contenido (opcional, tiene valores por defecto):

```env
PORT=3000
JWT_SECRET=tu_secreto_super_seguro
```

## Ejecución

### 1. Iniciar el Backend
Desde la carpeta `backend`:
```bash
node server.js
```
Deberías ver: `🚀 Servidor corriendo en http://localhost:3000` y `✅ Conectado a MySQL`.

### 2. Iniciar el Frontend
Desde la carpeta `frontend`:
```bash
npm run dev
```
Abre tu navegador en la URL que te indique (usualmente `http://localhost:5173`).

## Uso de la IA
Para que funcionen el "Análisis de Tickets" y el "Chat Financiero":
1.  Abre tu servidor de IA local (ej. LM Studio).
2.  Carga un modelo de visión (como Qwen 2.5 VL).
3.  Inicia el servidor local en el puerto `1234`.
4.  Asegúrate de que la IP en `backend/routes/aiRoutes.js` coincida con la de tu servidor (por defecto está configurada como `192.168.56.1`).

## Licencia
Este proyecto es de uso personal y educativo.
