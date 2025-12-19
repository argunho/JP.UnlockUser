// Installed
import { List, ListItem, ListItemText, ListItemAvatar, Avatar } from '@mui/material';

function ListView({ list, avatar }) {

    return (
        <List className="w-100">
            {list.map((item, index) => {
                return <ListItem key={index}>
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
