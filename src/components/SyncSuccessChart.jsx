// SyncSuccessChart.jsx
import React from 'react'
import { CChartLine } from '@coreui/react-chartjs'

const SyncSuccessChart = () => {
  const data = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Successful Syncs',
        data: [40, 45, 50, 48, 52, 60, 58],
        borderColor: 'green',
        backgroundColor: 'rgba(0, 128, 0, 0.2)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Failed Syncs',
        data: [5, 3, 4, 2, 1, 0, 1],
        borderColor: 'red',
        backgroundColor: 'rgba(255, 0, 0, 0.2)',
        fill: true,
        tension: 0.3,
      },
    ],
  }

  return (
    <div>
      <h5>FTP Sync Success Rate (Last 7 Days)</h5>
      <CChartLine data={data} />
    </div>
  )
}

export default SyncSuccessChart
