export type FactoryStatus = "Healthy" | "Attention" | "Critical";
export type ChipStatus = "Pass" | "Fail" | "Error";
export type ChipType =
  | "Temperature Sensor"
  | "Pressure Sensor"
  | "Humidity Sensor"
  | "Light Sensor";

export type Factory = {
  id: string;
  name: string;
  status: FactoryStatus;
  labs: number;
  totalChips: number;
  pass: number;
  fail: number;
  error: number;
  passRate: number;
  labsOk: number;
  labsWarning: number;
  labsError: number;
  avgTemperature: number;
  temperatureRange: [number, number];
  avgHumidity: number;
  humidityRange: [number, number];
};

export type Chip = {
  id: string;
  factoryId: string;
  name: string;
  type: ChipType;
  status: ChipStatus;
  temperature: number;
  humidity: number;
  serialNumber: string;
  lastUpdated: string;
};

export type OverviewKpis = {
  factories: number;
  labsTotal: number;
  sensorChipsTotal: number;
  overallPassRate: number;
  lastUpdated: string;
};
