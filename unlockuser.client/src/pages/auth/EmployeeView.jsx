import { useState, use } from 'react';

// Installed
import { useOutletContext, useLoaderData } from 'react-router-dom';
import { IconButton, Collapse, List, ListItem, ListItemText, Button } from '@mui/material';
import { Close, CheckBox, CheckBoxOutlineBlank, Lock, DoNotDisturbAlt, Checklist } from '@mui/icons-material';
import _ from 'lodash';

// Components
import AutocompleteList from '../../components/lists/AutocompleteList';
import ActionButtons from './../../components/blocks/ActionButtons';
import Message from './../../components/blocks/Message';

// Functions
import { GetCnValue } from '../../functions/Helpers';

// Storage
import { FetchContext } from '../../storage/FetchContext';

// Css
import './../../assets/css/view.css';

function sortedValues(arr, key) {
    return [...(arr ?? [])]
        .sort((a, b) => (key ? a[key] : a)?.localeCompare(key ? b[key] : b))
        .map(x => key ? x[key] : x);
}

// approvedEmployees entries are { username, moderators } objects on both sides (loaded catalog vs local state),
// so comparing them needs both the entry order and each entry's moderators order normalized - a plain
// sortedValues(..., "username") turns one side into bare username strings and never matches.
function normalizedEmployees(arr) {
    return [...(arr ?? [])]
        .map(x => ({ username: x.username, moderators: [...(x.moderators ?? [])].sort() }))
        .sort((a, b) => a.username?.localeCompare(b.username));
}

