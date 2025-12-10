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

function PasswordGeneration({ disabled, passwordLength, setGenerated, onChange, regex }) {

    const setPassword = (value) => {
        onChange(value);
        setGenerated(true);
    }

    // Generate new password
    const generatePassword = () => {
        let password = returnGeneratedPassword();

        while (!regex.test(password))
            password = returnGeneratedPassword();
        setPassword(password);
    }

    // Generate one password with a word choice from a list of word categories
    const generatePasswordWithRandomWord = (word) => {
        let password = GeneratePasswordWithRandomWord(word, passwordLength);
        setPassword(password);
    }

    // Generate strong password
    const returnGeneratedPassword = () => {
        let password = "";
        for (var i = 0; i < passwordLength; i++) {
            password += randomChar(i);
        }
        return password;
    }

    // Return random characters to generate password
    const randomChar = (num) => {
        let strArr = [
            String.fromCharCode(Math.floor(Math.random() * 26) + 97),
            String.fromCharCode(Math.floor(Math.random() * 26) + 65),
            String.fromCharCode(Math.floor(Math.random() * 10) + 48)
        ];

        if (passwordLength === 12 && passwordLength - (num + 1) === 0)
            strArr = symbols.split("");
        else
            strArr.push(strArr[Math.floor(Math.random() * strArr.length)]);

        return strArr[Math.floor(Math.random() * strArr.length)];
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