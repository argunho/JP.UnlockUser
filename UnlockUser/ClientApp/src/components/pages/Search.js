import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import axios from 'axios';
import { SearchOffSharp, SearchSharp } from '@mui/icons-material'
import {
    Button, FormControl, FormControlLabel, Tooltip,
    Radio, RadioGroup, TextField, Switch, Autocomplete
} from '@mui/material'
import Result from '../blocks/Result'
import ModalHelpTexts from './../blocks/ModalHelpTexts'
import schools from './../../json/schools.json'; // List of all schools in Alvesta municipalities
import TokenConfig from '../functions/TokenConfig'


export class Search extends Component {
    static displayName = Search.name;

    constructor(props) {
        super(props);

        const sOption = sessionStorage.getItem("sOption");
        const clsSearch = (sOption === "members");
        this.state = {
            input: "",
            additionInput: "",
            users: JSON.parse(sessionStorage.getItem("users")) || null,
            isLoading: false,
            sOption: sOption || "user",
            choiceList: [
                { label: "Match", match: true },
                { label: "Exakt", match: false }
            ],
            clsStudents: clsSearch,
            match: true,
            isOpen: false,
            isNoOptions: false,
            response: null,
            showTips: localStorage.getItem("showTips") === "true"
        }

        this.source = axios.CancelToken.source();

        // Search options
        this.sOptions = [
            { label: "Användare", value: "user" },
            { label: "Klass elever", value: "members" }
        ]

        // Help texts
        this.helpTexts = [
            { label: "Användare", tip: "Det här alternativet är till för att söka efter en specifik användare. Välj rätt sökalternativ nedan för att få förväntad resultat.", value: "user", },
            { label: "Klass elever", tip: "Det här alternativet är till för att söka efter alla elever i en specifik klass med klass- och skolnamn.", value: "members" },
            { label: "Match", tip: "Matchningen av det angivna sökordet bland alla elevers Namn/Efternamn/Användarnamn vilka innehåller angivet sökord.", value: "match" },
            { label: "Exakt", tip: "Matchning med exakt stavat Namn/Efternamn/Användarnamn.", value: "exact" },
            { label: "Tips", tip: "Genom att klicka på varje sökalternativ aktiveras en dold tipsruta som visas när du för musen över sökalternativen.", value: "tips" },
            { label: "Resultat", tip: "Resultatet kan bli från 0 till flera hittade användare beroende på sökord och sökalternativ.", value: "", color: "#c00" }
        ]

        if (this.props.group !== "studenter") {
            this.sOptions = [];
            this.helpTexts.splice(1, 1);
        }
    }

    componentDidMount() {
        const token = sessionStorage.getItem("token");

        if (token === null || token === undefined) // Return to the start page if a user is unauthorized
            this.props.history.push("/login");
        else if (this.props.history.action === "POP") // Clean the old result if the page is refreshed
            sessionStorage.removeItem("users");
    }

    componentWillUnmount() {
        localStorage.setItem("showTips", this.state.showTips)
    }

    // Handle a change of text fields and radio input value
    valueChangeHandler = (e, open) => {
        if (!e.target) return;
        const inp = e.target;
        const inpRadio = (inp.type === "radio");
        this.setState({
            [inp.name]: inpRadio ? inp.value === "true" : inp.value,
            users: null,
            response: null,
            isNoOptions: (open) ? schools.filter(x => x.value.includes(inp.value)).length === 0 : false
        })
    }

    // Return one from help texts found by the keyword
    returnToolTipByKeyword(keyword) {
        if (!this.state.showTips) return "";
        return this.helpTexts.find(x => x.label === keyword)?.tip;
    }

    // Handle changes in search alternatives and parameters
    setSearchParameter = value => {
        this.setState({
            sOption: value,
            input: "",
            additionInput: "",
            users: null,
            match: this.state.clsStudents,
            clsStudents: !this.state.clsStudents
        })

        //  Save choice of search parameters in sessionStorage to mind the user choice and use it with page refresh
        sessionStorage.setItem("sOption", value)
    }

