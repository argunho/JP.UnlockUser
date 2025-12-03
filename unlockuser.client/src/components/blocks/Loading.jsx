// Installed
import { CircularProgress } from "@mui/material";

function Loading({ msg, color, size, cls, style }) {
  return (
      <div className={`d-column${(cls ? ` ${cls}` : "")}`} style={style ?? null}>
      <CircularProgress size={size ?? 30} color={color ?? "inherit"} />

      {msg && <p className="loading-message">{msg}</p>}
    </div>
  )
}

export default Loading;