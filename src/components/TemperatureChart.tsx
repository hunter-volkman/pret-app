import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { TemperatureDataPoint } from '../services/viam';

interface TemperatureChartProps {
  data: TemperatureDataPoint[];
  complianceBands?: { y: number; y2?: number; label: string; color: string }[];
}

export function TemperatureChart({ data, complianceBands = [] }: TemperatureChartProps) {
  const options: ApexOptions = {
    chart: {
      type: 'area',
      height: '100%',
      zoom: { autoScaleYaxis: true },
      toolbar: { show: true, tools: { download: false, selection: true, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true } },
      animations: {
        // Fix: Disable animations to prevent label misalignment on initial render
        enabled: false,
      },
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: 2,
      colors: ['#3B82F6']
    },
    fill: {
      type: 'gradient',
      colors: ['#3B82F6'],
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 90, 100],
      },
    },
    grid: { borderColor: '#e5e7eb', strokeDashArray: 4 },
    xaxis: {
      type: 'datetime',
      labels: { datetimeUTC: false, style: { colors: '#6B7280' } },
    },
    yaxis: {
      labels: {
        formatter: (value) => {
          if (typeof value !== 'number') return '';
          return `${value.toFixed(1)}°C`;
        },
        style: { colors: '#6B7280' },
      },
    },
    tooltip: {
      x: { format: 'MMM dd, hh:mm TT' },
      y: {
        formatter: (value) => {
          if (typeof value !== 'number') return '';
          return `${value.toFixed(2)}°C`;
        },
      },
      theme: 'light',
    },
    legend: { show: false },
    annotations: {
      yaxis: complianceBands.map(band => ({
        y: band.y,
        y2: band.y2,
        borderColor: band.color,
        fillColor: band.color,
        opacity: 0.15,
        label: {
          borderColor: band.color,
          style: {
            color: '#fff',
            // Fix: Restore the background color to the label style
            background: band.color, 
            fontSize: '10px',
            fontWeight: 600,
            padding: { left: 5, right: 5, top: 2, bottom: 2 }
          },
          text: band.label,
          position: 'right',
          offsetX: -5,
          offsetY: 0,
        },
      })),
    },
  };

  const series = [{
    name: 'Temperature',
    data: data,
  }];

  return <Chart options={options} series={series} type="area" width="100%" height="100%" />;
}
