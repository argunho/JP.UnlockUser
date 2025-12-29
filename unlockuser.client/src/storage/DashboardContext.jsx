import { createContext, useEffect, useState, use } from "react";

// Services
import { ApiRequest } from "../services/ApiRequest";

// Functions
import { IsLocalhost } from "../functions/Functions";

// Storage
import { AuthContext } from './AuthContext';


// eslint-disable-next-line react-refresh/only-export-components
export const DashboardContext = createContext({
    collections: null,
    loading: false,
    sessionData: {},
    fetchCollections: () => { },
    updateSessionData: () => { }
});

function DashboardProvider({ children }) {

    const { isAuthorized } = use(AuthContext);

    const [collections, setCollections] = useState(null);
    const [sessionData, setSessionData] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthorized) return;

        if (IsLocalhost && sessionStorage.getItem("collections")) {
            setCollections(JSON.parse(sessionStorage.getItem("collections")));
            setLoading(false);
            return;
        }

        fetchCollections();
    }, [isAuthorized])

    // Fetch dashboard data
    async function fetchCollections() {
        const res = await ApiRequest("data/dashboard", "get");

        const dataToStore = res?.groups ? {...res.data, ...{ groups: res?.groups }} : res;

        if(IsLocalhost)
            sessionStorage.setItem("collections", JSON.stringify(dataToStore));

        setCollections(dataToStore);
        setLoading(false);
    }

    // Update current dashboard data
    async function updateSessionData(collection, data) {

        try {

            if (!collection)
                return;

            setSessionData(previous => ({
                ...previous,
                [collection]: data
            }));

        } catch (error) {
            console.error("Dashboard data update error => ", error);
        }
    }



    // Return values
    const value = {
        collections: collections,
        loading: loading,
        sessionData: sessionData,
        fetchCollections: fetchCollections,
        updateSessionData: updateSessionData,
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
};

export default DashboardProvider;