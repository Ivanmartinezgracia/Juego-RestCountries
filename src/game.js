import { getCountryCapitals, getCountryName } from './api.js';
import { sample, shuffle, uniqueByKey } from './utils.js';

const ROUNDS = 10;
const OPTIONS_COUNT = 4;

const languageNames =
  typeof Intl.DisplayNames === 'function'
    ? new Intl.DisplayNames(['es'], { type: 'language' })
    : null;
const currencyNames =
  typeof Intl.DisplayNames === 'function'
    ? new Intl.DisplayNames(['es'], { type: 'currency' })
    : null;

function getDisplayName(displayNames, code, fallback) {
  if (!displayNames) {
    return fallback;
  }

  try {
    return displayNames.of(code) ?? fallback;
  } catch {
    return fallback;
  }
}

const REGION_NAMES = {
  Africa: 'África',
  Americas: 'América',
  Antarctic: 'Antártida',
  Asia: 'Asia',
  Europe: 'Europa',
  Oceania: 'Oceanía',
};

const SUBREGION_NAMES = {
  'Australia and New Zealand': 'Australia y Nueva Zelanda',
  Caribbean: 'Caribe',
  'Central America': 'Centroamérica',
  'Central Asia': 'Asia Central',
  'Central Europe': 'Europa Central',
  'Eastern Africa': 'África Oriental',
  'Eastern Asia': 'Asia Oriental',
  'Eastern Europe': 'Europa Oriental',
  Melanesia: 'Melanesia',
  Micronesia: 'Micronesia',
  'Middle Africa': 'África Central',
  'North America': 'América del Norte',
  'Northern Africa': 'África del Norte',
  'Northern Europe': 'Europa del Norte',
  Polynesia: 'Polinesia',
  'South America': 'América del Sur',
  'South-Eastern Asia': 'Sudeste Asiático',
  'Southeast Europe': 'Europa Sudoriental',
  'Southern Africa': 'África Austral',
  'Southern Asia': 'Asia del Sur',
  'Southern Europe': 'Europa del Sur',
  'Western Africa': 'África Occidental',
  'Western Asia': 'Asia Occidental',
  'Western Europe': 'Europa Occidental',
};

function getNamePool(countries) {
  const names = countries
    .map(getCountryName)
    .filter((name) => name !== '');

  return uniqueByKey(names);
}

function getCapitalPool(countries) {
  const capitals = countries.flatMap(getCountryCapitals).filter((capital) => capital !== '');

  return uniqueByKey(capitals);
}

function pickDistractors(pool, correct, count) {
  const others = pool.filter((item) => item !== correct);
  const distractors = sample(others, count);

  return shuffle([correct, ...distractors]).slice(0, OPTIONS_COUNT);
}

function hasHintData(country) {
  return Boolean(
    getCountryCapitals(country).length > 0 &&
      country?.languages &&
      Object.keys(country.languages).length > 0 &&
      country?.currencies &&
      Object.keys(country.currencies).length > 0
  );
}

