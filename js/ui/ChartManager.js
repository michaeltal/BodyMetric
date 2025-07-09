/**
 * ChartManager - Handles Chart.js integration and lifecycle management
 * 
 * Responsibilities:
 * - Chart.js integration and lifecycle management
 * - Create and destroy charts appropriately
 * - Handle chart data updates and refreshes
 * - Manage chart configuration and styling
 * - Prevent memory leaks through proper cleanup
 */
class ChartManager {
  constructor(calculationService) {
    this.calculationService = calculationService;
    this.charts = {};
  }

  /**
   * Update all charts with new data
   */
  updateCharts(measurements, useMetric = true) {
    if (!measurements || measurements.length === 0) return;
    
    const sortedData = [...measurements].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    this.createWeightChart(sortedData, useMetric);
    this.createBodyFatChart(sortedData);
    this.createLeanMassChart(sortedData, useMetric);
  }

  /**
   * Create weight chart with moving average
   */
  createWeightChart(data, useMetric = true) {
    const canvas = document.getElementById('weightChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart to prevent memory leaks
    if (this.charts.weight) {
      this.charts.weight.destroy();
    }
    
    const labels = data.map(d => d.date);
    const weights = data.map(d => useMetric ? d.weight : d.weight * 2.20462);
    const movingAverage = this.calculationService.calculateMovingAverage(weights, 7);
    
    this.charts.weight = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Daily Weight',
          data: weights,
          borderColor: '#1FB8CD',
          backgroundColor: 'transparent',
          pointBackgroundColor: '#1FB8CD',
          pointRadius: 3,
          borderWidth: 2
        }, {
          label: '7-Day Average',
          data: movingAverage,
          borderColor: '#FFC185',
          backgroundColor: 'transparent',
          pointRadius: 0,
          borderWidth: 3,
          tension: 0.4
        }]
      },
      options: this.getWeightChartOptions(useMetric)
    });
  }

  /**
   * Create body fat percentage chart
   */
  createBodyFatChart(data) {
    const canvas = document.getElementById('bodyFatChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart to prevent memory leaks
    if (this.charts.bodyFat) {
      this.charts.bodyFat.destroy();
    }
    
    const labels = data.map(d => d.date);
    const bodyFats = data.map(d => d.bodyFat);
    const movingAverage = this.calculationService.calculateMovingAverage(bodyFats, 7);
    
    this.charts.bodyFat = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Daily Body Fat %',
          data: bodyFats,
          borderColor: '#B4413C',
          backgroundColor: 'transparent',
          pointBackgroundColor: '#B4413C',
          pointRadius: 3,
          borderWidth: 2
        }, {
          label: '7-Day Average',
          data: movingAverage,
          borderColor: '#FFC185',
          backgroundColor: 'transparent',
          pointRadius: 0,
          borderWidth: 3,
          tension: 0.4
        }]
      },
      options: this.getBodyFatChartOptions()
    });
  }

  /**
   * Create lean mass chart
   */
  createLeanMassChart(data, useMetric = true) {
    const canvas = document.getElementById('leanMassChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart to prevent memory leaks
    if (this.charts.leanMass) {
      this.charts.leanMass.destroy();
    }
    
    const labels = data.map(d => d.date);
    const leanMasses = data.map(d => useMetric ? d.leanMass : d.leanMass * 2.20462);
    const movingAverage = this.calculationService.calculateMovingAverage(leanMasses, 7);
    
    this.charts.leanMass = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Daily Lean Mass',
          data: leanMasses,
          borderColor: '#5D878F',
          backgroundColor: 'transparent',
          pointBackgroundColor: '#5D878F',
          pointRadius: 3,
          borderWidth: 2
        }, {
          label: '7-Day Average',
          data: movingAverage,
          borderColor: '#FFC185',
          backgroundColor: 'transparent',
          pointRadius: 0,
          borderWidth: 3,
          tension: 0.4
        }]
      },
      options: this.getLeanMassChartOptions(useMetric)
    });
  }

  /**
   * Get weight chart configuration options
   */
  getWeightChartOptions(useMetric) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: useMetric ? 'Weight (kg)' : 'Weight (lbs)'
          }
        },
        x: {
          type: 'time',
          time: {
            unit: 'day',
            displayFormats: {
              day: 'MMM dd'
            }
          }
        }
      },
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false
        },
        legend: {
          display: true,
          position: 'top'
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    };
  }

  /**
   * Get body fat chart configuration options
   */
  getBodyFatChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: 'Body Fat (%)'
          }
        },
        x: {
          type: 'time',
          time: {
            unit: 'day',
            displayFormats: {
              day: 'MMM dd'
            }
          }
        }
      },
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false
        },
        legend: {
          display: true,
          position: 'top'
        }
      }
    };
  }

  /**
   * Get lean mass chart configuration options
   */
  getLeanMassChartOptions(useMetric) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: useMetric ? 'Lean Mass (kg)' : 'Lean Mass (lbs)'
          }
        },
        x: {
          type: 'time',
          time: {
            unit: 'day',
            displayFormats: {
              day: 'MMM dd'
            }
          }
        }
      },
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false
        },
        legend: {
          display: true,
          position: 'top'
        }
      }
    };
  }

  /**
   * Destroy all charts to prevent memory leaks
   */
  destroyCharts() {
    Object.keys(this.charts).forEach(chartKey => {
      if (this.charts[chartKey]) {
        this.charts[chartKey].destroy();
        delete this.charts[chartKey];
      }
    });
  }

  /**
   * Destroy a specific chart
   */
  destroyChart(chartName) {
    if (this.charts[chartName]) {
      this.charts[chartName].destroy();
      delete this.charts[chartName];
    }
  }

  /**
   * Check if a chart exists
   */
  hasChart(chartName) {
    return !!(this.charts[chartName] && !this.charts[chartName].destroyed);
  }

  /**
   * Get chart instance
   */
  getChart(chartName) {
    return this.charts[chartName];
  }

  /**
   * Update chart data without recreating the chart
   */
  updateChartData(chartName, newData, useMetric = true) {
    const chart = this.charts[chartName];
    if (!chart) return;

    const sortedData = [...newData].sort((a, b) => new Date(a.date) - new Date(b.date));
    const labels = sortedData.map(d => d.date);

    switch (chartName) {
      case 'weight':
        const weights = sortedData.map(d => useMetric ? d.weight : d.weight * 2.20462);
        const weightMovingAvg = this.calculationService.calculateMovingAverage(weights, 7);
        chart.data.labels = labels;
        chart.data.datasets[0].data = weights;
        chart.data.datasets[1].data = weightMovingAvg;
        break;
      case 'bodyFat':
        const bodyFats = sortedData.map(d => d.bodyFat);
        const bodyFatMovingAvg = this.calculationService.calculateMovingAverage(bodyFats, 7);
        chart.data.labels = labels;
        chart.data.datasets[0].data = bodyFats;
        chart.data.datasets[1].data = bodyFatMovingAvg;
        break;
      case 'leanMass':
        const leanMasses = sortedData.map(d => useMetric ? d.leanMass : d.leanMass * 2.20462);
        const leanMassMovingAvg = this.calculationService.calculateMovingAverage(leanMasses, 7);
        chart.data.labels = labels;
        chart.data.datasets[0].data = leanMasses;
        chart.data.datasets[1].data = leanMassMovingAvg;
        break;
    }

    chart.update();
  }

  /**
   * Resize charts (useful for responsive design)
   */
  resizeCharts() {
    Object.values(this.charts).forEach(chart => {
      if (chart && !chart.destroyed) {
        chart.resize();
      }
    });
  }
}

// Browser compatibility
if (typeof window !== 'undefined') {
  window.ChartManager = ChartManager;
}

// Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChartManager;
}