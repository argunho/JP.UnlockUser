// Installed
import { CancelOutlined } from "@mui/icons-material";
import { Button, CircularProgress } from "@mui/material";

function Loading({ msg, color, size, style }) {
  return (
    <div className='d-column mh' style={style ?? null}>
      <CircularProgress size={size ?? 30} color={color ?? "inherit"} />

      {msg && <p className="loading-message">{msg}</p>}
    </div>
  )
}

export default Loading;