    // Switch show of tips
    switchShowTips = (showTips) => {
        localStorage.setItem("showTips", !showTips)
        this.setState({ showTips: !showTips })
    }

    // Reset form
    resetResult = () => {
        this.setState({ users: null, response: null });

        // Remove result from sessionStorage
        sessionStorage.removeItem("users");
        sessionStorage.removeItem("selectedUsers");
    }

    // Recognize Enter press to submit search form
    handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            this.setState({ [e.target.name]: e.target.value });
            this.getSearchResult.bind(this);
        }
    }

    // Function - submit form
    async getSearchResult(e) {
        e.preventDefault();

        // To authorize
        let _config = TokenConfig();
        _config.cancelToken = this.source.token;

        sessionStorage.removeItem("selectedUsers");
        sessionStorage.removeItem("users");

        // Update state parameters
        this.setState({ isLoading: true, users: null });

        // State parameters
        const { input, match, sOption, additionInput, clsStudents } = this.state;
        // Return if form is invalid
        if (input.length < 1) {
            this.setState({ isLoading: false });
            return;
        }

        // API parameters by chosen searching alternative
        const params = (!clsStudents) ? this.props.group + "/" + match : additionInput;

        // API request
        await axios.get("search/" + sOption + "/" + input + "/" + params, _config).then(res => {
            // Response
            const { users, errorMessage } = res.data;

            // Update state parameters
            this.setState({
                users: users || [],
                isLoading: false,
                input: users?.length > 0 ? "" : input,
                additionInput: users?.length > 0 ? "" : additionInput,
                response: users ? null : res.data
            })

            // If something is wrong, view error message in browser console
            if (errorMessage) console.error("Error => " + errorMessage)
        }, error => {
            // Error handle 
            this.setState({ isLoading: false })

            if (error?.response?.status === 401) {
                this.setState({
                    response: {
                        msg: "Åtkomst nekad! Dina atkomstbehörigheter ska kontrolleras på nytt.",
                        alert: "error"
                    }
                })
                setTimeout(() => {
                    this.props.history.push("/");
                }, 3000)
            } else if (error.code === "ERR_CANCELED") {
                this.source = axios.CancelToken.source();
                this.setState({
                    response: {
                        msg: error.message,
                        alert: "warning"
                    }
                })
                setTimeout(() => { this.resetResult(); }, 3000)
            } else
                console.error("Error => " + error.response)
        });
    }

    render() {
        // State parameters
        const { users, isLoading,
            choiceList, match, response,
            sOption, showTips,
            clsStudents, isOpen, isNoOptions } = this.state;

        // List of text fields
        const sFormParams = !clsStudents ? [{ name: "input", label: "Namn", placeholder: (!match) ? "Skriv exakt fullständigt namn eller anvädarnamn här ..." : "", autoOpen: false }]
            : [{ name: "input", label: "Klassbeteckning", clsName: "search-first-input", placeholder: "Skriv exakt klassbeteckning här ...", autoOpen: false },
            { name: "additionInput", label: "Skolnamn", clsName: "search-second-input", placeholder: "Skriv exakt skolnamn här ..", autoOpen: true }];

        const isActive = (this.state.input || this.state.additionInput).length > 0;

        return (
            <div className='interior-div' onSubmit={this.getSearchResult.bind(this)}>

                {/* Search form */}
                <form className='search-wrapper'>
                    {/* List loop of text fields */}
                    {sFormParams.map((s, index) => (
                        <Autocomplete
                            key={index}
                            freeSolo
                            disableClearable
                            className={s.clsName || 'search-input'}
                            options={schools}
                            getOptionLabel={(option) => option.label || ""}
                            autoHighlight
                            open={s.autoOpen && isOpen && !isNoOptions}
                            inputValue={this.state[s.name]}
                            onChange={(e, option) => (e.key === "Enter") ? this.handleKeyDown : this.setState({ [s.name]: option.value })}
                            onBlur={() => this.setState({ isOpen: false })}
                            onClose={() => this.setState({ isOpen: false })}
                            onFocus={() => this.setState({ isOpen: (s.autoOpen && !isNoOptions) })}
                            renderInput={(params) =>
                                <TextField
                                    {...params}
                                    name={s.name}
                                    label={s.label}
                                    error={response?.warning || false}
                                    required
                                    InputProps={{
                                        ...params.InputProps,
                                        maxLength: 30,
                                        minLength: 2
                                    }}
                                    value={this.state[s.name]}
                                    disabled={isLoading}
                                    placeholder={s.placeholder}
                                    onKeyDown={this.handleKeyDown}
                                    onChange={(e) => this.valueChangeHandler(e, s.autoOpen)}
                                    helperText={this.state[s.name].length > 0
                                        ? `${30 - this.state[s.name].length} tecken kvar` : "Min 2 & Max 30 tecken"}
                                />}
                        />
                    ))}

                    {/* Submit form - button */}
                    <Button
                        variant={isActive ? "contained" : "outlined"}
                        color={isActive ? "primary" : "inherit"}
                        className="search-button search-button-mobile"
                        type="submit"
                        disabled={!isActive || isLoading}>
                        <SearchSharp /></Button>

                    {/* Reset form - button */}
                    {isActive && <Button
                        variant="text"
                        color="error"
                        className="search-reset search-button-mobile"
                        disabled={isLoading}
                        onClick={() => this.setState({ input: "", additionInput: "", isOpen: false })}>
                        <SearchOffSharp />
                    </Button>}
                </form>

                {/* The search parameters to choice */}
                <div className="checkbox-radio-wrapper" >

                    {/* Modal  window with help texts */}
                    <ModalHelpTexts arr={this.helpTexts} cls="" isTitle="Förklaring av sökparametrar" />

                    {/* Switchable box */}
                    <FormControlLabel className='switch-btn'
                        control={<Switch checked={showTips} color='info'
                            onChange={this.switchShowTips.bind(this, showTips)}
                        />}
                        label="Tips" />

                    {/* Radio buttons to choice one of search alternatives */}
                    {this.sOptions.length > 0 && <FormControl className='checkbox-block-mobile' style={{ display: "inline-block" }}>
                        <RadioGroup row name="row-radio-buttons-group">
                            {/* Loop of radio input choices */}
                            {this.sOptions.map((p, index) => (
                                <Tooltip key={index} arrow disableHoverListener={!showTips} title={this.returnToolTipByKeyword(p.label)}
                                    classes={{ tooltip: "tooltip tooltip-green", arrow: "arrow-green" }}>
                                    <FormControlLabel
                                        value={sOption === p.value}
                                        control={<Radio
                                            size='small'
                                            checked={sOption === p.value}
                                            color="success" />}
                                        label={p.label}
                                        name="sOption"
                                        onChange={this.setSearchParameter.bind(this, p.value)} />
                                </Tooltip>
                            ))}
                        </RadioGroup>
                    </FormControl>}

                    {/* Checkbox and radio with search parameters to choose for user search */}
                    <FormControl style={{ display: (this.sOptions.length === 0) ? "inline-block" : "block" }}>
                        <RadioGroup row name="row-radio-buttons-group">
                            {/* Loop of radio input choices */}
                            {choiceList.map((c, index) => (
                                <Tooltip key={index} arrow disableHoverListener={!showTips} title={this.returnToolTipByKeyword(c.label)} classes={{ tooltip: "tooltip tooltip-blue", arrow: "arrow-blue" }}>
                                    <FormControlLabel
                                        value={c.match}
                                        control={<Radio
                                            size='small'
                                            checked={match === c.match}
                                            disabled={clsStudents} />}
                                        label={c.label}
                                        name="match"
                                        onChange={this.valueChangeHandler} />
                                </Tooltip>
                            ))}
                        </RadioGroup>
                    </FormControl >
                </div >

                {/* Result of search */}
                <Result
                    list={users}
                    clsStudents={clsStudents}
                    isVisibleTips={showTips}
                    group={this.props.group}
                    isLoading={isLoading}
                    response={response}
                    resultBlock={true}
                    cancelRequest={() => this.source.cancel("Pågående sökning har avbrutits ...")}
                    resetResult={this.resetResult.bind(this)}
                />
            </div >
        )
    }
}

export default withRouter(Search);