import { createContext, useEffect, useState, use } from "react";

// Services
import { ApiRequest } from "../services/ApiRequest";

// Storage
import { AuthContext } from './AuthContext';


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

        fetchCollections();
    }, [isAuthorized])

    // Fetch dashboard data
    async function fetchCollections() {
        const res = await ApiRequest("data/dashboard", "get");
        setCollections(res);
        setLoading(false);
    }

    // Update current dashboard data
    async function updateSessionData(collection, data) {

        try {

            if (!collection) 
                return;

            const updateData = {
                ...sessionData,
                [collection]: data
            }

            setSessionData(previous => ({
                ...previous,
                ...updateData
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