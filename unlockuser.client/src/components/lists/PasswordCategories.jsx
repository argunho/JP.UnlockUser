import { memo } from 'react';

// Installed
import cities from 'cities.json';

// Json
import words from '../../assets/json/words.json';
import colors from '../../assets/json/colors.json';
import DropdownMenu from './DropdownMenu';

// List of alternative to select words list category to generate password
const groups = [
    { name: "Komplicerad", value: "strong" },
    { name: "Länder", value: "countries" },
    { name: "Alla städer/tätort", value: "cities" },
    { name: "Svenska städer/tätort", value: "sv_cities" },
    { name: "Färg", value: "colors" },
    { name: "Blommor", value: "flowers" },
    { name: "Frukter", value: "fruits" },
    { name: "Grönsaker", value: "vegetables" },
    { name: "Djur", value: "animals" },
    { name: "Kattens namn (smeknamn)", value: "cats" },
    { name: "Bilar", value: "cars" }
];

const PasswordCategories = memo(function PasswordCategories({ label, limit, multiple, disabled, keyValue = "name", onChange }) {

    // const refSelect = useRef(null);

    // Password words category
    const handlePasswordChange = (value) => {
        if (!groups?.find(x => x[keyValue] === value) || value === "strong") {
            onChange();
            return;
        }

        let wList = words[value] || [];

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

        if (limit)
            wList = wList.filter(x => (x.name && (x.name.length >= 3 && x.name.length <= limit)) || (x.length >= 3 && x.length <= limit));

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
            disabled={disabled}
            onChange={handlePasswordChange} />
    )
})

export default PasswordCategories;
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