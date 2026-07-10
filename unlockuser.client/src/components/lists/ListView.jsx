// Installed
import { List, ListItem, ListItemText, ListItemAvatar, Avatar } from '@mui/material';

function ListView({ list, avatar: Icon }) {

    return (
        <List className="w-100">
            {list.map((item, index) => {
                return <ListItem key={index}>
                    {Icon && <ListItemAvatar>
                        <Avatar>
                            <Icon />
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
