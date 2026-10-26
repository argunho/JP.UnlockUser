import { useState } from 'react';

// Installed
import { Button, IconButton, Box, Menu, MenuItem } from "@mui/material";
import { Menu as MenuIcon } from '@mui/icons-material';

// Css
import ModalConfirm from '../modals/ModalConfirm';

function ActionsTab({ children, viewLabel, labels, pending, disabled, action, onClick }) {

  const [confirm, setConfirm] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [label, setLabel] = useState(labels?.length > 0 ? labels?.[0] : null);

  function handleClick() {
    if (action?.confirm)
      setConfirm(true);
    else
      onClick("save");
  }

  function handleConfirm() {
    onClick("save");
    setConfirm(false);
  }

  function handleMenu(event) {
    setAnchorEl(event.currentTarget);
  };

  function handleClose(value) {
    setAnchorEl(null);
    if (!value) return;

    setLabel(value);
    onClick(value?.key);
  };



  return (
    <>
      <Box className={`d-row ${(label ? "jc-between" : "jc-end")} w-100 action-wrapper`}>
        <div className="d-row">
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleMenu}
          >
            <MenuIcon />
          </IconButton>

          {label && <p className="d-row label" dangerouslySetInnerHTML={{ __html: viewLabel ?? label?.name }} />}

          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            className="action-menu"
            onClose={() => handleClose()}
          >
            {labels?.map((item, ind) =>
              <MenuItem
                key={ind}
                className="action-menu-li"
                onClick={() => handleClose(item)}>
                  {item?.name}
              </MenuItem>)}
          </Menu>
        </div>

        <div className="d-row">

          {children}

          {/* Button to save/update changed data */}
          <Button
            variant="contained"
            className="save"
            color={action?.color ?? "primary"}
            onClick={handleClick}
            disabled={pending || disabled}>
            {action?.name ?? "Spara ändringar"}
          </Button>
        </div>


      </Box>

      {/* Confirm */}
      {confirm && <ModalConfirm
        onConfirm={handleConfirm}
        onClose={() => setConfirm(false)} />}
    </>
  )
}

export default ActionsTab;     
