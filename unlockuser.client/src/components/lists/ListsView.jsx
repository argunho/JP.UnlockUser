import { useState } from 'react';

// Installed
import {
  List, ListItem, ListItemButton, ListItemText, Typography, ListItemSecondaryAction,
  ListItemAvatar, Avatar, Checkbox
} from '@mui/material';
import { SelectAll, Deselect, WysiwygSharp } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Components
import ListPanel from './ListPanel';


function ListsView({ list, grouped, group, multiple }) {

  const [selected, setSelected] = useState([]);

  const navigate = useNavigate();

  const organized = list.reduce((label, item) => {
    if (!label[item[grouped]])
      label[item[grouped]] = [];

    label[item[grouped]].push(item);
    return label;
  }, {});

  function onClick(user) {

    // Navigation
    navigate(selected?.length > 1
      ? `/manage/${group}/class/${list[0].office}/${list[0].department}`
      : `/manage/${group}/user/` + (user?.name ? user?.name : selected[0]));
  }

  function onSelected(value) {
    if (Array.isArray(value))
      setSelected(selected?.length == value?.length ? [] : value)
    else {
      if (selected.indexOf(value) > -1)
        setSelected(selected.filter(x => x !== value));
      else
        setSelected(previous => [...previous, value]);
    }
  }

  return (
    <>
      {/* View panel */}
      {multiple && <ListPanel onSelected={onSelected} ids={list?.map(x => x.name)} />}

      {Object.entries(organized).map(([name, items]) => {

        return <List key={name} className="w-100">
          <Typography variant="h6" gutterBottom>{name}</Typography>

          {/* Loop of list */}
          {items.map((item, index) => {
            const checked = selected?.includes(item?.name);
            console.log(item, checked)
            return <ListItemButton key={index} component="li" className="loop-li" onClick={() => onClick(item)}>

              {item?.isLocked && <ListItemSecondaryAction>
                <span className="unlock-span locked-account">Kontot är låst</span>
              </ListItemSecondaryAction>}

              <ListItemAvatar>
                {multiple
                  ? <Checkbox color={checked ? "success" : "warning"} checked={checked} onChange={() => onSelected(item?.name)} />
                  : <Avatar sx={{ backgroundColor: "transparent !important", border: "2px solid var(--color-info)" }}> <WysiwygSharp color="primary" /></Avatar>}
              </ListItemAvatar>

              {/* Data */}
              <ListItemText
                primary={item?.primary}
                secondary={<span dangerouslySetInnerHTML={{ __html: item?.secondary }}></span>}
              />
            </ListItemButton>
          })}
        </List>
      })}
    </>

  )
}

export default ListsView;