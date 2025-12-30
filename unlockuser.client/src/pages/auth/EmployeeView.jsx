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

    const { permissions: ps } = userData;
    console.log(managers, ps)

    useEffect(() => {
        const hasGroups = ps.passwordManageGroups?.length > 0;
        const hasSchools = ps.schools?.length > 0;

        const approvedManagers = managers?.filter(x => ps.managers?.includes(x?.username)) ?? [];
        const hasManagers = approvedManagers?.length > 0;

        const maxLength = Math.max(
            ps?.passwordManageGroups?.length ?? 0,
            approvedManagers?.length,
            ps?.schools?.length ?? 0
        );
console.log(maxLength)
        const columns = [];
        if (hasGroups)
            columns.push({ name: "group", label: "Lösenordshanteringgrupper" });
        if (hasManagers)
            columns.push({ name: "manager", label: "Chef | Avdelning" });
        if (hasSchools)
            columns.push({ name: "school", label: "Skola" });

        setColumns(columns);
console.log(hasGroups, hasManagers, hasSchools)

        const rows = [];
        for (let i = 0; i < maxLength; i++) {
            const row = {};
            if (hasGroups)
                row.group = ps?.passwordManageGroups[i] ?? "";
            if (hasManagers)
                row.manager = ((approvedManagers[i]?.displayName ?? "") + " " + (approvedManagers[i]?.office ?? "")).trim();
            if (hasSchools)
                row.school = ps?.schools[i] ?? "";

            rows.push(row);
        }
        
console.log("rows", rows)

        setRows(rows);
    }, [])

    if (columns?.length === 0 || rows?.length == 0)
        return <Message res={{color: "warning",  msg: "Ingen data att visa ..."}} />;

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