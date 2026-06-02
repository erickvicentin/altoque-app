# AlToque - Mobile App (React Native + Expo) 📱

Este es el frontend de **AlToque** desarrollado en **React Native** con **Expo** y **TypeScript** para la materia Programación III / Metodología de Sistemas.

## 🛠️ Requisitos previos

Asegúrate de tener instalado en tu entorno de desarrollo:
- **Node.js** (Versión LTS recomendada).
- **Git** correctamente configurado.
- **Expo Go** en tu celular físico (opcional) o **Android Studio / Xcode** para el uso de emuladores.

---

## 🚀 Pasos para levantar la App localmente

Si acabas de clonar el repositorio por primera vez, sigue estos pasos en la terminal de tu computadora:

### 1. Instalar las dependencias de Node
Descarga todos los paquetes y librerías necesarias del proyecto ejecutando:
```bash
npm install
```

### 2. Configurar la IP del Backend
Abrir el archivo ```src/services/api.ts```. Vas a ver que tiene una configuración para la propiedad baseURL. Como estamos trabajando en un entorno local coordinado, debes ajustar esa URL según tu entorno de ejecución:

* Si usas el emulador de Android Studio (Windows): Debes cambiar la IP por la dirección del puente nativo que mapea Android hacia el localhost de tu PC:

```bash
baseURL: '[http://10.0.2.2:8000/api](http://10.0.2.2:8000/api)'
```

* Si usas un celular físico con el código QR de Expo Go: Debes averiguar la IP local de la computadora donde está corriendo tu servidor de Laravel (ej. ```192.168.0.X``` o ```192.168.1.X```) y configurar:

```bash
baseURL: 'http://192.168.0.X:8000/api'
```

* Si usas el simulador de Xcode (macOS): Puedes mantener la IP local privada de la Mac que esté compartida en la red con Laravel:

```bash
baseURL: 'http://192.168.0.183:8000/api'
```

### 3. Iniciar el entorno de Expo
Para encender el empaquetador de la aplicación móvil, ejecuta:

```bash
npx expo start
```

### 4. Ejecutar en tu dispositivo o emulador
Una vez que el panel de Expo aparezca en tu terminal, utiliza los comandos nativos de la herramienta:
* Presiona a en la terminal para abrir y desplegar la app en el emulador de Android.
* Presiona i para hacer lo propio en el simulador de iOS.
* O escanea el código QR interactivo con la aplicación Expo Go desde tu celular (recuerda que el celular debe estar conectado exactamente a la misma red Wi-Fi que la computadora).

## 📂 Estructura de código inicial:

* ```/src/services/api.ts```: Cliente HTTP de Axios centralizado para interactuar con la API de Laravel.
* ```/src/screens/LoginScreen.tsx```: Pantalla de inicio de sesión integrada con lógica de redirección basada en roles de usuario.
* ```/src/screens/HomeCliente.tsx```: Vista de aterrizaje para usuarios con el rol de cliente.
* ```/src/screens/HomeProfesional.tsx```: Panel principal de gestión para los prestadores de servicios.