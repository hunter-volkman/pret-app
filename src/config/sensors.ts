// A single source of truth for all sensor business logic.

// 1. Define the properties for each TYPE of sensor.
const SENSOR_TYPES = {
  FRIDGE: {
    displayName: 'Fridge',
    thresholds: { critical: 5, warning: 1 },
    bands: [
      { y: 5, label: 'Upper Limit (5°C)', color: '#EF4444' },
      { y: 1, label: 'Lower Limit (1°C)', color: '#1D4ED8' },
    ],
    alerting: { upperLimit: 5, firstAlertMinutes: 45, secondAlertMinutes: 90 },
  },
  LANGAR: {
    displayName: 'Langar',
    thresholds: { critical: 5, warning: 1 },
    bands: [
      { y: 5, label: 'Upper Limit (5°C)', color: '#EF4444' },
      { y: 1, label: 'Lower Limit (1°C)', color: '#1D4ED8' },
    ],
    alerting: { upperLimit: 5, firstAlertMinutes: 45, secondAlertMinutes: 90 },
  },
  FREEZER: {
    displayName: 'Freezer',
    thresholds: { critical: -17.8, warning: -22 },
    bands: [
      { y: -17.8, label: 'Upper Limit (-17.8°C)', color: '#EF4444' },
      { y: -22, label: 'Lower Limit (-22°C)', color: '#1D4ED8' },
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
    'sensor-1': { type: 'LANGAR', displayName: 'US_LANGARS_12' },
    'sensor-2': { type: 'LANGAR', displayName: 'US_LANGARS_14' },
    'sensor-3': { type: 'LANGAR', displayName: 'US_LANGARS_12' },
    'sensor-4': { type: 'LANGAR', displayName: 'US_LANGARS_11' },
    'sensor-5': { type: 'FREEZER', displayName: 'US_FREEZER_3' },
    'sensor-6': { type: 'FRIDGE', displayName: 'WALK_IN_FRIDGE_2' },
    'sensor-7': { type: 'FRIDGE', displayName: 'REACH_IN_5' },
    'sensor-8': { type: 'FRIDGE', displayName: 'WALK_IN_FRIDGE' },
    'sensor-9': { type: 'FREEZER', displayName: 'US_FREEZER_6' },
    'sensor-10': { type: 'FREEZER', displayName: 'US_FREEZER_7' },
  },
  // Union Square (Temp Machine ID: 27971efd-baaa-4cb5-b5d0-2b5468daf0b4)
  '27971efd-baaa-4cb5-b5d0-2b5468daf0b4': {
    'sensor-1': { type: 'FRIDGE', displayName: 'WALK_IN_FRIDGE' },
    'sensor-2': { type: 'FRIDGE', displayName: 'WALK_IN_FRIDGE_2' },
    'sensor-3': { type: 'LANGAR', displayName: 'US_LANGARS_15' },
    'sensor-4': { type: 'LANGAR', displayName: 'US_LANGARS_12' },
    'sensor-5': { type: 'LANGAR', displayName: 'US_LANGARS_13' },
    'sensor-6': { type: 'LANGAR', displayName: 'US_LANGARS_14' },
    'sensor-7': { type: 'FRIDGE', displayName: 'REACH_IN_6' },
    'sensor-8': { type: 'FRIDGE', displayName: 'REACH_IN_FRIDGE_8' },
    'sensor-9': { type: 'FREEZER', displayName: 'US_FREEZER_10' },
    'sensor-10': { type: 'FRIDGE', displayName: 'REACH_IN_7' },
    'sensor-11': { type: 'FREEZER', displayName: 'US_FREEZER_9' },
  },
  // Westwood/UCLA (Temp Machine ID: 4330c1e3-6a68-487c-8288-ce0124772bce)
  '4330c1e3-6a68-487c-8288-ce0124772bce': {
    'sensor-1': { type: 'FRIDGE', displayName: 'MILK_FRIDGE' },
    'sensor-2': { type: 'LANGAR', displayName: 'US_LANGARS_12' },
    'sensor-3': { type: 'LANGAR', displayName: 'US_LANGARS_11' },
    'sensor-4': { type: 'FRIDGE', displayName: 'REACH_IN_1' }
  },
  // Century City Mall (Temp Machine ID: fc6778ff-e3a0-4295-a52d-d92580fc2e81)
  'fc6778ff-e3a0-4295-a52d-d92580fc2e81': {
    'sensor-1': { type: 'LANGAR', displayName: 'US_LANGARS_13' },
    'sensor-2': { type: 'LANGAR', displayName: 'US_LANGARS_12' },
    'sensor-3': { type: 'LANGAR', displayName: 'US_LANGARS_11' },
    'sensor-4': { type: 'FRIDGE', displayName: 'REACH_IN_3' },
    'sensor-5': { type: 'FRIDGE', displayName: 'MILK_FRIDGE' },
    'sensor-6': { type: 'FRIDGE', displayName: 'REACH_IN_1' }
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
