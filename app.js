import {
  fetchCountries,
  getCountryCode,
  getCountryFlags,
  getCountryName,
} from './src/api.js';
import { createGame } from './src/game.js';

const MODE_NAMES = {
  bandera: 'Adivina la bandera',
  capital: 'Adivina la capital',
  pistas: '¿Qué país es?',
};


const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

const menuSection = document.querySelector('#menu');
const juegoSection = document.querySelector('#juego');
const resumenSection = document.querySelector('#resumen');

const modoRadios = document.querySelectorAll('input[name="modo"]');
const empezarBtn = document.querySelector('#empezar');
const empezarTextoEl = document.querySelector('#empezar-texto');
const reintentarBtn = document.querySelector('#reintentar');
const estadoEl = document.querySelector('#estado');

const rondaEl = document.querySelector('#ronda');
const puntosEl = document.querySelector('#puntos');
const progresoEl = document.querySelector('#progreso');
const progresoBarraEl = document.querySelector('#progreso-barra');
const preguntaKickerEl = document.querySelector('#pregunta-kicker');
const preguntaEl = document.querySelector('#pregunta');
const pistasEl = document.querySelector('#pistas');
const banderaMarcoEl = document.querySelector('#bandera-marco');
const banderaEl = document.querySelector('#bandera');
const destinoEl = document.querySelector('#destino');
const destinoPaisEl = document.querySelector('#destino-pais');
const destinoCodigoEl = document.querySelector('#destino-codigo');
const opcionesEl = document.querySelector('#opciones');
const mensajeEl = document.querySelector('#mensaje');
const siguienteBtn = document.querySelector('#siguiente');
const siguienteTextoEl = document.querySelector('#siguiente-texto');
const salirBtn = document.querySelector('#salir');

const anilloEl = document.querySelector('#anillo');
const resultadoNumeroEl = document.querySelector('#resultado-numero');
const resumenModoEl = document.querySelector('#resumen-modo');
const resumenAciertosEl = document.querySelector('#resumen-aciertos');
const resumenPrecisionEl = document.querySelector('#resumen-precision');
const reiniciarBtn = document.querySelector('#reiniciar');
const cambiarModoBtn = document.querySelector('#cambiar-modo');

let countries = [];
let game = null;

function getSelectedMode() {
  let selected = 'bandera';

  modoRadios.forEach((radio) => {
    if (radio.checked) {
      selected = radio.value;
    }
  });

  return selected;
}

function syncModeSelection() {
  const selected = getSelectedMode();

  document.querySelectorAll('.mode').forEach((mode) => {
    const input = mode.querySelector('input[name="modo"]');
    mode.classList.toggle('is-selected', input?.value === selected);
  });
}

function setActiveScreen(screen) {
  document.body.dataset.screen = screen;
}

function setMenuState(loading, errorMessage = '') {
  modoRadios.forEach((radio) => {
    radio.disabled = loading;
  });

  empezarBtn.disabled = loading;
  empezarBtn.hidden = Boolean(errorMessage);
  empezarBtn.classList.toggle('is-loading', loading);
  empezarBtn.setAttribute('aria-busy', String(loading));
  empezarTextoEl.textContent = loading ? 'Cargando países...' : 'Empezar la partida';
  reintentarBtn.hidden = !errorMessage;

  estadoEl.classList.toggle('is-loading', loading);
  estadoEl.classList.toggle('is-error', Boolean(errorMessage));

  if (errorMessage) {
    estadoEl.textContent = errorMessage;
    estadoEl.hidden = false;
  } else if (loading) {
    estadoEl.textContent = 'Cargando datos de países...';
    estadoEl.hidden = false;
  } else {
    estadoEl.textContent = '';
    estadoEl.hidden = true;
  }
}

function updateProgress() {
  const progress = game.getProgress();
  const percentage = Math.round((progress.round / progress.totalRounds) * 100);
  const round = String(progress.round).padStart(2, '0');

  rondaEl.textContent = `${progress.round}/${progress.totalRounds}`;
  puntosEl.textContent = String(progress.points);
  progresoBarraEl.style.width = `${percentage}%`;
  progresoEl.setAttribute('aria-valuenow', String(progress.round));
  progresoEl.setAttribute('aria-valuemax', String(progress.totalRounds));
  preguntaKickerEl.textContent = `Ronda ${round} · ${MODE_NAMES[game.getMode()]}`;
}

function clearQuestion() {
  preguntaEl.textContent = '';
  pistasEl.replaceChildren();
  pistasEl.hidden = true;

  banderaMarcoEl.hidden = true;
  banderaEl.removeAttribute('src');
  banderaEl.onerror = null;
  banderaEl.alt = 'Bandera del país que debes adivinar';

  destinoEl.hidden = true;
  destinoPaisEl.textContent = '';
  destinoCodigoEl.textContent = '';

  opcionesEl.replaceChildren();
  mensajeEl.textContent = '';
  mensajeEl.className = 'message';
  siguienteBtn.hidden = true;
  siguienteTextoEl.textContent = 'Siguiente';
}

