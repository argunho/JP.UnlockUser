export default function ReplaceLetters(word) {

  return  word?.toLowerCase().replaceAll("á", "a").replaceAll("ä", "a").replaceAll("å", "a")
            .replaceAll("æ", "a").replaceAll("ö", "o").replaceAll("ø", "o").replaceAll("é", "e");
}
