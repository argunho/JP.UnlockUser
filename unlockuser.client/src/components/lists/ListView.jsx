// Installed
import { List, ListItem, ListItemText } from '@mui/material';

function ListView({ list }) {

    return (
        <List className="">
            {list.map((item, index) => {
                return <ListItem key={index}>
                    <ListItemText 
                        primary={item?.primary} 
                        secondary={<span dangerouslySetInnerHTML={{ __html: item?.secondary }}></span>}/>
                </ListItem>
            })}
        </List>
    )
}

export default ListView;
