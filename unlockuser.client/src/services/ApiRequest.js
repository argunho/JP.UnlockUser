// Installed
import axios from "axios";

// Service
import { TokenConfig } from "./TokenConfig";

axios.defaults.baseURL = window.location.origin;

// Functions
export async function ApiRequest(api, req = "get") {
    const config = TokenConfig();
    const res = await axios[req](`api/${api}`, config);
    return res?.data;
}