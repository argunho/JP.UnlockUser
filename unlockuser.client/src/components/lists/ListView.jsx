// Installed
import { List, ListItem, ListItemText, ListItemAvatar, Avatar } from '@mui/material';

// Functions
import { Initials } from '../../functions/Helpers';

function ListView({ list: items, avatar, initials, styles, fullWith = true, onClick }) {
    return (
        <List className="d-row w-100" style={{ flexWrap: "wrap", ...styles }}>
            {items.map((item, index) => {
                return <ListItem
                    key={index}
                    className={`list-item${fullWith || ((index + 1) === items?.length && (items?.length % 2) !== 0) ? " w-100 last" : ""}`}
                    {...(!!onClick ? { onClick: () => onClick(item) } : null)}
                >
                    {(avatar || initials) && <ListItemAvatar>
                        {avatar && <Avatar>{avatar}</Avatar>}
                        {initials && <Avatar className="profile-avatar-small">{Initials(item?.displayName)}</Avatar>}
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
