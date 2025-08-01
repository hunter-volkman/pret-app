// A single source of truth for all sensor business logic.

// 1. Define the properties for each TYPE of sensor.
const SENSOR_TYPES = {
  FRIDGE: {
    displayName: 'Fridge',
    thresholds: { critical: 5, warning: 1 },
    bands: [
      { y: 5, label: 'Upper Limit (5°C)', color: '#EF4444' },
      { y: 1, label: 'Lower Limit (1°C)', color: '#F59E0B' },
    ],
    alerting: { upperLimit: 5, firstAlertMinutes: 45, secondAlertMinutes: 90 },
  },
  LANGAR: {
    displayName: 'Langar',
    thresholds: { critical: 8, warning: 1 },
    bands: [
      { y: 8, label: 'Upper Limit (8°C)', color: '#EF4444' },
      { y: 1, label: 'Lower Limit (1°C)', color: '#F59E0B' },
    ],
    alerting: { upperLimit: 8, firstAlertMinutes: 45, secondAlertMinutes: 90 },
  },
  FREEZER: {
    displayName: 'Freezer',
    thresholds: { critical: -17.8, warning: -22 },
    bands: [
      { y: -17.8, label: 'Upper Limit (-17.8°C)', color: '#EF4444' },
      { y: -22, label: 'Lower Limit (-22°C)', color: '#F59E0B' },
    ],
    alerting: { upperLimit: -17.8, firstAlertMinutes: 45, secondAlertMinutes: 90 },
  },
  AMBIENT: {
    displayName: 'Ambient',
    thresholds: { critical: 30, warning: 15 },
    bands: [],
    alerting: null,
  },
};

// 2. Map the raw sensor names from Viam to a type and display name for each store.
const STORE_SENSOR_MAPPINGS: Record<string, Record<string, { type: keyof typeof SENSOR_TYPES; displayName: string }>> = {
  // 36th & 5th (Temp Machine ID: 948e0595-d307-425f-bd55-108e52046c2b)
  '948e0595-d307-425f-bd55-108e52046c2b': {
    'sensor-1': { type: 'FRIDGE', displayName: 'Front Drinks Fridge' },
    'sensor-2': { type: 'FRIDGE', displayName: 'Milk Fridge' },
    'sensor-3': { type: 'LANGAR', displayName: 'Pastry Display' },
    'sensor-4': { type: 'FRIDGE', displayName: 'Sandwich Fridge 1' },
    'sensor-5': { type: 'FREEZER', displayName: 'Walk-in Freezer' },
    'sensor-6': { type: 'FRIDGE', displayName: 'Sandwich Fridge 2' },
    'sensor-7': { type: 'FRIDGE', displayName: 'Yogurt Display' },
  },
  // Union Square (Temp Machine ID: 27971efd-baaa-4cb5-b5d0-2b5468daf0b4)
  '27971efd-baaa-4cb5-b5d0-2b5468daf0b4': {
    'sensor-1': { type: 'FRIDGE', displayName: 'Guest Fridge 1' },
    'sensor-2': { type: 'FRIDGE', displayName: 'Guest Fridge 2' },
    'sensor-3': { type: 'FRIDGE', displayName: 'Milk Station' },
    'sensor-4': { type: 'FRIDGE', displayName: 'BOH Fridge 1' },
    'sensor-5': { type: 'FREEZER', displayName: 'BOH Freezer' },
    'sensor-6': { type: 'FRIDGE', displayName: 'BOH Fridge 2' },
    'sensor-7': { type: 'LANGAR', displayName: 'Pastry Case' },
    'sensor-8': { type: 'FRIDGE', displayName: 'Lowboy 1' },
    'sensor-9': { type: 'FRIDGE', displayName: 'Lowboy 2' },
    'sensor-10': { type: 'AMBIENT', displayName: 'Ambient Kitchen' },
    'sensor-11': { type: 'AMBIENT', displayName: 'Ambient Seating' },
  },
  // Add other stores here using their TEMP MACHINE ID as the key
};

// Helper functions to easily access the configuration
export const getSensorConfig = (machineId: string, sensorId: string) => {
  const mapping = STORE_SENSOR_MAPPINGS[machineId]?.[sensorId];
  if (!mapping) return null;
  return {
    ...SENSOR_TYPES[mapping.type],
    displayName: mapping.displayName,
  };
};
