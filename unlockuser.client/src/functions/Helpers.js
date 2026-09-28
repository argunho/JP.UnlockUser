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

export function Initials(name) {
  return name
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0]?.toUpperCase())
    .join("");
}

export function GetCnValue(dn) {
    return dn.match(/^CN=([^,]+)/)?.[1] ?? null;
}

export function ReplaceLetters(word) {
  return  word?.toLowerCase().replaceAll("á", "a").replaceAll("ä", "a").replaceAll("å", "a")
            .replaceAll("æ", "a").replaceAll("ö", "o").replaceAll("ø", "o").replaceAll("é", "e");
}

export function CheckEmail(email){
    const check = /^([a-zA-Z0-9_\-.]+)@([a-zA-Z0-9_\-.]+)\.([a-zA-Z]{2,5})$/;
    return check.test(email);
}

export function CheckUsername(value){
    const check = /^\d{6}[a-z]{3,4}$/i;
    return check.test(value);
}