# RestContinents · Juego de países

Juego de adivinanzas con datos de [REST Countries](https://restcountries.com/). Elige entre tres modos y juega 10 rondas poniendo a prueba tus conocimientos de geografía.

## Modos de juego

- **Adivina la bandera**: se muestra una bandera y hay que elegir el país correcto entre cuatro opciones.
- **Adivina la capital**: se muestra el nombre de un país y hay que elegir su capital entre cuatro opciones.
- **¿Qué país es?**: se dan pistas sobre un país (región, idiomas, moneda y capital) y hay que identificarlo entre cuatro opciones.

## Reglas

- Se juegan **10 rondas** por partida.
- Cada ronda tiene **una única respuesta correcta** y **cuatro opciones sin duplicados**.
- Cada acierto suma **1 punto**. La puntuación solo se cuenta una vez por pregunta.
- Si fallas, se muestra la respuesta correcta.
- Al finalizar la partida se muestra el resultado y se puede **reiniciar sin recargar la página**.
- Puedes cambiar de modo desde la pantalla de resumen o durante la partida.

## Tecnologías

- [Vite](https://vite.dev/) + JavaScript Vanilla
- Datos de [REST Countries](https://restcountries.com/)
- Banderas de [FlagCDN](https://flagcdn.com/)
- Módulos ES: `src/api.js` (datos), `src/game.js` (lógica), `src/utils.js` (utilidades) y `app.js` (interfaz)

## Datos de la API

La API pública v3.1 de REST Countries fue retirada en 2026 y la v5 requiere una clave privada. Para que el juego funcione sin depender de una clave, la aplicación descarga en tiempo de ejecución el **dataset canónico de REST Countries** mantenido en el repositorio `mledoze/countries`:

- `https://cdn.jsdelivr.net/gh/mledoze/countries@master/countries.json`
- Fallback: `https://raw.githubusercontent.com/mledoze/countries/master/countries.json`

Los datos incluyen nombre, capital, región, subregión, idiomas, monedas y código ISO de 250 países. Las banderas se construyen con el código `cca2` de cada país usando FlagCDN.

La petición se hace con `fetch`, tiene un tiempo máximo de espera, muestra un mensaje de carga y permite reintentar si falla.

## Ejecutar en local

```bash
npm install
npm run dev
```

Abre la URL que muestre Vite (por defecto `http://localhost:5173`).

## Compilar para producción

```bash
npm run build
npm run preview
```

## Despliegue en GitHub Pages

El proyecto está configurado con `base: '/Juego-RestCountries/'` en `vite.config.js` para publicarse en:

**https://ivanmartinezgracia.github.io/Juego-RestCountries/**

Para activar el despliegue automático con GitHub Actions:

1. Sube el código al repositorio `Juego-RestCountries` en la rama `Ivan`.
2. Ve a **Settings → Pages** y selecciona **GitHub Actions** como origen.
3. El workflow de `.github/workflows/deploy.yml` instalará las dependencias, ejecutará `npm run build` y publicará la carpeta `dist`.

## Repositorio

- [https://github.com/Ivanmartinezgracia/Juego-RestCountries](https://github.com/Ivanmartinezgracia/Juego-RestCountries)