function EmployeeView() {

    // const revalidator = useRevalidator();
    const { groupModels, schools } = useLoaderData();
    const { groups, moderator, managers, politicians, approvedEmployees, searchValue } = useOutletContext();
    const { permissions } = moderator;

    const approvedManagers = managers.filter(x => permissions?.managers?.includes(x.username));
    const approvedPoliticians = permissions.groups?.includes("Politiker") ?
        (permissions?.politicians?.length > 0 ? politicians.filter(x => permissions?.politicians?.includes(x?.username)) : politicians) : [];
    const approvedUsernames = approvedEmployees?.filter(x => x.moderators?.includes(moderator.username)).map((emp) => emp.username) ?? [];
    const columns = moderator?.managers?.length > 0 ? ["Närmaste chefer", ...groups] : groups;

    const { fetchData, pending, response, handleResponse } = use(FetchContext);

    const [approved, setApproved] = useState({
        managers: approvedManagers,
        politicians: approvedPoliticians,
        schools: permissions?.schools,
        employees: approvedEmployees ?? []
    });
    const [collapsed, setCollapsed] = useState(false);

    function onChange(value, group, multiple) {
        if (!value || !group)
            return;

        let newValues;

        if (group === "managers") {
            newValues = multiple
                ? managers.filter(x => (x.managerName === value || x.username === value)
                    && !approved?.managers?.some(y => y.username === x.username))
                : [value];
        } else if (group === "politicians") {
            newValues = politicians?.filter(x => x.username === value);
        } else if (group === "schools") {
            newValues = [value];
        } else if (group === "employees") {
            const existing = approved.employees.find(x => x.username === value);
            if (existing) {
                setApproved(previous => {
                    return {
                        ...previous,
                        [group]: previous[group].map(x => x.username === value
                            ? { ...x, moderators: [...(x.moderators ?? []), moderator.username] }
                            : x)
                    }
                })

                return;
            }

            const newValue = {
                username: value,
                moderators: [moderator?.username]
            }

            newValues = [newValue];
        }

        setApproved(previous => {
            return {
                ...previous,
                [group]: [...previous[group], ...newValues]
            }
        })
    }

    function onDelete(value, group, id) {
        if (!value || !group)
            return;

        if (group !== "employees") {
            setApproved(previous => {
                return {
                    ...previous,
                    [group]: previous[group]?.filter(x => id ? x[id] !== value : x !== value)
                }
            })
        } else {
            const existing = approved.employees.find(x => x.username === value);
            if (existing != null) {
                const remainingModerators = existing.moderators?.filter(x => x !== moderator?.username);
                setApproved(previous => {
                    return {
                        ...previous,
                        [group]: remainingModerators?.length === 0
                            ? previous[group].filter(x => x.username !== value)
                            : previous[group].map(x => x.username === value ? { ...x, moderators: remainingModerators } : x)
                    }
                })
            }
        }
    }

    async function onSubmit() {
        const data = {
            groups: permissions.groups,
            managers: approved?.managers?.map(x => x.username),
            politicians: approved?.politicians?.map(x => x.username),
            approvedEmployees: approved?.employees,
            schools: approved?.schools
        };

        await fetchData({ api: `user/update/permissions/${moderator?.username}`, method: "put", data: data, action: "success" });
    }

    const isChanged = !_.isEqual(permissions?.managers, sortedValues(approved?.managers, "username"))
        || !_.isEqual(sortedValues(approvedPoliticians, "username"), sortedValues(approved?.politicians, "username"))
        || !_.isEqual(permissions?.schools, sortedValues(approved?.schools))
        || !_.isEqual(normalizedEmployees(approvedEmployees), normalizedEmployees(approved?.employees));

    const searchTerm = searchValue?.toLowerCase();
    const employeesToChoose = searchValue?.length >= 3
        ? groupModels?.filter(x => x.username != moderator.username && !approvedUsernames.includes(x?.username)
            && [x?.primary, x?.username, x?.department, x?.office].some(field => field?.toLowerCase().includes(searchTerm)))
        : groupModels?.filter(x => approvedUsernames.includes(x.username));

    const collapseBlock = permissions.groups?.includes("Personal");

    return (
        <>
            <ActionButtons label="Behörighetslista" pending={pending} disabled={!isChanged} onConfirm={onSubmit}>
                {(collapseBlock && approvedUsernames?.length > 0) &&
                    <Button
                        startIcon={collapsed ? <Close /> : <Checklist />}
                        color={collapsed ? "default" : "primary"}
                        disabled={!!searchValue}
                        onClick={() => setCollapsed((collapsed) => !collapsed)}>
                        Godkända enskilda anställda
                    </Button>}
            </ActionButtons>

            {/* Hidden collapse block. Result of employee search */}
            {collapseBlock && <Collapse in={searchValue?.length >= 3 || collapsed} className='d-row w-100' timeout="auto" unmountOnExit>
                <List className="collapse-wrapper d-row jc-start w-100">
                    {employeesToChoose?.map((emp, index) => {
                        const managerUsername = GetCnValue(emp.manager);
                        const disabled = approved.managers.find(x => x.username === managerUsername) != null;
                        const checked = approved.employees.find(x => x?.username === emp?.username) || disabled;
                        return <ListItem key={index} className="li-collapse"
                            secondaryAction={
                                <IconButton 
                                    disabled={disabled}
                                    onClick={() => checked ? onDelete(emp?.username, "employees", "username") : onChange(emp?.username, "employees")}>
                                    {checked ? <CheckBox color="success" /> : <CheckBoxOutlineBlank />}
                                </IconButton>
                            }>
                            <ListItemText
                                primary={emp?.primary}
                                secondary={<>
                                    <span className="secondary-span no-l-margin">{emp?.department}</span>{" "}
                                    <span className="secondary-span">{emp?.office}</span>
                                </>} />
                        </ListItem>
                    })}
                </List>
            </Collapse>}

            {/* Response message */}
            {response && <Message res={response} cancel={() => handleResponse()} />}

            {/* Row of titles */}
            {!searchValue && <div className="w-100 view-header d-row jc-between">
                {columns?.map((column, index) => {
                    const disabled = !permissions.groups?.includes(column) && index > 0;
                    return <p key={index} className={`w-100 d-row jc-between${disabled ? " p-disabled" : ""}`}>
                        {column}
                        {(index > 0 && disabled) && <Lock color="default" fontSize="small" />}
                    </p>
                })}
            </div>}

            {/* Row of permissions */}
            {!searchValue && <div className="w-100 d-row jc-start ai-start ai-stretch">
                {columns?.map((column, index) => {
                    const disabled = !permissions.groups?.includes(column) && index > 0;
                    const hierarchy = column === "Närmaste chefer";

                    return <div key={column} className="view-body w-100" style={hierarchy ? { marginTop: 0 } : null}>

                        {/* Personals managers dropdown list */}
                        {(column === "Personal" && !disabled) && <AutocompleteList
                            key={approved.managers?.length}
                            label="Managers"
                            collection={managers.filter(x => !approved?.managers?.some(s => s?.username === x?.username))}
                            shrink={true}
                            disabled={pending}
                            onClick={(value) => onChange(value, "managers")}
                        />}

                        {/* Politician dropdown list */}
                        {(column === "Politiker" && !disabled) && <AutocompleteList
                            key={approved.politicians?.length}
                            label="Politiker"
                            collection={politicians?.filter(x => !approved.politicians?.some(s => s?.username === x?.username))}
                            shrink={true}
                            keyword="username"
                            disabled={pending}
                            onClick={(value) => onChange(value, "politicians")}
                        />}

                        {/* School dropdown list */}
                        {(column === "Studenter" && !disabled) && <AutocompleteList
                            key={approved.schools?.length}
                            label="Skolnamn"
                            collection={schools?.filter(x => !approved.schools?.some(s => s === x?.id))}
                            shrink={true}
                            keyword="id"
                            disabled={pending}
                            onClick={(value) => onChange(value, "schools")}
                        />}

                        <ul className="view-list-wrapper w-100">

                            {/* Managers list */}
                            {(hierarchy && !disabled && moderator?.managers?.length > 0) && moderator?.managers?.map((manager, index) => {
                                const checked = approved?.managers?.find(x => x?.username === manager?.username);
                                return <li className="w-100 d-row jc-between" key={index}>
                                    {manager?.displayName}

                                    {permissions.groups?.includes("Personal") && <IconButton disabled={checked} onClick={() => onChange(manager?.username, "managers", true)}>
                                        {checked ? <CheckBox /> : <CheckBoxOutlineBlank />}
                                    </IconButton>}
                                </li>
                            })}

                            {/* Personals managers list */}
                            {(column === "Personal" && !disabled) && approved?.managers?.map((item, index) => (
                                <li className="w-100 d-row jc-between" key={index}>
                                    <span>{item?.displayName} | <span className="secondary-span">{item?.office}</span></span>
                                    <IconButton onClick={() => onDelete(item?.username, "managers", "username")} color="error">
                                        <Close />
                                    </IconButton>
                                </li>
                            ))}

                            {/* Politicians list */}
                            {(column === "Politiker" && !disabled) && approved?.politicians?.sort((a, b) =>
                                a.displayName?.toLowerCase().localeCompare(b.displayName?.toLowerCase()))?.map((item, index) => (
                                    <li className="w-100 d-row jc-between" key={index}>
                                        <span>{item?.displayName} | <span className="secondary-span">{item?.office}</span></span>
                                        <IconButton onClick={() => onDelete(item?.username, "politicians", "username")} color="error">
                                            <Close />
                                        </IconButton>
                                    </li>
                                ))}

                            {/* Schools list */}
                            {column === "Studenter" && approved?.schools?.map((item, index) => (
                                <li className="w-100 d-row jc-between" key={index}>
                                    {item}
                                    <IconButton onClick={() => onDelete(item, "schools")} color="error">
                                        <Close />
                                    </IconButton>
                                </li>
                            ))}

                            {/* If permissions missed */}
                            {disabled && <li className="w-100 d-row jc-start li-disabled">
                                <DoNotDisturbAlt /> Behörighet saknas
                            </li>}
                        </ul>
                    </div>
                })}
            </div>}
        </>
    )
}

export default EmployeeView;