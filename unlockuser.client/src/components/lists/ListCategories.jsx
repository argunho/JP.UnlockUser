import { memo } from 'react';

// Installed
import cities from 'cities.json';

// Json
import words from '../../assets/json/words.json';
import colors from '../../assets/json/colors.json';
import DropdownMenu from './DropdownMenu';

// List of alternative to select words list category to generate password
const groups = [
    { label: "Komplicerad", value: "strong" },
    { label: "Länder", value: "countries" },
    { label: "Alla städer/tätort", value: "cities" },
    { label: "Svenska städer/tätort", value: "sv_cities" },
    { label: "Färg", value: "colors" },
    { label: "Blommor", value: "flowers" },
    { label: "Frukter", value: "fruits" },
    { label: "Grönsaker", value: "vegetables" },
    { label: "Djur", value: "animals" },
    { label: "Kattens namn (smeknamn)", value: "cats" },
    { label: "Bilar", value: "cars" }
];

const ListCategories = memo(function ListCategories({ limit, label, multiple, disabled, keyValue = "name", onChange }) {

    // const refSelect = useRef(null);

    // Password words category
    const handlePasswordChange = (value) => {
        if (!groups?.find(x => x.value === value) || value === "strong") {
            onChange();
            return;
        }

        let wList = words[value] || [];
        wList.filter(x => (x.name && (x.name.length >= 3 && x.name.length <= limit)) || (x.length >= 3 && x.length <= limit));

        if (wList.length === 0) {
            if (value === "cities")
                wList = cities;
            else if (value === "colors")
                wList = colors;
            else
                wList = cities.filter(x => x.country === "SE");

            wList = wList.filter(x => x.name?.indexOf(" ") === -1 && x.name.length < 10);

        } else if (wList.length > 0)
            wList = wList.filter(x => x.indexOf(" ") === -1 && x.length < 10);

        if (multiple)
            onChange(wList);
        else {
            let word = wList[Math.floor(Math.random() * wList.length)]
            onChange(word?.name || word);
        }

    }

    return (
        <DropdownMenu
            label={label}
            list={groups}
            keyValue={keyValue}
            keyName="label"
            disabled={disabled}
            onChange={handlePasswordChange} />
    )
})

export default ListCategories;
// return (
//     <FormControl className={'select-list' + ((!multiple) ? " btn-select-list" : "")} ref={refSelect} >
//         <InputLabel className='select-label'>
//             {label}
//         </InputLabel>
//         <Select
//             value={selectedCategory}
//             onChange={handleSelectListChange}
//             label={label}
//             sx={{
//                 height: multiple ? 50 : 40,
//                 color: disabled ? "#cccccc" : "#1976D2"
//             }}
//             disabled={disabled}
//         >

//             <MenuItem value="">
//                 <span style={{ marginLeft: "10px", color: "#1976D2" }}>Välj en från listan ...</span>
//             </MenuItem>
//             <MenuItem></MenuItem>
//             {(multiple ? passwordKeys.slice(1) : passwordKeys).map((l, index) => (
//                 <MenuItem value={l.label} key={index}>
//                     <span style={{ marginLeft: "10px" }}> - {l.label}</span>
//                 </MenuItem>
//             ))}
//         </Select>
//     </FormControl>
// )