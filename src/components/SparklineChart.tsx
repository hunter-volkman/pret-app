import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface SparklineChartProps {
  data: { x: any; y: any }[];
  color: string;
}

export function SparklineChart({ data, color }: SparklineChartProps) {
  const options: ApexOptions = {
    chart: {
      type: 'line',
      width: 80, // Reduced from 100
      height: 35,
      sparkline: {
        enabled: true,
      },
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    colors: [color],
    tooltip: {
      enabled: false,
    },
    xaxis: {
      type: 'datetime',
    },
  };

  const series = [{
    name: 'Trend',
    data: data,
  }];

  return <Chart options={options} series={series} type="line" height={35} width={80} />;
}