export function createGame(countries, mode) {
  const state = {
    countries,
    mode,
    round: 0,
    totalRounds: ROUNDS,
    points: 0,
    answered: false,
    currentQuestion: null,
    usedCountries: new Set(),
    usedPairs: new Set(),
  };

  const namePool = getNamePool(countries);
  const capitalPool = getCapitalPool(countries);

  function nextQuestion() {
    if (state.round >= state.totalRounds) {
      return null;
    }

    state.round += 1;
    state.answered = false;

    if (state.mode === 'bandera') {
      const available = countries.filter((country) => {
        const name = getCountryName(country);
        return name && !state.usedCountries.has(country.cca3);
      });

      const candidates = available.length > 0 ? available : countries;
      const correctCountry = sample(candidates, 1)[0];

      if (correctCountry?.cca3) {
        state.usedCountries.add(correctCountry.cca3);
      }

      const correctName = getCountryName(correctCountry);
      const options = pickDistractors(namePool, correctName, OPTIONS_COUNT - 1);

      const question = {
        type: 'bandera',
        correctCountry,
        correctAnswer: correctName,
        options,
        prompt: '¿Qué país corresponde a esta bandera?',
      };

      state.currentQuestion = question;
      return question;
    }

    if (state.mode === 'capital') {
      const available = countries.filter((country) => {
        const name = getCountryName(country);
        const capitals = getCountryCapitals(country);
        const key = `${name}|${capitals[0] ?? ''}`;

        return capitals.length === 1 && !state.usedPairs.has(key);
      });

      const candidates =
        available.length > 0
          ? available
          : countries.filter((country) => getCountryCapitals(country).length === 1);
      const correctCountry = sample(candidates, 1)[0];

      const correctName = getCountryName(correctCountry);
      const capitals = getCountryCapitals(correctCountry);
      const correctCapital = capitals[0];

      if (correctName && correctCapital) {
        state.usedPairs.add(`${correctName}|${correctCapital}`);
      }

      const options = pickDistractors(capitalPool, correctCapital, OPTIONS_COUNT - 1);

      const question = {
        type: 'capital',
        correctCountry,
        correctAnswer: correctCapital,
        options,
        prompt: '¿Cuál es la capital de este país?',
      };

      state.currentQuestion = question;
      return question;
    }

    if (state.mode === 'pistas') {
      const hintCountries = countries.filter(hasHintData);
      const available = hintCountries.filter((country) => {
        const name = getCountryName(country);
        return name && !state.usedCountries.has(country.cca3);
      });

      const candidates = available.length > 0 ? available : hintCountries;
      const correctCountry = sample(candidates, 1)[0];

      if (correctCountry?.cca3) {
        state.usedCountries.add(correctCountry.cca3);
      }

      const correctName = getCountryName(correctCountry);
      const options = pickDistractors(namePool, correctName, OPTIONS_COUNT - 1);

      const region = [
        REGION_NAMES[correctCountry.region] ?? correctCountry.region,
        SUBREGION_NAMES[correctCountry.subregion] ?? correctCountry.subregion,
      ]
        .filter(Boolean)
        .join(' · ');
      const capital = getCountryCapitals(correctCountry)[0] ?? null;
      const languages = correctCountry.languages
        ? Object.entries(correctCountry.languages).map(([code, name]) =>
            getDisplayName(languageNames, code, name)
          )
        : [];
      const currencies = correctCountry.currencies
        ? Object.entries(correctCountry.currencies)
            .map(([code, currency]) => {
              const name = getDisplayName(currencyNames, code, currency?.name);

              if (!name) {
                return null;
              }

              return currency?.symbol ? `${name} (${currency.symbol})` : name;
            })
            .filter(Boolean)
        : [];

      const hints = [
        { label: 'Región', value: region || 'Desconocida' },
        languages.length > 0
          ? { label: 'Idiomas', value: languages.slice(0, 2).join(', ') }
          : null,
        currencies.length > 0
          ? { label: 'Moneda', value: currencies[0] }
          : null,
        capital ? { label: 'Capital', value: capital } : null,
      ].filter(Boolean);

      const question = {
        type: 'pistas',
        correctCountry,
        correctAnswer: correctName,
        options,
        prompt: '¿Qué país es, con estas pistas?',
        hints,
      };

      state.currentQuestion = question;
      return question;
    }

    return null;
  }

  function answer(choice) {
    if (state.answered || !state.currentQuestion) {
      return {
        answered: true,
        correct: false,
        correctAnswer: state.currentQuestion?.correctAnswer ?? '',
        alreadyAnswered: true,
      };
    }

    state.answered = true;

    const isCorrect = choice === state.currentQuestion.correctAnswer;

    if (isCorrect) {
      state.points += 1;
    }

    return {
      answered: true,
      correct: isCorrect,
      correctAnswer: state.currentQuestion.correctAnswer,
      alreadyAnswered: false,
    };
  }

  function getProgress() {
    return {
      round: state.round,
      totalRounds: state.totalRounds,
      points: state.points,
    };
  }

  function getSummary() {
    const total = state.totalRounds;

    return {
      points: state.points,
      total,
      percentage: Math.round((state.points / total) * 100),
    };
  }

  function isFinished() {
    return state.round >= state.totalRounds && state.answered;
  }

  return {
    nextQuestion,
    answer,
    getProgress,
    getSummary,
    getMode: () => state.mode,
    isFinished,
  };
}
