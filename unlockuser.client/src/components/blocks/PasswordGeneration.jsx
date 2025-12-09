// Installed
import { capitalize } from '@mui/material'

// Components
import ListCategories from './../lists/ListCategories';

// Functions
import ReplaceLetters from './../../functions/ReplaceLetters';

function PasswordGeneration({ disabled, users, passwordLength, setGenerated, onChange }) {

    // Regex to validate password 
    const regex = passwordLength === 12
        ? /^(?=.*[0-9])(?=.*[!@?$&#^%*-,;._])[A-Za-z0-9!@?$&#^%*-,;._]{12,50}$/
        : /^(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])[A-Za-z0-9]{8,50}$/;
    const eng = /^[A-Za-z]+$/;
    const symbols = "!@?$&#^%*-,;._";
    const randomNumbers = [0, 10, 100, 1000];

    const setPassword = (value) => {
        onChange(value);
        setGenerated(true);
    }


    // Generate new password
    const generatePassword = () => {
        let usersArray = [];
        let password = returnGeneratedPassword();

        while (!regex.test(password))
            password = returnGeneratedPassword();
        if (users.length > 0) {
            for (var i = 0; i < users.length; i++) {
                usersArray.push({
                    username: users[i].name,
                    password: password
                })
            }
            setPassword({ password: password, users: usersArray });
        } else
            setPassword({ password: password });
    }

    // Generate one password with a word choice from a list of word categories
    const generatePasswordWithRandomWord = (word) => {

        let usersArray = [];
        let password = word;

        if (!eng.test(word))
            password = ReplaceLetters(word);
        const randomNumber = randomNumbers[8 - word.length];
        const min = (randomNumber / 10);
        password += (Math.random() * (randomNumber - min) + min).toFixed(0);

        password = capitalize(password);
        if (users.length > 0) {
            for (var i = 0; i < users.length; i++) {
                usersArray.push({
                    username: users[i].name,
                    password: password
                })
            }
            setPassword({ password: password, users: usersArray });
        }
        else
            setPassword({ password: password });
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
        <ListCategories
            label="Generera lösenord"
            keyValue="value"
            limitedChars={true}
            disabled={disabled}
            onChange={(value) =>
                value ? generatePasswordWithRandomWord(value)
                    : generatePassword()
            } />
    )
}
export default PasswordGeneration;