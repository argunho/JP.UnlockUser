// Installed
import axios from "axios";


// Services
import TokenConfig from './TokenConfig';

async function ApiRequest(api, req, data) {

    if (!data)
        return axios.get(api, TokenConfig());

    return axios[req](api, data, TokenConfig());
}

export default ApiRequest;