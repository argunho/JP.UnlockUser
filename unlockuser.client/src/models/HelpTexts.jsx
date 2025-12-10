export const Tips = [
    {
        primary: "Exact match",
        secondary: "Markerad kryssruta: görs en exakt matchning av namn, efternamn eller användarnamn.\nEj markerad kryssruta: systemet söker  efter alla poster där namn, efternamn eller användarnamn innehåller den angivan sökordet.",
        value: "match"
    },
    {
        primary: "Resultat",
        secondary: "Resultatet kan bli från 0 till flera hittade användare beroende på sökord och sökalternativ.",
        value: ""
    }
]

export const AllTips = [...Tips, ...[
    {
        primary: "Användare",
        secondary: "Det här alternativet är till för att söka efter en specifik användare. Välj rätt sökalternativ nedan för att få förväntad resultat.",
        value: "user"
    },
    {
        primary: "Klass elever",
        secondary: "Det här alternativet är till för att söka efter alla elever i en specifik klass med klass- och skolnamn.",
        value: "students"
    }
]]

// Help texts (password)
export const PasswordTips = (length) => [
    {
        primary: length === 12 ? "Anställda" : "Studenter",
        secondary: "* Minst en stor bokstav, ej <b>Ö, Ä, Å</b></br>" +
            "* Minst en liten liten bokstav, ej <b>ö, ä, å</b></br>" +
            "* Minst en siffra</br>" +
            "* Minst " + length + " tecken långt</br>" +
            `${(length === 12) ? "* Minst ett specialtecken, exempelvis !@?$&#^%*-,;._" : ""}`
    }
]