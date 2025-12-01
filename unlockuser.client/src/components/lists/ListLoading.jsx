// Installed 
import { Skeleton, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import { Lock } from '@mui/icons-material';


function ListLoading({ rows = 1, loading, pending }) {

    console.log(loading && !pending, rows)
    if (loading && !pending) {
        return (
            Array(rows).fill().map((i, ind) => {
                return <Skeleton
                    key={ind}
                    variant="rectangular"
                    animation="wave"
                    className="skeleton-box-list w-100" />;
            })
        )
    }
    
    return <List className="w-100">
        {Array(rows).fill().map((i, ind) => {
            return <ListItem
                className="li-disabled"
                key={ind}
                secondaryAction={<Lock color="inherit" />}>

                <ListItemAvatar>
                    <Skeleton
                        variant="circular"
                        animation={pending ? "wave" : "none"}
                        width={40}
                        height={40} />
                </ListItemAvatar>

                {pending ? <ListItemText
                    primary={<Skeleton
                        variant="text"
                        animation="wave"
                        width="80%"
                        sx={{ fontSize: '1.2rem' }} />}
                    secondary={<Skeleton
                        variant="text"
                        animation="wave"
                        width="50%"
                        sx={{ fontSize: '0.7rem' }} />} />
                    : <ListItemText primary="***********" secondary="******" />}
            </ListItem>
        })}
    </List>
}

export default ListLoading;
