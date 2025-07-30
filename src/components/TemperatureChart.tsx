import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { TemperatureDataPoint } from '../services/viam';

interface TemperatureChartProps {
  data: TemperatureDataPoint[];
  complianceBands?: { y: number; y2?: number; label: string, color: string }[];
}

export function TemperatureChart({ data, complianceBands = [] }: TemperatureChartProps) {
  const options: ApexOptions = {
    chart: {
      type: 'area',
      height: '100%',
      zoom: {
        autoScaleYaxis: true,
      },
      toolbar: {
        show: true,
        tools: {
          download: false,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
        stops: [0, 90, 100],
      },
    },
    xaxis: {
      type: 'datetime',
      labels: {
        datetimeUTC: false, // Display in local time
        style: {
          colors: '#6B7280',
        },
      },
    },
    yaxis: {
      labels: {
        formatter: (value) => `${value.toFixed(1)}°C`,
        style: {
          colors: '#6B7280',
        },
      },
    },
    tooltip: {
      x: {
        format: 'MMM dd, hh:mm TT',
      },
      y: {
        formatter: (value) => `${value.toFixed(2)}°C`,
      },
      theme: 'light',
    },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 4,
    },
    annotations: {
      yaxis: complianceBands.map(band => ({
        y: band.y,
        y2: band.y2,
        borderColor: '#000',
        fillColor: band.color,
        opacity: 0.2,
        label: {
          borderColor: band.color,
          style: {
            color: '#fff',
            background: band.color,
          },
          text: band.label,
        },
      })),
    },
  };

  const series = [
    {
      name: 'Temperature',
      data: data,
    },
  ];

  return <Chart options={options} series={series} type="area" width="100%" height="100%" />;
}