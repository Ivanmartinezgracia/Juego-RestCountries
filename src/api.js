const API_URLS = [
  'https://cdn.jsdelivr.net/gh/mledoze/countries@master/countries.json',
  'https://raw.githubusercontent.com/mledoze/countries/master/countries.json',
];

const MIN_COUNTRIES = 5;
const REQUEST_TIMEOUT = 20000;

const hasText = (value) => typeof value === 'string' && value.trim() !== '';

async function requestJson(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`RestCountries respondió con un error (${response.status}).`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export function getCountryName(country) {
  const translated = country?.translations?.spa?.common;

  if (hasText(translated)) {
    return translated.trim();
  }

  return hasText(country?.name?.common) ? country.name.common.trim() : '';
}

export function getCountryCode(country) {
  return hasText(country?.cca3) ? country.cca3.trim() : '';
}

export function getCountryCapitals(country) {
  if (!Array.isArray(country?.capital)) {
    return [];
  }

  return country.capital.filter(hasText).map((capital) => capital.trim());
}

export function getCountryCapital(country) {
  return getCountryCapitals(country)[0] ?? '';
}

export function getCountryFlags(country) {
  const code = hasText(country?.cca2) ? country.cca2.trim().toLowerCase() : '';
  const flags = country?.flags ?? {};

  return {
    svg: hasText(flags.svg)
      ? flags.svg
      : code
        ? `https://flagcdn.com/${code}.svg`
        : '',
    png: hasText(flags.png)
      ? flags.png
      : code
        ? `https://flagcdn.com/w320/${code}.png`
        : '',
  };
}

function isPlayable(country) {
  const flags = getCountryFlags(country);

  return Boolean(
    getCountryCode(country) && getCountryName(country) && (flags.svg || flags.png)
  );
}

export async function fetchCountries() {
  let data = null;
  const errors = [];

  for (const url of API_URLS) {
    try {
      data = await requestJson(url);
      break;
    } catch (error) {
      errors.push(error);
    }
  }

  if (!data) {
    const timedOut = errors.some((error) => error?.name === 'AbortError');

    throw new Error(
      timedOut
        ? 'RestCountries tardó demasiado en responder. Revisa tu conexión e inténtalo de nuevo.'
        : 'No se pudo conectar con los datos de RestCountries. Revisa tu conexión e inténtalo de nuevo.'
    );
  }

  if (!Array.isArray(data)) {
    throw new Error(
      'RestCountries devolvió un formato inesperado. Inténtalo de nuevo.'
    );
  }

  const countries = data.filter(isPlayable);

  if (countries.length < MIN_COUNTRIES) {
    throw new Error(
      'No hay suficientes países con los datos necesarios para jugar.'
    );
  }

  return countries;
}
