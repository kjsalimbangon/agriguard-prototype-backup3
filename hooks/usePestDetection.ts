import { useState, useEffect, useCallback } from 'react';
import { pestDetectionService, DetectionResult } from '@/services/PestDetectionService';
import { PestDetection, PestSpecies } from '@/database/DatabaseManager';

export function usePestDetection() {
  const [isScanning, setIsScanning] = useState(false);
  const [detectionHistory, setDetectionHistory] = useState<PestDetection[]>([]);
  const [pestDatabase, setPestDatabase] = useState<PestSpecies[]>([]);
  const [stats, setStats] = useState({
    totalDetections: 0,
    todayDetections: 0,
    mostCommonPest: 'None',
    averageConfidence: 0
  });

  const handleDetection = useCallback((result: DetectionResult) => {
    // This will be called when a pest is detected during continuous scanning
    console.log('Pest detected:', result);
    // Refresh detection history
    loadDetectionHistory();
    loadStats();
  }, []);

  const loadDetectionHistory = useCallback(async () => {
    try {
      const history = await pestDetectionService.getDetectionHistory();
      setDetectionHistory(history);
    } catch (error) {
      console.error('Failed to load detection history:', error);
    }
  }, []);

  const loadPestDatabase = useCallback(async () => {
    try {
      const database = await pestDetectionService.getPestDatabase();
      setPestDatabase(database);
    } catch (error) {
      console.error('Failed to load pest database:', error);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const detectionStats = await pestDetectionService.getDetectionStats();
      setStats(detectionStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  const startScanning = useCallback(() => {
    setIsScanning(true);
    pestDetectionService.addDetectionCallback(handleDetection);
    pestDetectionService.startContinuousScanning();
  }, [handleDetection]);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
    pestDetectionService.removeDetectionCallback(handleDetection);
    pestDetectionService.stopContinuousScanning();
  }, [handleDetection]);

  const analyzeImage = useCallback(async (imageUri: string): Promise<DetectionResult> => {
    const result = await pestDetectionService.analyzeImage(imageUri);
    // Refresh data after analysis
    loadDetectionHistory();
    loadStats();
    return result;
  }, [loadDetectionHistory, loadStats]);

  useEffect(() => {
    loadDetectionHistory();
    loadPestDatabase();
    loadStats();

    // Cleanup on unmount
    return () => {
      if (isScanning) {
        stopScanning();
      }
    };
  }, []);

  return {
    isScanning,
    detectionHistory,
    pestDatabase,
    stats,
    startScanning,
    stopScanning,
    analyzeImage,
    refreshData: () => {
      loadDetectionHistory();
      loadStats();
    }
  };
}