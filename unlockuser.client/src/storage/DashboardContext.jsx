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
    updateDashboardData: () => { }
});

function DashboardProvider({ children }) {

    const { isAuthorized } = use(AuthContext);

    const [dashboardData, setDashboardData] = useState(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthorized) return;

        const storedData = sessionStorage.getItem("dashboardData");

            fetchDashboardData();
        if (!storedData)
            fetchDashboardData();
        else {
            setDashboardData(JSON.parse(storedData));
            setLoading(false);
        }
    }, [isAuthorized])

    // Fetch dashboard data
    async function fetchDashboardData() {
        const res = await ApiRequest("data/dashboard", "get");
        setDashboardData(res);

        if (res) {
            sessionStorage.setItem("dashboardData", JSON.stringify(res));
            Object.keys(res).map((key) => {
                sessionStorage.setItem(key.toLowerCase(), "loaded");
            })
        }

        setLoading(false);
    }

    // Update current dashboard data
    async function updateDashboardData(collection, data, index = null) {

        try {

            if (!collection || data == null) {
                return;
            }

            const dd = getSavedData();
            let modelsToUpdate = (dd[collection] && !Array.isArray(data)) ? [...dd[collection]] : data;

            // If index is set, update the specific model in the list
            if (typeof index === "number") {
                if (index === -1) {
                    modelsToUpdate = modelsToUpdate?.filter(x => x.id !== data);
                } else if (index > 0) {
                    modelsToUpdate = [...modelsToUpdate, data];
                } else if (index === 0) {
                    const ind = modelsToUpdate?.findIndex(x => x.id == data?.id);

                    if (ind === -1) return;

                    // Update current model with the new data
                    modelsToUpdate = modelsToUpdate?.map((model, i) => {
                        if (ind !== i) return model;
                        return { ...model, ...data };
                    })
                }
            } else if (modelsToUpdate?.length > 0 && !dd[collection])
                sessionStorage.setItem(collection, "loaded");


            const updateData = {
                ...dd,
                [collection]: modelsToUpdate
            }

            setDashboardData(previous => ({
                ...previous,
                ...updateData
            }));

            sessionStorage.setItem("dashboardData", JSON.stringify(updateData));

        } catch (error) {
            console.error("Dashboard data update error => ", error);
        }
    }

    function getSavedData() {
        return sessionStorage.getItem("dashboardData")
            ? JSON.parse(sessionStorage.getItem("dashboardData"))
            : { description: null, processSteps: [], offices: [], checklists: [], activities: [] }
    }

    // Return values
    const value = {
        dashboardData: dashboardData,
        loading: loading,
        fetchDashboardData: fetchDashboardData,
        updateDashboardData: updateDashboardData
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
};

export default DashboardProvider;