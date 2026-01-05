import { useEffect, useState, use } from 'react';

// Installed
import { useOutletContext, useLoaderData } from 'react-router-dom';
import { IconButton } from '@mui/material';
import { Close, CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import _ from 'lodash';

// Components
import AutocompleteList from '../../components/lists/AutocompleteList';
import ActionButtons from './../../components/blocks/ActionButtons';

// Storage
import { FetchContext } from '../../storage/FetchContext';

// Css
import './../../assets/css/view.css';


function EmployeeView() {

    const [approved, setApproved] = useState([]);
    const [isChanged, setChanged] = useState(false);

    const { managers, politicians } = useLoaderData();
    const { schools, moderator: userData } = useOutletContext();
    const { permissions } = userData;
    const columns = ["Närmaste chefer", ...permissions?.groups];
    const approvedManagers = managers.filter(x => permissions?.managers?.includes(x.username));
    const approvedPoliticians = politicians.filter(x => permissions?.politicians?.includes(x.name));

    const { fetchData, pending, response, handleResponse } = use(FetchContext);

    useEffect(() => {
        setApproved({
            managers: approvedManagers,
            politicians: (approvedPoliticians?.length > 0 ? approvedPoliticians : politicians),
            schools: permissions?.schools
        })
    }, [])

    useEffect(() => {
        const isChanged = _.isEqual(approvedManagers, approved.managers)
            && _.isEquals(approvedPoliticians, approved?.politicians)
            && _.isEquals(permissions?.schools, approved?.schools)

        setChanged(isChanged)
    }, [isChanged])

    function onChange(value, group, multiple) {
        if (!value || !group)
            return;

        let newValues;

        if (group === "managers") {
            newValues = multiple
                ? managers.filter(x => (x.managerName === value || x.username === value)
                    && !approved?.managers?.some(y => y.username === x.username)) : [value];
        } else if (group === "politician") {
            newValues = [value];
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
        console.log(value, group)
        setApproved(previous => {
            return {
                ...previous,
                [group]: previous[group]?.filter(x => id ? x[id] !== value : x !== value)
            }
        })
    }


    async function onSubmit() {
    //     setUpdating(true);

    //     const obj = JSON.parse(JSON.stringify(userData));
    //     delete obj.primary,
    //         delete obj.secondary,
    //         delete obj.boolValue,
    //         obj.offices = obj.includedList.map((o) => {
    //             return o?.primary;
    //         })
    //     obj.managers = obj.includedList.map((m) => {
    //         return {
    //             username: m?.id ?? m?.username,
    //             displayName: m?.primary,
    //             division: m?.secondary,
    //             disabled: m?.boolValue ?? false,
    //             default: m?.default ?? false
    //         }
    //     })
    //     delete obj.includedList;

    //     await fetchData({ api: `employees/group/${group}`, method: "put", data: obj })
    //     closeModal();
    }

    return (
        <>
            {isChanged && <ActionButtons pending={pending} onConfirm={onSubmit}/>}

            <div className="w-100 view-header d-row jc-between">
                {columns?.map((column, index) => (
                    <p key={index} className="w-100 d-row jc-start">{column}</p>
                ))}
            </div>

            <div className="w-100 d-row jc-start ai-start ai-stretch">
                {columns.map((column) => {
                    return <div key={column} className="view-body w-100">

                        {/* Personals managers dropdown list */}
                        {column === "Personal" && <AutocompleteList
                            key={approved.manager?.length}
                            label="Managers"
                            collection={managers.filter(x => !approved?.managers?.some(s => s?.username === x?.username))}
                            shrink={true}
                            onClick={(value) => onChange(value, "managers")}
                        />}

                        {/* Politician dropdown list */}
                        {column === "Politiker" && <AutocompleteList
                            key={approved.politicians?.length}
                            label="Politiker"
                            collection={politicians?.filter(x => !approved.politicians?.some(s => s?.name === x?.name))}
                            shrink={true}
                            keyword="name"
                            onClick={(value) => onChange(value, "politicians")}
                        />}

                        {/* School dropdown list */}
                        {column === "Studenter" && <AutocompleteList
                            key={approved.schools?.length}
                            label="Skolnamn"
                            collection={schools?.filter(x => !approved.schools?.some(s => s === x?.id))}
                            shrink={true}
                            keyword="id"
                            onClick={(value) => onChange(value, "schools")}
                        />}

                        <ul className="view-list-wrapper w-100">

                            {/* Managers list */}
                            {column === "Närmaste chefer" && userData?.managers?.map((manager, index) => {
                                const checked = approved?.managers?.find(x => x?.username === manager?.username);
                                return <li className="w-100 d-row jc-between" key={index}>
                                    {manager?.displayName}

                                    <IconButton disabled={checked} onClick={() => onChange(manager?.username, "managers", true)}>
                                        {checked ? <CheckBox /> : <CheckBoxOutlineBlank />}
                                    </IconButton>
                                </li>
                            })}

                            {/* Personals managers list */}
                            {column === "Personal" && approved?.managers?.map((item, index) => (
                                <li className="w-100 d-row jc-between" key={index}>
                                    <span>{item?.displayName} | <span className="secondary-span">{item?.office}</span></span>
                                    <IconButton onClick={() => onDelete(item?.username, "managers", "username")} color="error">
                                        <Close />
                                    </IconButton>
                                </li>
                            ))}

                            {/* Politician list */}
                            {column === "Politiker" && approved?.politicians?.sort((a, b) =>
                                a.displayName?.toLowerCase().localeCompare(b.displayName?.toLowerCase()))?.map((item, index) => (
                                    <li className="w-100 d-row jc-between" key={index}>
                                        <span>{item?.displayName} | <span className="secondary-span">{item?.office}</span></span>
                                        <IconButton onClick={() => onDelete(item?.name, "politicians", "name")} color="error">
                                            <Close />
                                        </IconButton>
                                    </li>
                                ))}

                            {/* School list */}
                            {column === "Studenter" && approved?.schools?.map((item, index) => (
                                <li className="w-100 d-row jc-between" key={index}>
                                    {item}
                                    <IconButton onClick={() => onDelete(item, "schools")} color="error">
                                        <Close />
                                    </IconButton>
                                </li>
                            ))}

                        </ul>
                    </div>
                })}
            </div>
        </>
    )
}

export default EmployeeView;