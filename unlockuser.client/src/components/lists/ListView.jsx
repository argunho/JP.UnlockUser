// Installed
import { List, ListItem, ListItemText } from '@mui/material';

function ListView({ list }) {
    return (
        <List>
            {list.map((item, index) => {
                return <ListItem key={index}>
                    <ListItemText primary={item?.primary} secondary={item.secondary}/>
                </ListItem>
            })}
        </List>
    )
}

export default ListView;
