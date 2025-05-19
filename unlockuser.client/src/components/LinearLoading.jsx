import { useEffect, useRef, useState } from "react";

// Installed
import { Box, LinearProgress } from "@mui/material";

// Loading linear
function LinearLoading({ msg = "Var god vänta, data hämtas...", color = "inherit", size = 16, styles = null }) {
    LinearLoading.displayName = "LinearLoading";

    const [progress, setProgress] = useState(0);
    const [buffer, setBuffer] = useState(10);

    const progressRef = useRef(() => { });

    useEffect(() => {
        progressRef.current = () => {
            if (progress > 100) {
                setProgress(0);
                setBuffer(10);
            } else {
                const diff = Math.random() * 10;
                const diff2 = Math.random() * 10;
                setProgress(progress + diff);
                setBuffer(progress + diff + diff2);
            }
        };
    });

    useEffect(() => {
        const timer = setInterval(() => {
            progressRef.current();
        }, 500);

        return () => {
            clearInterval(timer);
        };
    }, []);

    return (
        <div className="d-column" style={{flex: 1, height: "calc(100vh - 210px)", ...styles}}>
            <Box sx={{ width: size === 16 ? "300px" : "400px", maxWidth: "95%" }}>
                <LinearProgress variant="buffer" color={color} value={progress} valueBuffer={buffer} style={{
                    height: `${size}px`
                }} />
            </Box>
            {msg && <p className="loading-message">{msg}</p>}
        </div>
    );
}

export default LinearLoading;