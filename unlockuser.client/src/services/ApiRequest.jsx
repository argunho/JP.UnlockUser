// Installed
import axios from "axios";

// Functions
import { TokenConfig } from "./TokenConfig";

// axios.defaults.baseURL = "https://localhost:5175";
axios.defaults.baseURL = window.location.origin;
let source = axios.CancelToken.source();

async function ApiRequest(api, req, data) {
console.log(window.location.origin)
    const config = TokenConfig();
    config.cancelToken = source.token;
    source.token.reason = null;


    if (!req && !data)
        return await axios.get(api, config);
    else if (!data)
        return await axios[req](api, config);

    return await axios[req](api, data, config);
}

export default ApiRequest;


export function CancelRequest() {
    source.cancel("Pågående förfrågan har avbrutits ...");
    source = axios.CancelToken.source();
}