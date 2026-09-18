// Installed
import { List, ListItem, ListItemText, ListItemAvatar, Avatar } from '@mui/material';

function ListView({ list: items, avatar, fullWith = true }) {

    return (
        <List className="d-row w-100" style={{ flexWrap: "wrap" }}>
            {items.map((item, index) => {
                return <ListItem key={index} 
                    className={`list-item${fullWith || ((index + 1) === items?.length && (items?.length % 2) !== 0) ? " w-100 last" : ""}`}>
                    {avatar && <ListItemAvatar>
                        <Avatar>
                            {avatar}
                        </Avatar>
                    </ListItemAvatar>}
                    <ListItemText
                        primary={item?.primary}
                        secondary={<span dangerouslySetInnerHTML={{ __html: item?.secondary }}></span>} />
                </ListItem>
            })}
        </List>
    )
}

export default ListView;
