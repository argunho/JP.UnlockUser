// Installed
import { capitalize } from '@mui/material'

// Components
import PasswordCategories from '../lists/PasswordCategories';

// Functions
import ReplaceLetters from './../../functions/ReplaceLetters';

const eng = /^[A-Za-z]+$/;
const symbols = "!@?$&#^%*-,;._";

export function GeneratePasswordWithRandomWord(word, lgh) {
    let password = word;

    if (!eng.test(word))
        password = ReplaceLetters(word);
    const randomNumber = 10 ** (lgh - word.length); // 10 ** (res - 1)
    const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];

    const min = (randomNumber / 10);
    password += (Math.random() * (randomNumber - min) + min).toFixed(0);
    if (lgh > 8)
        password += randomSymbol;

    return capitalize(password);
}

export function GenerateStrongPassword(lgh) {
    let password = "";
    for (var i = 0; i < lgh; i++) {
        password += RandomChar(i, lgh);
    }
    return password;
}

// Return random characters to generate password
export function RandomChar(num, lgh) {
    let strArr = [
        String.fromCharCode(Math.floor(Math.random() * 26) + 97),
        String.fromCharCode(Math.floor(Math.random() * 26) + 65),
        String.fromCharCode(Math.floor(Math.random() * 10) + 48)
    ];

    if (lgh === 12 && lgh - (num + 1) === 0)
        strArr = symbols.split("");
    else
        strArr.push(strArr[Math.floor(Math.random() * strArr.length)]);

    return strArr[Math.floor(Math.random() * strArr.length)];
}


function PasswordGeneration({ disabled, passwordLength, setGenerated, onChange, regex }) {

    const setPassword = (value) => {
        onChange(value);
        setGenerated(true);
    }

    // Generate new password
    const generatePassword = () => {
        let password = GenerateStrongPassword(passwordLength);

        while (!regex.test(password))
            password = GenerateStrongPassword(passwordLength);
        setPassword(password);
    }

    // Generate one password with a word choice from a list of word categories
    const generatePasswordWithRandomWord = (word) => {
        let password = GeneratePasswordWithRandomWord(word, passwordLength);
        setPassword(password);
    }


    return (
        <PasswordCategories
            label="Generera lösenord"
            keyValue="value"
            limit={passwordLength - 2}
            disabled={disabled}
            onChange={(value) =>
                value ? generatePasswordWithRandomWord(value)
                    : generatePassword()
            } />
    )
}
export default PasswordGeneration;