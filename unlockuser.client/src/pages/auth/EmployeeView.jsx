import { useState, use } from 'react';

// Installed
import { useOutletContext, useLoaderData, useRevalidator, useNavigate } from 'react-router-dom';
import { IconButton, Collapse, List, ListItem, ListItemText, Tooltip } from '@mui/material'; // , FormControlLabel, Checkbox, FormControl, InputLabel, Select, OutlinedInput, MenuItem
import {CheckBox, CheckBoxOutlineBlank, VerifiedUser } from '@mui/icons-material';
import _ from 'lodash';

// Components
import ActionsTab from './../../components/blocks/ActionsTab';
import Message from './../../components/blocks/Message';
import ModalCaseForm from './../../components/modals/ModalCaseForm';
import ModalSuccess from './../../components/modals/ModalSuccess';
import PermissionsTable from '../../components/blocks/PermissionsTable';

// Functions
import { GetCnValue } from '../../functions/Helpers';

// Storage
import { FetchContext } from '../../storage/FetchContext';

// Css
import './../../assets/css/view.css';

const labels = [
    {
        name: "Behörighetslista",
        key: "permissions"
    },
    {
        name: "Godkända anställda",
        key: "employees"
    },
    {
        name: "Godkända arbetsplatser",
        key: "offices"
    }
]

function sortedValues(arr, key) {
    return [...(arr ?? [])]
        .sort((a, b) => (key ? a[key] : a)?.localeCompare(key ? b[key] : b))
        .map(x => key ? x[key] : x);
}

