import { createContext, useEffect, useState, use } from "react";

// Services
import { ApiRequest } from "../services/ApiRequest";

// Storage
import { AuthContext } from './AuthContext';


// eslint-disable-next-line react-refresh/only-export-components
export const DashboardContext = createContext({
    dashboardData: null,
    loading: false,
    fetchDashboardData: () => { },
    updateSessionData: () => { }
});

function DashboardProvider({ children }) {

    const { isAuthorized } = use(AuthContext);

    const [dashboardData, setDashboardData] = useState(null);
    const [sessionData, setSessionData] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthorized) return;

        fetchDashboardData();
    }, [isAuthorized])

    // Fetch dashboard data
    async function fetchDashboardData() {
        const res = await ApiRequest("data/dashboard", "get");
        setDashboardData(res);
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
        dashboardData: dashboardData,
        loading: loading,
        fetchDashboardData: fetchDashboardData,
        updateSessionData: updateSessionData,
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
};

export default DashboardProvider;