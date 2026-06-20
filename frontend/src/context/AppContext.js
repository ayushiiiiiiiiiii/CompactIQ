import React, { createContext, useState } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [phaseIndex, setPhaseIndex] = useState(0);
    const [complianceResult, setComplianceResult] = useState(null);
    const [graphData, setGraphData] = useState(null);
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <AppContext.Provider value={{
            loadingStatus, setLoadingStatus,
            phaseIndex, setPhaseIndex,
            complianceResult, setComplianceResult,
            graphData, setGraphData,
            selectedComponent, setSelectedComponent,
            isModalOpen, setIsModalOpen
        }}>
            {children}
        </AppContext.Provider>
    );
};
