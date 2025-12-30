import { useEffect, useState } from 'react';

// Installed
import { useOutletContext, useLoaderData } from 'react-router-dom';
import { IconButton } from '@mui/material';
import { Close, CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';

// Components
import AutocompleteList from '../../components/lists/AutocompleteList';

// Css
import './../../assets/css/view.css';

const columns = ["Närmaste chefer", "Avdelning", "Skola"];


function EmployeeView() {

    const [approved, setApproved] = useState([]);

    const managers = useLoaderData();
    const { schools, moderator: userData } = useOutletContext();
    const { permissions } = userData;

    useEffect(() => {
        const approvedManagers = managers.filter(x => permissions?.managers?.includes(x.username));
        console.log(approvedManagers, userData.managers);
        setApproved({
            managers: approvedManagers,
            schools: permissions?.schools
        })
    }, [])

    function onChange(value) {
        var newManagers = managers.filter(x => (x.managerName === value || x.username === value)
            && !approved.managers.some(y => y.username === x.username));
        setApproved(previous => {
            return {
                ...previous,
                managers: [...previous.managers, ...newManagers]
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

            <div className="w-100 view-body d-row jc-start ai-start">
                <ul className="w-100">
                    {userData?.managers?.map((manager, index) => {
                        const checked = approved?.managers?.find(x => x.username === manager?.username);
                        return <li className="w-100 d-row jc-between" key={index}>
                            {manager?.displayName}

                            <IconButton disabled={checked} onClick={() => onChange(manager?.username)}>
                                {checked ? <CheckBox /> : <CheckBoxOutlineBlank />}
                            </IconButton>
                        </li>
                    })}
                </ul>

                {/* Managers list */}
                <ul className="w-100">
                    <AutocompleteList
                        label="Managers"
                        name="name"
                        collection={managers}
                        shrink={true}
                        keyword="username"
                        placeholder="Välj Manager .."
                    />

                    {approved?.managers?.map((manager, index) => (
                        <li className="w-100 d-row jc-between" key={index}>
                            <span>{manager?.displayName} | <span className="secondary-span">{manager?.office}</span></span>
                            <IconButton onClick={() => onDelete(manager?.username)} color="error">
                                <Close />
                            </IconButton>
                        </li>
                    ))}
                    {approved?.managers?.length === 0 && <li className="d-row li-empty">Ingen data att visa ...</li>}
                </ul>

                {/* Schools list */}
                <ul className="w-100">

                    <AutocompleteList
                        label="Skolnamn"
                        name="school"
                        collection={schools}
                        shrink={true}
                        keyword="id"
                        placeholder="Välj skolnamn .."
                    />


                    {approved?.schools?.map((school, index) => (
                        <li className="w-100 d-row jc-between" key={index}>
                            {school}
                            <IconButton onClick={() => onDelete(school)} color="error">
                                <Close />
                            </IconButton>
                        </li>
                    ))}
                    {approved?.schools?.length === 0 && <li className=" d-row li-empty">Ingen data att visa ...</li>}
                </ul>
            </div >
        </>
    )
}

export default EmployeeView;