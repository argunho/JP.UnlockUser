// Installed
import axios from "axios";

// Service
import { TokenConfig } from "./TokenConfig";
import { ErrorHandle } from "./ErrorHandle";

axios.defaults.baseURL = window.location.origin;

// Functions
export async function ApiRequest(api, req = "get") {
    try {
        const config = TokenConfig();
        const res = await axios[req](`api/${api}`, config);
        return res?.data;
    }catch(error) {
        ErrorHandle(error);
        return null;
    }
}