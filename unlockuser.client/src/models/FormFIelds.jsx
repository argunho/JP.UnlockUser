export const SearchFields = {
    person: [
        {
            name: "name",
            label: "Namn",
            placeholder: "Skriv exakt fullständigt namn eller anvädarnamn här ...",
            autoOpen: false
        }
    ],
    students: [
        {
            name: "name",
            label: "Klassbeteckning",
            class: "search-first-input",
            placeholder: "Skriv exakt klassbeteckning här ...",
            autoOpen: false
        },
        {
            name: "school",
            label: "Skolnamn",
            class: "search-second-input",
            placeholder: "Skriv exakt skolnamn här ..",
            autoOpen: true
        }
    ]
}