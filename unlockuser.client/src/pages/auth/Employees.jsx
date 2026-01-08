import { useEffect } from 'react';

// Installed
import { IconButton, List, ListItem, ListItemIcon, ListItemText
} from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { useOutletContext, useNavigate } from 'react-router-dom';

// Components
import Message from '../../components/blocks/Message';

// Hooks
import usePagination from '../../hooks/usePagination';

// Css
import '../../assets/css/list-view.css';


function Employees() {

    const { loading, moderators, onReset } = useOutletContext();
    const navigate = useNavigate();

    const { content: pagination, page, perPage } = usePagination(
        {
            length: moderators.length,
            loading,
            number: 20
        });

    useEffect(() => {
        document.title = "UnlockUser | Anställda";
    }, [])

    return (
        <>
            {/* Pagination */}
            {pagination}

            {/* If list is empty or bad response from server */}
            {(moderators.length == 0 && !loading)
                && <Message res={{ color: "info", msg: "Inga anställda hittades..." }} 
                    cancel={onReset} styles={{ marginTop: "32px" }} />}

            {/* Result list */}
            {(moderators?.length > 0 && !loading) && <List className="d-row list-container w-100">

                {/* Loop of result list */}
                {moderators?.filter((x, index) => (index + 1) > perPage * (page - 1) && (index + 1) <= (perPage * page))?.map((item, index) => {
                    const calculatedIndex = (perPage * (page - 1)) + (index + 1);
                    return <ListItem key={index} className={`list-item${(calculatedIndex === moderators?.length && ((index + 1) % 2) !== 0) ? " w-100 last" : ""}`}
                        secondaryAction={<IconButton onClick={() => navigate(`/moderators/view/${item?.name}`)}>
                            <ArrowForward />
                        </IconButton>}> 
                        <ListItemIcon>
                            {page > 1 ? calculatedIndex : index + 1}
                        </ListItemIcon>
                        <ListItemText primary={<span dangerouslySetInnerHTML={{ __html: item?.primary }} />}
                            secondary={<span dangerouslySetInnerHTML={{ __html: item?.secondary }} />} />
                    </ListItem>
                })}
            </List>}
        </>
    )
}

export default Employees;