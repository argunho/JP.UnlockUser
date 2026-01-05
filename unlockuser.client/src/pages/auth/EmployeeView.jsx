import { useEffect, useState, use } from 'react';

// Installed
import { useOutletContext, useLoaderData } from 'react-router-dom';
import { IconButton } from '@mui/material';
import { Close, CheckBox, CheckBoxOutlineBlank, Lock, DoNotDisturbAlt } from '@mui/icons-material';
import _ from 'lodash';

// Components
import AutocompleteList from '../../components/lists/AutocompleteList';
import ActionButtons from './../../components/blocks/ActionButtons';
import Message from './../../components/blocks/Message';

// Storage
import { FetchContext } from '../../storage/FetchContext';

// Css
import './../../assets/css/view.css';


function EmployeeView() {

    const [approved, setApproved] = useState([]);
    const [isChanged, setChanged] = useState(false);

    const { managers, politicians } = useLoaderData();
    const { schools, groups, moderator: userData } = useOutletContext();
    const { permissions } = userData;
    const columns = ["Närmaste chefer", ...groups];

    const approvedManagers = managers.filter(x => permissions?.managers?.includes(x.username));
    const approvedPoliticians = permissions.groups.includes("Politiker") ?
        (permissions?.politicians?.length > 0 ? politicians.filter(x => permissions?.politicians?.includes(x.name)) 
        :  politicians) : [];

    const { fetchData, pending, response, handleResponse } = use(FetchContext);

    useEffect(() => {
        setApproved({
            managers: approvedManagers,
            politicians: approvedPoliticians,
            schools: permissions?.schools
        })
    }, [])

    useEffect(() => {
        const isChanged = !_.isEqual(permissions?.managers, approved?.managers?.sort((a, b) => a.username?.localeCompare(b.username)))
            || !_.isEqual(approvedPoliticians, approved?.politicians?.sort((a, b) => a.name?.localeCompare(b.name)))
            || !_.isEqual(permissions?.schools, approved?.schools?.sort((a, b) => a?.localeCompare(b)))

        setChanged(isChanged)
    }, [approved])

    function onChange(value, group, multiple) {
        if (!value || !group)
            return;

        let newValues;

        if (group === "managers") {
            newValues = multiple
                ? managers.filter(x => (x.managerName === value || x.username === value)
                    && !approved?.managers?.some(y => y.username === x.username)) 
                : managers.filter(x => x.username === value);
        } else if (group === "politicians") {
            newValues = politicians?.filter(x => x.name === value);
        } else if (group === "schools") {
            newValues = [value];
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

        setApproved(previous => {
            return {
                ...previous,
                [group]: previous[group]?.filter(x => id ? x[id] !== value : x !== value)
            }
        })
    }

    async function onSubmit() {
        const data = {
            groups: permissions.groups,
            managers: approved?.managers?.map(x => x.username),
            politicians: approved?.politicians?.map(x => x.name),
            schools: approved?.schools
        };
        console.log(data)

        await fetchData({ api: `user/update/permissions/${userData?.name}`, method: "put", data: data })
    }

    return (
        <>
            <ActionButtons pending={pending} disabled={!isChanged } onConfirm={onSubmit} />

            {/* Response message */}
            {response && <Message res={response} cancel={() => handleResponse()} />}

            <div className="w-100 view-header d-row jc-between">
                {columns?.map((column, index) => {
                    const disabled = !permissions.groups?.includes(column) && index > 0;
                    return <p key={index} className={`w-100 d-row jc-between${disabled ? " p-disabled" : ""}`}>
                        {column}
                        {(index > 0 && disabled) && <Lock color="default" fontSize="small" />}
                    </p>
                })}
            </div>

            <div className="w-100 d-row jc-start ai-start ai-stretch">
                {columns.map((column, index) => {
                    const disabled = !permissions.groups?.includes(column) && index > 0;
                    return <div key={column} className="view-body w-100">

                        {/* Personals managers dropdown list */}
                        {(column === "Personal" && !disabled) && <AutocompleteList
                            key={approved.manager?.length}
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
                            collection={politicians?.filter(x => !approved.politicians?.some(s => s?.name === x?.name))}
                            shrink={true}
                            keyword="name"
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
                            {(column === "Närmaste chefer" && !disabled) && userData?.managers?.map((manager, index) => {
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
                                        <IconButton onClick={() => onDelete(item?.name, "politicians", "name")} color="error">
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
            </div>
        </>
    )
}

export default EmployeeView;