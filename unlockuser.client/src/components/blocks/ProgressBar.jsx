
import { useEffect,  useState } from 'react';


function ProgressBar({maxValue}) {
    ProgressBar.displayName = "ProgressBar";

    const [remainingTime, setRemainingTime] = useState(maxValue)

    useEffect(() => {
        const interval = setInterval(() => {
            setRemainingTime((prevTime) => prevTime - 10)
        }, 10)

        return () => {
            clearInterval(interval);
        }
    }, [])

    return (
        <progress className="progress" value={remainingTime} max={maxValue}/>
    )
}

export default ProgressBar;