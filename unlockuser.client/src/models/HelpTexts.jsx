export const Tips = [
    {
        primary: "Exact match",
        secondary: "Markerad kryssruta: görs en exakt matchning av namn, efternamn eller användarnamn.\nEj markerad kryssruta: systemet söker  efter alla poster där namn, efternamn eller användarnamn innehåller den angivan sökordet.",
        value: "match"
    },
    {
        primary: "Tips",
        secondary: "Genom att klicka på varje sökalternativ aktiveras en dold tipsruta som visas när du för musen över sökalternativen.",
        value: "tips"
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
]];