function renderQuestion(question) {
  clearQuestion();

  preguntaEl.textContent = question.prompt;

  if (question.type === 'bandera') {
    const flags = getCountryFlags(question.correctCountry);
    const src = flags.svg || flags.png;

    if (src) {
      banderaEl.src = src;
      banderaEl.onerror = () => {
        if (flags.png && banderaEl.src !== flags.png) {
          banderaEl.src = flags.png;
        }
      };
      banderaMarcoEl.hidden = false;
    }
  }

  if (question.type === 'capital') {
    destinoPaisEl.textContent = getCountryName(question.correctCountry);
    destinoCodigoEl.textContent = getCountryCode(question.correctCountry);
    destinoEl.hidden = false;
  }

  if (question.type === 'pistas' && Array.isArray(question.hints)) {
    question.hints.forEach((hint) => {
      const item = document.createElement('li');
      item.className = 'clue';

      const label = document.createElement('span');
      label.className = 'clue-label';
      label.textContent = hint.label;

      const value = document.createElement('span');
      value.className = 'clue-value';
      value.textContent = hint.value;

      item.append(label, value);
      pistasEl.appendChild(item);
    });

    if (question.hints.length > 0) {
      pistasEl.hidden = false;
    }
  }

  question.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'option';
    button.dataset.option = option;

    const letter = document.createElement('span');
    letter.className = 'option-letter';
    letter.setAttribute('aria-hidden', 'true');
    letter.textContent = OPTION_LETTERS[index] ?? '?';

    const text = document.createElement('span');
    text.className = 'option-text';
    text.textContent = option;

    button.append(letter, text);

    button.addEventListener('click', () => {
      handleAnswer(button, option);
    });

    opcionesEl.appendChild(button);
  });

  opcionesEl.querySelector('.option')?.focus({ preventScroll: true });
}

function handleAnswer(button, choice) {
  const result = game.answer(choice);
  const buttons = opcionesEl.querySelectorAll('.option');

  buttons.forEach((btn) => {
    btn.disabled = true;

    if (btn.dataset.option === result.correctAnswer) {
      btn.classList.add('is-correct');
    } else if (btn === button && !result.correct) {
      btn.classList.add('is-wrong');
    }
  });

  if (result.correct) {
    mensajeEl.textContent = 'Correcto.';
    mensajeEl.classList.add('is-correct');
  } else {
    mensajeEl.textContent = `Incorrecto. La respuesta correcta es ${result.correctAnswer}.`;
    mensajeEl.classList.add('is-wrong');
  }

  updateProgress();

  siguienteTextoEl.textContent = game.isFinished() ? 'Ver resultado' : 'Siguiente';
  siguienteBtn.hidden = false;
  siguienteBtn.focus();
}

function showSummary() {
  juegoSection.hidden = true;
  resumenSection.hidden = false;
  setActiveScreen('summary');

  const summary = game.getSummary();

  anilloEl.style.setProperty('--progreso', String(summary.percentage));
  resultadoNumeroEl.textContent = `${summary.points}/${summary.total}`;
  resumenModoEl.textContent = MODE_NAMES[game.getMode()];
  resumenAciertosEl.textContent = `${summary.points}/${summary.total}`;
  resumenPrecisionEl.textContent = `${summary.percentage}%`;

  reiniciarBtn.focus();
}

function prepareGame(mode) {
  game = createGame(countries, mode);

  const question = game.nextQuestion();

  if (!question) {
    throw new Error('No se ha podido generar la primera pregunta.');
  }

  updateProgress();
  renderQuestion(question);
}

async function startGame() {
  const mode = getSelectedMode();

  setMenuState(true);

  try {
    if (countries.length === 0) {
      countries = await fetchCountries();
    }

    menuSection.hidden = true;
    resumenSection.hidden = true;
    juegoSection.hidden = false;
    setActiveScreen('game');

    prepareGame(mode);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Ha ocurrido un error inesperado al cargar el juego.';

    menuSection.hidden = false;
    juegoSection.hidden = true;
    resumenSection.hidden = true;
    setActiveScreen('menu');
    setMenuState(false, message);
  }
}

function nextQuestion() {
  if (game.isFinished()) {
    showSummary();
    return;
  }

  const question = game.nextQuestion();

  if (!question) {
    showSummary();
    return;
  }

  updateProgress();
  renderQuestion(question);
}

function restartGame() {
  resumenSection.hidden = true;
  juegoSection.hidden = false;
  setActiveScreen('game');

  prepareGame(getSelectedMode());
}

function backToMenu() {
  resumenSection.hidden = true;
  juegoSection.hidden = true;
  menuSection.hidden = false;
  setActiveScreen('menu');

  setMenuState(false);
  syncModeSelection();
  clearQuestion();
}

modoRadios.forEach((radio) => {
  radio.addEventListener('change', syncModeSelection);
});

empezarBtn.addEventListener('click', startGame);
reintentarBtn.addEventListener('click', startGame);
siguienteBtn.addEventListener('click', nextQuestion);
reiniciarBtn.addEventListener('click', restartGame);
cambiarModoBtn.addEventListener('click', backToMenu);
salirBtn.addEventListener('click', backToMenu);

setMenuState(false);
syncModeSelection();
juegoSection.hidden = true;
resumenSection.hidden = true;
menuSection.hidden = false;
setActiveScreen('menu');
clearQuestion();
