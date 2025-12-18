import { useEffect, useState, use, useRef } from 'react';

// Installed
import { useOutletContext, useNavigate } from 'react-router-dom';
import { IconButton, FormControl, TextField, InputAdornment } from '@mui/material';
import { ChevronRight, Policy, Edit, SearchSharp, SearchOffSharp } from '@mui/icons-material';

// Components
import TabPanel from '../../components/blocks/TabPanel';

// Functions
import { DecodedClaims } from './../../functions/DecodedToken';

// Storage
import { FetchContext } from '../../storage/FetchContext';


function Overview() {

    const [control, setControl] = useState(false);

    const { id, collections } = useOutletContext();

    const { permissions, groups, access } = DecodedClaims();
    const { fetchData, resData, response } = use(FetchContext)

    const user = groups.split(",").flatMap(g => collections[g.toLowerCase()]).find(x => x.name === id);
    const accessToPasswordManage = JSON.parse(permissions)?.find(x => x.Name === user.group) != null;

    console.log(user, JSON.parse(permissions))
    const navigate = useNavigate();
    const ref = useRef(null);

    useEffect(() => {
        if (!access)
            navigate(-1);
    }, [])

    function onSubmit() {

    }

    return <>
        {/* Tab menu */}
        <TabPanel primary={user.primary ?? "Anvädarprofil"} secondary={
            `<span class="secondary-span view">${user?.title ? user?.title : (user?.passwordLength > 8 ? "Anställd" : "Student")}</span>`
        }>
            {/* If account is blocked */}
            <div className="d-row">
                {user?.isLocked && <span className="unlock-span locked-account">Kontot är låst</span>}

                {/* If the current user has permission to set or reset the password for the viewed user.. */}
                {accessToPasswordManage && <IconButton
                    sx={{ marginRight: "20px" }}
                    onClick={() => navigate(`/manage/${user?.group?.toLowerCase()}/user/${user?.name}`)}>
                    <Edit />
                </IconButton>}

                {/* If the viewed user has administrator privileges.. */}
                {user?.passwordManageGroups && <IconButton onClick={() => setControl((control) => !control)}>
                    <Policy />
                </IconButton>}
            </div>
        </TabPanel>
        <div className="d-row wrap">
            <section className="d-column w-100">
                I am section
            </section>

            {control && <section className="d-column swing-in-right-bck" style={{ width: "300px" }}>
                <FormControl>
                    <TextField 
                        inputRef={ref}
                        InputProps={{
                            endAdornment: <InputAdornment position="end">
                                {/* Reset form - button */}
                                <IconButton
                                    color="error"
                                    type="reset"
                                    // disabled={!isChanged}
                                    edge="end">
                                    <SearchOffSharp />
                                </IconButton>

                                {/* Submit form - button */}
                                <IconButton
                                    // color={isChanged ? "primary" : "inherit"}
                                    onClick={onSubmit}
                                    edge="end">
                                    <SearchSharp />
                                </IconButton>
                            </InputAdornment>
                        }} />
                </FormControl>
            </section>}
        </div>
    </>
}

export default Overview;
