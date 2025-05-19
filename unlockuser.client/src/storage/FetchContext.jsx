import { createContext, useState } from "react";

// Installed
import axios from 'axios';

// Functions
import { ErrorHandle } from './../functions/ErrorHandle';

// Services
import { TokenConfig } from '../services/TokenConfig';

axios.defaults.baseURL = window.location.origin;
let source = axios.CancelToken.source();

// eslint-disable-next-line react-refresh/only-export-components
export const FetchContext = createContext({
    response: null,
    loading: false,
    resData: undefined,
    success: false,
    reqFn: () => { },
    reqFetchFn: () => { },
    reqSendFn: () => { },
    updateResData: () => { },
    handleResponse: () => { },
    cancelReq: () => { }
})

function FetchContextProvider({ children }) {

    const [response, setRespoonse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [resData, setResData] = useState(undefined);
    const [success, setSuccess] = useState(false);

    const config = TokenConfig();
    config.cancelToken = source.token;
    source.token.reason = null;

    // Fetch request if return of res data is needed
    async function reqFn(api, req, value) {
        restartParams();
        try {
            const res = await axios[req](api, value, config);
            if (res.data?.msg) {
                setRespoonse(res.data);
                return null;
            }

            return res.data;
        } catch (error) {
            setRespoonse(ErrorHandle(error));
        }
    }

    // Fetch request for get and delete
    async function reqFetchFn(api, req = "get", skipUpdate = false) {
        restartParams();

        if (!skipUpdate) {
            skipUpdate = (req === "delete");
            if (!skipUpdate)
                setResData(null);
        }

        try {
            const res = await axios[req](api, config);
            if (res.data?.msg)
                setRespoonse(res.data);
            else if (!skipUpdate)
                setResData(res.data);
            else if (!res.data)
                setSuccess(true);
            else
                setRespoonse(ErrorHandle());

            setLoading(false);
        } catch (error) {
            setRespoonse(ErrorHandle(error));
        }
    }

    // Fetch request for post or put
    async function reqSendFn(api, req, value) {
        restartParams();

        try {
            const res = await axios[req](api, value, config)
            if (res.data?.msg)
                setRespoonse(res.data);
            else if (!res.data)
                setSuccess(true);
            else
                setRespoonse(ErrorHandle("Kontrollera inmatad data innan du försöker igen."));

            setLoading(false);
        } catch (error) {
            setRespoonse(ErrorHandle(error));
        }
    }

    function updateResData(value = undefined) {
        if (response || success)
            handleResponse()
        setResData(value);
    }

    function handleResponse(value = null) {
        setRespoonse(value);
        setLoading(false);
        setSuccess(false);
    }

    function cancelRequest() {
        source.cancel("Pågående frågeformuläret har avbrutits ...");
        source = axios.CancelToken.source();
        setLoading(false);
        setRespoonse({ color: "error", msg: "Pågående frågeformuläret har avbrutits ..." });
    }

    // Private function 
    function restartParams() {
        setLoading(true);
        setRespoonse();
        setSuccess(false);
    }

    const value = {
        response: response,
        loading: loading,
        resData: resData,
        success: success,
        reqFn: reqFn,
        reqSendFn: reqSendFn,
        reqFetchFn: reqFetchFn,
        updateResData: updateResData,
        handleResponse: handleResponse,
        cancelReq: cancelRequest
    }

    return <FetchContext.Provider value={value}>{children}</FetchContext.Provider>;
}

export default FetchContextProvider;

