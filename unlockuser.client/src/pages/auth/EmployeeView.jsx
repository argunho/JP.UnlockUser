import { useEffect, useState } from 'react';

// Installed
import { useOutletContext, useLoaderData } from 'react-router-dom';
import { Checkbox } from '@mui/material';


// Components
import Message from '../../components/blocks/Message';

// Css
import './../../assets/css/view.css';
function EmployeeView() {

    const [rows, setRows] = useState([]);
    const [columns, setColumns] = useState([]);

    const { loading, school, moderator: userData } = useOutletContext();
    const managers = useLoaderData();

    console.log(userData)

    const { permissions: ps } = userData;

    useEffect(() => {
        const hasGroups = ps.groups?.length > 0;
        const hasSchools = ps.schools?.length > 0;

        const approvedManagers = managers?.filter(x => ps.managers?.includes(x?.username)) ?? [];
        console.log(approvedManagers, ps.managers)
        const hasManagers = approvedManagers?.length > 0;

        const maxLength = Math.max(
            ps?.groups?.length ?? 0,
            approvedManagers?.length,
            ps?.schools?.length ?? 0
        );

        const columns = [];
        if (hasGroups)
            columns.push({ name: "group", label: "Lösenordshanteringgrupper" });
        if (hasManagers)
            columns.push({ name: "manager", label: "Chef | Avdelning" });
        if (hasSchools)
            columns.push({ name: "school", label: "Skola" });

        setColumns(columns);

        const rows = [];
        for (let i = 0; i < maxLength; i++) {
            const row = {};
            if (hasGroups)
                row.group = ps?.groups[i] ?? "";
            if (hasManagers)
                row.manager = ((approvedManagers[i]?.displayName ?? "") + " | " + (approvedManagers[i]?.office ?? "")).trim();
            if (hasSchools)
                row.school = ps?.schools[i] ?? "";

            rows.push(row);
        }

        console.log("rows", rows)

        setRows(rows);
    }, [])

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

    if (columns?.length === 0 || rows?.length == 0)
        return <Message res={{ color: "warning", msg: "Ingen data att visa ..." }} />;

    return (
        <>
            <table className="w-100">
                <thead className="w-100 view-header d-column">
                    <tr className="w-100 d-row jc-between">
                        {columns?.map((column, index) => (
                            <th key={index} className="w-100 d-column ai-start">{column?.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="w-100 view-body d-column jc-start">
                    {rows?.map((row, index) => (
                        <tr key={index} className="w-100 d-row jc-between">
                            {columns?.map((column, ind) => (
                                <td key={column.name} className={`w-100 d-row jc-between${!row[column.name] ? " empty" : ""}`}>
                                    {row[column.name]}
                                    {(ind > 0 && row[column.name]) && <Checkbox checked />}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    )
}

export default EmployeeView;