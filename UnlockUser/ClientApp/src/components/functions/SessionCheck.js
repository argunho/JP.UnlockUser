import { useEffect } from "react";
import { useHistory } from "react-router-dom";

export default function SessionCheck() {

  const history = useHistory();

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    // Return to the start page if a user is unauthorized
    if (token === null || token === undefined)
        history.push("/");
  })
}
