// Installed
import {
  List, ListItem, ListItemText, ListSubheader
} from '@mui/material';


function ListsView({ list, grouped }) {

  const organized = list.reduce((label, item) => {
    if (!label[item[grouped]])
      label[item[grouped]] = [];

    label[item[grouped]].push(item);
    return label;
  }, {});

  return (
    <List className="w-100">
      {Object.entries(organized).map(([name, items]) => {
        <li>
          <ListSubheader></ListSubheader>
          <ul key={name}>
            {items.map((item, index) => {
              return <ListItem key={index}>
                <ListItemText
                  primary={item?.primary}
                  secondary={<span dangerouslySetInnerHTML={{ __html: item?.secondary }}></span>} />
              </ListItem>
            })}
          </ul>
        </li>
      })}
    </List>
  )
}

export default ListsView;