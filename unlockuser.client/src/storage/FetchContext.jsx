import { createContext, useRef, useReducer, useMemo, useCallback, useEffect } from "react";

// Installed
import axios from 'axios';
import { useLocation } from 'react-router-dom';

// Functions
import { ErrorHandle } from './../functions/ErrorHandle';

// Services
import { TokenConfig } from '../services/TokenConfig';

axios.defaults.baseURL = window.location.origin;


// eslint-disable-next-line react-refresh/only-export-components
export const FetchContext = createContext();

const initialState = {
    response: null,
    resData: undefined,
    loading: false,
    success: false,
    complete: false,
    pending: null,
};

function fetchReducer(state, action) {

    switch (action.type) {
        case 'START':
            return { ...state, loading: !action.pending, success: false, response: null, complete: false, pending: action.pending };
        case 'SUCCESS':
            return { ...state, loading: false, success: true, complete: false, resData: action.payload, response: null, pending: false };
        case 'ERROR':
            return { ...state, loading: false, complete: false, response: action.payload, success: false, pending: false };
        case 'COMPLETE':
            return { ...state, response: null, success: false, pending: false, complete: true, resData: action.payload };
        case 'MESSAGE':
            return { ...state, loading: false, response: action.payload, pending: false, complete: false };
        case 'CLEAR':
            return { ...state, response: null, success: false, pending: false, complete: false };
        case 'CLEAR_TOTAL':
            return { ...state, response: null, success: false, pending: false, complete: false, resData: null };
        case 'SET_DATA':
            return { ...state, resData: action.payload };
        default:
            return state;
    }
}

function FetchContextProvider({ children }) {
    const [state, dispatch] = useReducer(fetchReducer, initialState);
    const controllerRef = useRef();
    const lastLayoutRef = useRef(null);
    const currentPathname = useRef(null);

    const loc = useLocation();

    useEffect(() => {
        if (loc.pathname == currentPathname.current)
            return;

        currentPathname.current = loc.pathname;
        const currentLayoutPathname = loc.pathname.split("/")[1];
        // const rootId = matches[0]?.id;

        if (currentLayoutPathname !== lastLayoutRef.current) {
            dispatch({ type: 'CLEAR_TOTAL' });
            lastLayoutRef.current = currentLayoutPathname;
        } else
            dispatch({ type: 'CLEAR' });
    }, [loc])

    const cancelRequest = useCallback(() => {
        controllerRef.current?.abort();
        dispatch({ type: 'CLEAR' });
    }, []);

    const fetchData = useCallback(async ({ api, method = 'get', data = null, action = null }) => {
        controllerRef.current = new AbortController();

        dispatch({ type: 'START', pending: method != "get" && action !== "none" });

        try {
            const config = {
                ...TokenConfig(data instanceof FormData),
                signal: controllerRef.current.signal
            };

            const response = data
                ? await axios[method](`api/${api}`, data, config)
                : (["post", "patch", "put"].includes(method) ? await axios[method](`api/${api}`, {}, config) : await axios[method](`api/${api}`, config));

            const res = response?.data !== undefined ? response.data : response;
            const warning = (res?.msg || res?.result?.msg || res?.response);

            if (action === "return" && !warning) {
                dispatch({ type: "CLEAR" });
                return res;
            } else if (action === "none") {
                if (warning) console.warn("Error/Warning => ", warning);
                dispatch({ type: "CLEAR" });
            } else if (!action && method === "delete")
                action = "skip";

            // Set dispatch
            if (warning) {
                dispatch({ type: 'MESSAGE', payload: (res?.result && res.result?.msg) ? res.result : (res?.response ? res?.response : res) });
            } else if (res && action !== "skip") {
                dispatch({ type: action !== "complete" ? 'SUCCESS' : "COMPLETE", payload: res });
            } else {
                dispatch({ type: action !== "complete" ? 'SUCCESS' : "COMPLETE", payload: null });
            }

            console.log(res)
            if(action === "success")
                return (res?.statusCode === 200 || res?.color === "success" || res === "");

        } catch (error) {
            if (axios.isCancel(error)) {
                error.message = "Pågående frågeformuläret har avbrutits ...";
            }
            dispatch({ type: 'ERROR', payload: ErrorHandle(error) });
        }
    }, []);

    const updateResData = useCallback((value = undefined) => {
        dispatch({ type: 'SET_DATA', payload: value });
    }, []);

    const handleResponse = useCallback((value = null) => {
        dispatch({ type: value ? 'MESSAGE' : "CLEAR", payload: value });
    }, []);

    const contextValue = useMemo(() => ({
        ...state,
        fetchData,
        updateResData,
        handleResponse,
        cancelRequest
    }), [state, fetchData, updateResData, handleResponse, cancelRequest]);

    return (
        <FetchContext.Provider value={contextValue}>
            {children}
        </FetchContext.Provider>
    );
}

export default FetchContextProvider;