function EmployeeView() {

    const { members, offices } = useLoaderData();
    const revalidator = useRevalidator();
    const navigate = useNavigate();
    const context = useOutletContext(); 
    const { moderator, managers, politicians, access, search, revalidate } = context;//, roles
    const { permissions } = moderator;

    const approvedManagers = managers.filter(x => permissions?.managers?.includes(x.username));
    const approvedPoliticians = permissions.groups?.includes("Politiker") ?
        (permissions?.politicians?.length > 0 ? politicians.filter(x => permissions?.politicians?.includes(x?.username)) : politicians) : [];
    const approvedEmployees = permissions.employees;
    const approvedOffices = permissions.offices;
    // const columns = moderator?.managers?.length > 0 ? ["Närmaste chefer", ...groups] : groups;

    const { fetchData, pending, response, handleResponse, success } = use(FetchContext);

    const [caseEmployees, setCaseEmployees] = useState([]);
    const [collapsed, setCollapsed] = useState(false);
    const [caseModal, setCaseModal] = useState(false);
    const [dropdownItems, setDropDownItems] = useState([]);
    const [dropdownTitle, setDropdownTitle] = useState(null);

    // const [selected, setSelected] = useState([]);

    const approvedPermissions = { approvedManagers, approvedPoliticians, schools: permissions?.schools, approvedEmployees, approvedOffices };
    const [approvedSource, setApprovedSource] = useState(approvedPermissions);

    const _approved = {
        managers: approvedManagers,
        politicians: approvedPoliticians,
        schools: permissions?.schools,
        employees: approvedEmployees ?? [],
        offices: approvedOffices
    }
    const [approved, setApproved] = useState(_approved);

    const sourceChanged = !_.isEqual(approvedSource.approvedManagers, approvedManagers)
        || !_.isEqual(approvedSource.approvedPoliticians, approvedPoliticians)
        || !_.isEqual(approvedSource.schools, permissions?.schools)
        || !_.isEqual(approvedSource.approvedEmployees, approvedEmployees)
        || !_.isEqual(approvedSource.approvedOffices, approvedOffices);

    if (sourceChanged) {
        setApprovedSource(approvedPermissions);
        setApproved(_approved);
    }

    const managersChanged = !_.isEqual(permissions?.managers, sortedValues(approved?.managers, "username"));
    const politiciansChanged = !_.isEqual(sortedValues(approvedPoliticians, "username"), sortedValues(approved?.politicians, "username"));
    const schoolsChanged = !_.isEqual(permissions?.schools, sortedValues(approved?.schools));
    const employeesChanged = !_.isEqual(sortedValues(approvedEmployees), sortedValues(approved?.employees)); // 2026-10-23 20:40
    const officesChanged = !_.isEqual(sortedValues(approvedOffices), sortedValues(approved?.offices));


    const sv = search?.value?.toLowerCase();
    const svl = sv?.length >= 2;
    const dropdown = svl || collapsed;


    function handleApprovedChange(value, group, multiple = null) {

        if (!group) return;

        let newValues;

        if (group === "managers") {
            if (typeof value === "string" && !multiple) {
                value = managers.find(x => x.username == value);
            }
            newValues = multiple
                ? managers.filter(x => (x.managerName === value || x.username === value)
                    && !approved?.managers?.some(y => y.username === x.username))
                : [value];
        } else if (group === "politicians") {
            newValues = politicians?.filter(x => x.username === value);
        } else if (group === "schools") {
            newValues = [value];
        } else if (group === "employees") {
            // start: 2026-10-23 20:40
            if (access?.limited && svl) {
                setCaseEmployees(previous => previous.includes(value) ? previous : [...previous, value]);
                return;
            }

            if (approved.employees.includes(value))
                return;

            newValues = [value];
            // end
        } else if (group == "offices") {
            if (approved.offices.includes(value))
                return;

            newValues = [value];
        }
        setApproved(previous => {
            return {
                ...previous,
                [group]: [...previous[group], ...newValues]
            }
        })
    }

    async function onSubmitChange() {
        const data = {
            username: moderator?.username,
            names: []
        };

        // start: 2026-10-23 20:40
        // Employees are now stored in the moderators catalog (Permissions.Employees), so they are saved together with the other lists
        if (managersChanged || politiciansChanged || schoolsChanged || employeesChanged || officesChanged) {
            data.managers = approved?.managers?.map(x => x.username);
            data.politicians = approved?.politicians?.map(x => x.username);
            data.schools = approved?.schools;
            data.employees = approved?.employees;
            data.offices = approved?.offices;
            data.names.push("moderators")
        }
        // end

        await fetchData({ api: `catalogs/update/moderators/permission`, method: "put", data: data, action: "success" });
    }

    function onChange(primary, secondary = null, multiple = null) {

        if (!primary)
            return;

        let items = [];
        let close = false;
        switch (primary) {
            case "save":
                access?.open ? onSubmitChange() : setCaseModal(true);
                close = true;
                break;
            case "permissions":
                close = true;
                if (dropdownTitle)
                    revalidate(false);
                break;
            case "employees":
                items = members?.filter(x => approvedEmployees?.includes(x.username));
                break;
            case "office":              
                items = members?.filter(x => x.manager?.includes(secondary?.username));
                setDropdownTitle(secondary?.office);
                break;
            case "offices":
                items = approvedOffices;
                break;
            // start: 2026-10-26 15:45
            case "search": {
                items = !svl ? [] : search.work
                    ? offices?.filter(x => x?.toLowerCase().startsWith(sv))
                    : members?.filter(x => x.username != moderator.username && !approvedEmployees?.includes(x?.username)
                        && [x?.primary, x?.username, x?.department, x?.office].some(field => field?.toLowerCase().includes(sv)));
                if (svl)
                    setDropdownTitle(svl ? `Sök resultat <span class="secondary-span">${(search.work ? "Arbetsplatser" : "Anställda")}: ${items?.length}<span/>` : null);
                else {
                    onChange("permissions");
                    return;
                }
                break;
            }
            // end
            default:
                handleApprovedChange(primary, secondary, multiple);
                return;
        }

        if (close) {
            setCollapsed(false);
            if (dropdownTitle)
                setDropdownTitle(null);
        }
        else if (!collapsed)
            setCollapsed(true);

        setDropDownItems(items);
        // handleCollapse();
    }

    function onDelete(value, group, id) {
        if (!value || !group)
            return;

        // start: 2026-10-23 20:40
        if (group === "employees" && access?.limited && svl) {
            setCaseEmployees(previous => previous.filter(x => x !== value));
            return;
        }

        setApproved(previous => {
            return {
                ...previous,
                [group]: previous[group]?.filter(x => id ? x[id] !== value : x !== value)
            }
        })
        // end
    }

    function onNavigate(name){
        navigate(`/moderators/view/${name}`, { replace: true });
    }

    function onRevalidate() {
        onChange("permissions");
        revalidate();
        setTimeout(() => {
            handleResponse();
            revalidator.revalidate();
        }, 500)
    }

    // start: 2026-10-26 15:47
    // Recalculate search results during render when search changes (instead of setState inside useEffect)
    const [prevSearch, setPrevSearch] = useState(null);
    if (search !== prevSearch) {
        setPrevSearch(search);
        onChange("search");
    }
    // end

    const isChanged = managersChanged || politiciansChanged || schoolsChanged || employeesChanged || officesChanged;

    return (
        <>
            {/* Action panel */}
            <ActionsTab
                key={success.toString()}
                viewLabel={dropdownTitle}
                labels={svl ? labels?.slice(0, 1) : labels}
                pending={pending}
                disabled={access?.open ? !isChanged : caseEmployees?.length === 0}
                action={access?.limited ? {
                    name: "Registrera ärende i Topdesk",
                    color: "warning",
                    confirm: false
                } : null}
                onClick={onChange} />

            {/* 
                {!!roles && <FormControl sx={{ m: 1, width: 260 }}>
                    <InputLabel id="demo-multiple-checkbox-label">Tillgång till Overview</InputLabel>
                    <Select
                        multiple
                        value={selected}
                        //   onChange={handleChange}
                        input={<OutlinedInput label="Tag" />}
                        renderValue={(s) => s.join(', ')}
                    >
                        {Object.keys(roles).map((name) => {
                            const SelectionIcon = selected.includes(name) ? CheckBox : CheckBoxOutlineBlank;

                            return (
                                <MenuItem key={name} value={name}>
                                    <SelectionIcon
                                        fontSize="small"
                                        style={{ marginRight: 8, padding: 9, boxSizing: 'content-box' }}
                                    />
                                    <ListItemText primary={name} />
                                </MenuItem>
                            );
                        })}
                    </Select>
                </FormControl>} */}


            {/* Hidden collapse block. Result of employee search */}
            {permissions.groups?.includes("Personal") && <Collapse
                in={dropdown}
                className='d-row w-100'
                timeout="auto"
                unmountOnExit>

                {/* List of search result */}
                {dropdownItems?.length > 0 && <List className="collapse-wrapper d-row jc-start w-100 fade-in">

                    {/* Dropdown list */}
                    {dropdownItems?.map((item, index) => {
                        const offices = (search.work || !item?.manager);
                        const managerUsername = offices ? null : GetCnValue(item.manager);
                        const selected = approved.managers.find(x => x.username === managerUsername) != null && !item.permissions || item?.username == moderator?.username || (typeof item == "string" && moderator?.office?.toLowerCase() === item?.toLowerCase());
                        const checked = ((svl && access?.limited) ? caseEmployees : approved.employees).includes(item?.username) || approved.offices.includes(item) || selected; // 2026-10-23 20:40
                        const value = offices ? item : item?.username;
                        const type = offices ? "offices" : "employees";
                        return <ListItem key={index} className="li-collapse"
                            secondaryAction={
                                <div className="d-row">
                                    {!offices && item.permissions && <Tooltip title="Administratör" arrow>
                                        <IconButton onClick={() => onNavigate(item?.username)}>
                                            <VerifiedUser fontSize="small" color="success" />
                                        </IconButton>                                      
                                    </Tooltip>}
                                    <IconButton
                                        disabled={selected || (!sv && access?.limited)}
                                        onClick={() => checked ? onDelete(value, type) : onChange(value, type)}>
                                        {checked ? <CheckBox color="success" /> : <CheckBoxOutlineBlank />}
                                    </IconButton>
                                </div>
                            }>
                            <ListItemText
                                primary={item?.primary ?? item}
                                secondary={offices ? null : <>
                                    <span className="secondary-span no-l-margin">{item.department === item?.office ? item?.division : item?.department}</span>{" "}
                                    <span className="secondary-span">{item?.office}</span>{" "}
                                    <span className="secondary-span">{item?.title}</span>
                                </>} />
                        </ListItem>
                    })}
                </List>}

                {/* Message if is none employees to view */}
                {dropdownItems?.length == 0 && <Message res={{ color: "warning", msg: "Inga matchande resultat hittades." }} close={false} />}
            </Collapse>}

            {/* Response message */}
            {response && <Message res={response} cancel={() => handleResponse()} />}

            {(!sv && !collapsed) && <PermissionsTable
                props={context}
                approved={approved}
                pending={pending}
                onChange={onChange}
                onDelete={onDelete} />}

            {/* Form modal */}
            {caseModal && <ModalCaseForm
                props={{
                    username: moderator?.username,
                    employees: caseEmployees // 2026-10-23 20:40
                }}
                label="Kommentarer och ytterligare information (frivilligt)"
                api="kc-group"
                onClose={() => setCaseModal(false)} />}

            {/* Success modal */}
            {success && <ModalSuccess onClose={onRevalidate} />}
        </>
    )
}

export default EmployeeView;