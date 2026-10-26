export function shuffle(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

export function sample(array, count) {
  return shuffle(array).slice(0, count);
}

export function getRandomItem(array) {
  if (!Array.isArray(array) || array.length === 0) {
    return undefined;
  }

  const shuffled = shuffle(array);

  return shuffled[0];
}

export function uniqueByKey(items, key) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const value =
      key === undefined
        ? item
        : typeof key === 'function'
          ? key(item)
          : item?.[key];

    if (seen.has(value)) {
      continue;
    }

    seen.add(value);
    result.push(item);
  }

  return result;
}

export function formatNumber(value) {
  if (typeof value !== 'number') {
    return null;
  }

  return value.toLocaleString('es-ES');
}
