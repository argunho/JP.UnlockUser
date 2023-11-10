import React, { useEffect, useRef, useState } from 'react';

// Installed
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import cities from 'cities.json';
import colors from 'color-name-list';

// Json
import words from './../assets/json/words.json';

// List of alternative to select words list category to generate password
const passwordKeys = [
    { label: "Komplicerad", value: null },
    { label: "Länder", value: "countries" },
    { label: "Alla städer/tätort", value: "cities" },
    { label: "Svenska städer/tätort", value: "svCities" },
    { label: "Färg", value: "colors" },
    { label: "Blommor", value: "flowers" },
    { label: "Frukter", value: "fruits" },
    { label: "Grönsaker", value: "vegetables" },
    { label: "Djur", value: "animals" },
    { label: "Kattens namn (smeknamn)", value: "cats" },
    { label: "Bilar", value: "cars" }
];

export default function ListCategories({ limitedChars, label, reset, multiple, disabled, selectChange }) {
    ListCategories.displayName = "ListCategories";

    const [selectedCategory, setSelectedCategory] = useState("");

    const refSelect = useRef(null);

    useEffect(() => {
        if (reset)
            setSelectedCategory("");
    }, [reset])

    // Password words category
    const handleSelectListChange = (e) => {
        setSelectedCategory(e.target.value);

        const keyword = passwordKeys.find(x => x.label === e.target.value).value;
        let wList = words[keyword] || [];
        if (keyword !== null) {
            if (wList.length === 0) {
                if (keyword === "cities")
                    wList = cities;
                else if (keyword === "colors")
                    wList = colors;
                else
                    wList = cities.filter(x => x.country === "SE");

                wList = wList.filter(x => x.name.indexOf(" ") === -1 && x.name.length < 10);

            } else if (wList.length > 0)
                wList = wList.filter(x => x.indexOf(" ") === -1 && x.length < 10);

            if (limitedChars && wList.length > 0)
                wList = wList.filter(x => (x.name && (x.name.length > 4 && x.name.length < 8)) || (x.length > 4 && x.length < 8));

            if (multiple)
                selectChange(wList);
            else {
                let word = wList[Math.floor(Math.random() * wList.length)]
                selectChange(word?.name || word);
            }
        } else selectChange(keyword);

    }

    return (
        <FormControl className={'select-list' + ((!multiple) ? " btn-select-list" : "")} ref={refSelect} >
            <InputLabel className='select-label'>
                {label}
            </InputLabel>
            <Select
                value={selectedCategory}
                onChange={handleSelectListChange}
                label={label}
                sx={{
                    height: multiple ? 50 : 40,
                    color: disabled ? "#cccccc" : "#1976D2"
                }}
                disabled={disabled}
            >

                <MenuItem value="">
                    <span style={{ marginLeft: "10px", color: "#1976D2" }}>Välj en från listan ...</span>
                </MenuItem>
                <MenuItem></MenuItem>
                {(multiple ? passwordKeys.slice(1) : passwordKeys).map((l, index) => (
                    <MenuItem value={l.label} key={index}>
                        <span style={{ marginLeft: "10px" }}> - {l.label}</span>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    )
}
