import { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { submitInventory, getCompliance } from '../api/endpoints';

export const useDeviceScan = () => {
    const { 
        loadingStatus, setLoadingStatus, 
        phaseIndex, setPhaseIndex, 
        setComplianceResult, setGraphData 
    } = useContext(AppContext);

    const [scanError, setScanError] = useState(null);

    useEffect(() => {
        if (window.hasStartedScan) return;
        window.hasStartedScan = true;

        const runAutoScan = async () => {
            try {
                console.log("[CompactIQ] Application Started");

                await Promise.race([
                    new Promise(r => setTimeout(r, 1500)),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Splash Timeout")), 3000))
                ]).catch(e => console.warn("[CompactIQ] Splash timeout enforced:", e));

                setPhaseIndex(1);
                await new Promise(r => setTimeout(r, 1000));

                setPhaseIndex(2);
                let inventory = null;
                if (window.electron && window.electron.scanSystem) {
                    inventory = await window.electron.scanSystem();
                } else {
                    await new Promise(r => setTimeout(r, 1500));
                }

                setPhaseIndex(3);
                await new Promise(r => setTimeout(r, 1000));

                setPhaseIndex(4);
                await new Promise(r => setTimeout(r, 1000));

                setPhaseIndex(5);
                
                let result;
                if (window.electron && window.electron.scanSystem && inventory) {
                    const deviceId = inventory.os.hostname || "UNKNOWN-DEVICE";
                    result = await submitInventory(deviceId, inventory.os, inventory.components);
                    localStorage.setItem('scannedDeviceId', deviceId);
                } else {
                    result = await getCompliance("latest");
                }
                
                setPhaseIndex(6);
                await new Promise(r => setTimeout(r, 1200));
                
                setComplianceResult(result);
                if (result.graph_elements) {
                    setGraphData(result.graph_elements);
                }
            } catch (error) {
                console.error("[CompactIQ] Exact Failure Location:", error);
                let errorMessage = "Unable to contact compliance service.";
                if (error.response && error.response.data && error.response.data.detail) {
                    errorMessage = `Backend Error: ${error.response.data.detail}`;
                } else if (error.message) {
                    errorMessage = error.message;
                }
                setScanError(errorMessage);
            } finally {
                setLoadingStatus(false);
            }
        };

        if (loadingStatus) {
            runAutoScan();
        }
    }, [loadingStatus, setPhaseIndex, setComplianceResult, setGraphData, setLoadingStatus]);

    return { scanError };
};
