
import React, { useEffect, useState } from 'react'
import { Button, Tooltip } from '@mui/material'

import { capitalize } from '@mui/material';
import ReplaceLetters from '../functions/ReplaceLetters';
import ListCategories from './ListCategories';
/* eslint-disable react-hooks/exhaustive-deps */

function PasswordGeneration({
    disabledTooltip, disabledClick, regex, users, regenerate,
    wordsList, numbersCount, strongPassword, variousPasswords, passwordLength,
    setGenerated, updatePasswordForm, updatePreviewList }, ref) {
    PasswordGeneration.displayName = "PasswordGeneration";

    const eng = /^[A-Za-z]+$/;
    const symbols = "!@?$&#^%*-,;._";
    const randomNumbers = [0, 10, 100, 1000];

    const setForm = (form) => {
        updatePasswordForm(form);
        setGenerated(true);
    }

    const setPreviewList = (previewList) => {
        updatePreviewList(previewList);
        setGenerated(previewList.length > 0);
    }

    // Generate handle
    const generateHandle = () => {
        if (variousPasswords) generateVariousPasswords()
        else generatePassword();
    }

    // Generate new password
    const generatePassword = () => {
        let usersArray = [];
        let generatedPassword = returnGeneratedPassword();

        while (!regex.test(generatedPassword))
            generatedPassword = returnGeneratedPassword();

        if (users.length > 0) {
            for (var i = 0; i < users.length; i++) {
                usersArray.push({
                    username: users[i].name,
                    password: generatedPassword
                })
            }
            setForm({ password: generatedPassword, confirmPassword: generatedPassword, users: usersArray });
        } else
            setForm({ password: generatedPassword, confirmPassword: generatedPassword });
    }

    // Generate multiple passwords
    const generateVariousPasswords = () => {

        let usersArray = [];
        let previewList = [];
        for (let i = 0; i < users.length; i++) {
            let password = ""
            let broken = false;
            let randomNumber = randomNumbers[numbersCount];

            if (!strongPassword) {
                const randomWord = wordsList.length === 1 ? wordsList[0] : wordsList[Math.floor(Math.random() * wordsList.length)];
                password += (randomWord?.name || randomWord);

                if (randomNumber === 0)
                    randomNumber = randomNumbers[8 - password.length];

                let min = (randomNumber / 10);

                if (!eng.test(password))
                    password = ReplaceLetters(password);

                broken = !eng.test(password);

                password += (Math.random() * (randomNumber - min) + min).toFixed(0);
                if (passwordLength === 12)
                    password += symbols[Math.floor(Math.random() * symbols.length)];

                password = capitalize(password);
            } else
                password = returnGeneratedPassword();

            const noExists = usersArray.find(x => x.password === password) === undefined;

            if (regex.test(password) && !broken && noExists) {
                usersArray.push({
                    username: users[i].name,
                    password: password
                })

                previewList.push({
                    displayName: users[i].displayName,
                    passwordHtml: `<p style='margin-bottom:20px;text-indent:15px'> 
                                Lösenord: <span style='color:#c00;font-weight:600;letter-spacing:0.5px'>${password}</span></p>`,
                    password: password
                });
            } else
                i -= 1;
        }

        setForm({ users: usersArray });
        setPreviewList(previewList);
    }

    // Generate one password with a word choice from a list of word categories
    const generatePasswordWithRandomWord = (word) => {
        if (word === null) {
            generatePassword();
            return;
        }
        let password = word;

        if (!eng.test(word))
            password = ReplaceLetters(word);
        const randomNumber = randomNumbers[8 - word.length];
        const min = (randomNumber / 10);
        password += (Math.random() * (randomNumber - min) + min).toFixed(0);

        password = capitalize(password);
        setForm({password: password, confirmPassword: password });
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

    const clickButton = <Tooltip arrow
        title={disabledTooltip ? "Lösenords kategory är inte vald." : ""}
        classes={{
            tooltip: `tooltip tooltip-margin tooltip-${disabledTooltip ? 'error' : 'blue'}`,
            arrow: `arrow-${disabledTooltip ? 'error' : 'blue'}`
        }}>
        <span className={variousPasswords ? "generate-button-wrapper" : ""}>
            <Button variant="text"
                color="primary"
                type="button"
                size="small"
                className="generate-password"
                onClick={generateHandle}
                disabled={disabledTooltip || disabledClick}
                ref={ref}>
                Generera {regenerate && " andra"} lösenord
            </Button>
        </span>
    </Tooltip>;

    const categoriesList = <ListCategories
        limitedChars={true}
        selectChange={(word) => generatePasswordWithRandomWord(word)}
        multiple={false}
        reset={!regenerate}
        disabled={disabledClick}
        label={`Generera ${regenerate ? " andra" : ""} lösenord`} />;

    return (
        (sessionStorage.getItem("group") !== "Students" || variousPasswords) ? clickButton : categoriesList
    )
}

const refGenerate = React.forwardRef(PasswordGeneration);
export default refGenerate;