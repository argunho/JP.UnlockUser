import { useEffect, useState } from 'react';

// Installed
import { useOutletContext, useLoaderData } from 'react-router-dom';
import { IconButton } from '@mui/material';
import { Close, CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';

// Components
import AutocompleteList from '../../components/lists/AutocompleteList';

// Css
import './../../assets/css/view.css';


function EmployeeView() {

    const [approved, setApproved] = useState([]);

    const managers = useLoaderData();
    const { schools, moderator: userData } = useOutletContext();
    const { permissions } = userData;
    const columns = ["Närmaste chefer", ...permissions?.groups];
console.log(schools)
    useEffect(() => {
        const approvedManagers = managers.filter(x => permissions?.managers?.includes(x.username));
        console.log(approvedManagers, userData.managers);
        setApproved({
            managers: approvedManagers,
            schools: permissions?.schools
        })
    }, [])

    function onChange(value, group, multiple) {
        if(!value || !group)
            return;

        let newValues;

        if (group === "managers") {
            newValues = multiple
                ?  managers.filter(x => (x.managerName === value || x.username === value)
                && !approved?.managers?.some(y => y.username === x.username)) : [value];
        } else if (group === "politician") {
            newValues = [value];
        } else if(group === "school") {
            newValues = [value];
        }




        setApproved(previous => {
            return {
                ...previous,
                [group]: [...previous[group], ...newValues]
            }
        })
    }

    function onDelete(value) {
        setApproved(previous => {
            return {
                ...previous,
                managers: previous.managers.filter(x => x.username !== value)
            }
        })
    }


    // async function onSubmit() {
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
    // }

    return (
        <>
            <div className="w-100 view-header d-row jc-between">
                {columns?.map((column, index) => (
                    <p key={index} className="w-100 d-row jc-start">{column}</p>
                ))}
            </div>

            <div className="w-100 view-body d-row jc-start ai-start ai-stretch">

                {columns.map((column) => {
                    return <ul key={column} className="w-100">

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
                        {column === "Personal" && <>
                            <AutocompleteList
                                label="Managers"
                                collection={managers.filter(x => !approved?.managers?.some(s => s?.username === x?.username))}
                                shrink={true}
                                onClick={(value) => onChange(value, "managers")}
                            />

                            {approved?.managers?.map((manager, index) => (
                                <li className="w-100 d-row jc-between" key={index}>
                                    <span>{manager?.displayName} | <span className="secondary-span">{manager?.office}</span></span>
                                    <IconButton onClick={() => onDelete(manager?.username)} color="error">
                                        <Close />
                                    </IconButton>
                                </li>
                            ))}
                        </>}

                        {/* Politician list */}
                        {column === "Politiker" && <>
                            <AutocompleteList
                                label="Politiker"
                                collection={schools.filter(x => !approved.schools?.includes(x?.name))}
                                shrink={true}
                                keyword="name"
                                onClick={(value) => onChange(value, "politician")}
                            />
                        </>}

                        {/* School list */}
                        {column === "Studenter" && <>
                            <AutocompleteList
                                label="Skolnamn"
                                collection={schools.filter(x => !approved.schools?.includes(x?.name))}
                                shrink={true}
                                keyword="id"
                                onClick={(value) => onChange(value, "school")}
                            />


                            {approved?.schools?.map((school, index) => (
                                <li className="w-100 d-row jc-between" key={index}>
                                    {school}
                                    <IconButton onClick={() => onDelete(school)} color="error">
                                        <Close />
                                    </IconButton>
                                </li>
                            ))}
                        </>}
                    </ul>;
                })}

            </div >
        </>
    )
}

export default EmployeeView;