// Installed
import { IconButton } from '@mui/material';
import {
    Close, CheckBox, CheckBoxOutlineBlank, Lock, DoNotDisturbAlt
} from '@mui/icons-material';

// Components
import AutocompleteList from "../lists/AutocompleteList";

function PermissionsTable({ props, approved, pending, onChange, onDelete }) {

    const { groups, moderator, managers, politicians, access, schools } = props;

    const { permissions } = moderator;

    const columns = moderator?.managers?.length > 0 ? ["Närmaste chefer", ...groups] : groups;

    return (
        <>

            {/* Row of titles */}
            <div className="w-100 view-header d-row jc-between fade-in">
                {columns?.map((column, index) => {
                    const disabled = !permissions.groups?.includes(column) && index > 0;
                    return <p key={index} className={`w-100 d-row jc-between${disabled ? " p-disabled" : ""}`}>
                        {column}
                        {(index > 0 && disabled) && <Lock color="default" fontSize="small" />}
                    </p>
                })}
            </div>

            {/* Row of permissions */}
            <div className="w-100 d-row jc-start ai-start ai-stretch">
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

                                    {permissions.groups?.includes("Personal") &&
                                        <IconButton
                                            color={checked ? "success" : "default"}
                                            onClick={() => checked
                                                ? onDelete(manager?.username, "managers", "username")
                                                : onChange(manager?.username, "managers", false)}
                                            disabled={!access?.open}>
                                            {checked ? <CheckBox /> : <CheckBoxOutlineBlank />}
                                        </IconButton>}
                                </li>
                            })}

                            {/* Personals managers list */}
                            {(column === "Personal" && !disabled) && approved?.managers?.map((item, index) => (
                                <li className="w-100 d-row jc-between" key={index}>
                                    <span>{item?.displayName} | <span className="secondary-span" onClick={() => onChange("office", item)}>{item?.office}</span></span>
                                    {access?.open && <IconButton onClick={() => onDelete(item?.username, "managers", "username")} color="error">
                                        <Close />
                                    </IconButton>}
                                </li>
                            ))}

                            {/* Politicians list */}
                            {(column === "Politiker" && !disabled) && approved?.politicians?.sort((a, b) =>
                                a.displayName?.toLowerCase().localeCompare(b.displayName?.toLowerCase()))?.map((item, index) => (
                                    <li className="w-100 d-row jc-between" key={index}>
                                        <span>{item?.displayName} | <span className="secondary-span">{item?.office}</span></span>
                                        {access?.open && <IconButton onClick={() => onDelete(item?.username, "politicians", "username")} color="error">
                                            <Close />
                                        </IconButton>}
                                    </li>
                                ))}

                            {/* Schools list */}
                            {column === "Studenter" && approved?.schools?.map((item, index) => (
                                <li className="w-100 d-row jc-between" key={index}>
                                    {item}
                                    {access?.open && <IconButton onClick={() => onDelete(item, "schools")} color="error">
                                        <Close />
                                    </IconButton>}
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

export default PermissionsTable;
