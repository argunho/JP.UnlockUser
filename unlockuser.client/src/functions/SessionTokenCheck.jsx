import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SessionTokenCheck() {

  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    
    // Return to the start page if a user is unauthorized
    if (token === null || token === undefined)
        navigate("/");
  })
}