// Services
import { ApiRequest } from "../services/ApiRequest";

// Dynamic loader function
export function loader(api) {
    return async function load() {
        const res = await ApiRequest(api, "get");
        return res;
    }
}

export function loaderById(api) {
    return async function load({ params }) {
        const endpoint = params?.id ? `${api}/${params.id}` : api;
        const res = await ApiRequest(endpoint, "get");
        return res;
    }
}

export function loaderCheck(api, key) {
    if (sessionStorage.getItem(key))
        return null;

    return async function load() {
        const res = await ApiRequest(api, "get");
        return res;
    }
}

// Dynamic form data loader
export function loaderFormParams(param, keys = null) {
    return async function lod({ params }) {

        let api = `${params[param]}/form/data`;

        if (keys?.length > 0) {
            keys.forEach(key => {
                api += `/${params[key]}`
            })
        }

        const res = await ApiRequest(api, "get");
        return res;
    }
}

// Dynamic loader function
export function loaderByParams(api, keys = null) {
    return async function lod({ params }) {
        let endpoint = api ?? "";
        (keys ? keys : Object.keys(params)).forEach(key => {
            endpoint += `/${params[key]}`
        })

        const res = await ApiRequest(endpoint, "get");
        return res;
    }
}

// Dynamic loader function
export function loaderByApiParam(param, chainLink = "", keys = null) {
    return async function lod({ params }) {

        if (sessionStorage.getItem(params[param]))
            return {};

        let api = params[param] + chainLink;

        if (keys?.length > 0) {
            keys.forEach(key => {
                api += `/${params[key]}`
            })
        }

        const res = await ApiRequest(api, "get");
        return res;
    }
}

// Dynamic loader function by params, first param are name of controller
export async function loadParamsCollection({ params }) {
    let api = "";

    let keys = Object.keys(params);
    keys.forEach(key => {
        api += `/${params[key]}`
    })
    const param = keys?.length > 1 ? keys[keys?.length - 1] : keys[0];
    if (sessionStorage.getItem(params[param]))
        api += "/params";

    const res = await ApiRequest(api, "get")
    return res;
}