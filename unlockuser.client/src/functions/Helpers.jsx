export function Capitalize(str) {
    if (!str) return;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function Singularize(word) {
  if (word.endsWith('ies')) {
    return word.slice(0, -3) + 'y';
  }
  if (word.endsWith('s')) {
    return word.slice(0, -1);
  }
  return word;
}