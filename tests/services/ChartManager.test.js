const ChartManager = require('../../js/ui/ChartManager');

// Mock Chart.js
global.Chart = jest.fn().mockImplementation((ctx, config) => ({
  data: config.data,
  options: config.options,
  destroy: jest.fn(),
  update: jest.fn(),
  resize: jest.fn(),
  destroyed: false
}));

describe('ChartManager', () => {
  let chartManager;
  let calculationService;
  let mockCanvas;
  let mockContext;

  beforeEach(() => {
    // Mock CalculationService
    calculationService = {
      calculateMovingAverage: jest.fn().mockReturnValue([70, 69.5, 69])
    };

    chartManager = new ChartManager(calculationService);

    // Mock DOM elements
    mockContext = {
      canvas: {},
      getContext: jest.fn().mockReturnThis()
    };
    
    mockCanvas = {
      getContext: jest.fn().mockReturnValue(mockContext)
    };

    global.document = {
      getElementById: jest.fn().mockReturnValue(mockCanvas)
    };

    // Clear Chart mock calls
    global.Chart.mockClear();
  });

  describe('constructor', () => {
    it('should initialize with calculation service', () => {
      expect(chartManager.calculationService).toBe(calculationService);
      expect(chartManager.charts).toEqual({});
    });
  });

  describe('updateCharts', () => {
    const sampleMeasurements = [
      { date: '2025-01-10', weight: 70, bodyFat: 15, leanMass: 59.5 },
      { date: '2025-01-05', weight: 70.5, bodyFat: 15.5, leanMass: 59.0 }
    ];

    it('should create all charts with measurements', () => {
      chartManager.updateCharts(sampleMeasurements, true);

      expect(global.document.getElementById).toHaveBeenCalledWith('weightChart');
      expect(global.document.getElementById).toHaveBeenCalledWith('bodyFatChart');
      expect(global.document.getElementById).toHaveBeenCalledWith('leanMassChart');
      expect(global.Chart).toHaveBeenCalledTimes(3);
    });

    it('should handle empty measurements array', () => {
      chartManager.updateCharts([]);
      expect(global.Chart).not.toHaveBeenCalled();
    });

    it('should handle null measurements', () => {
      chartManager.updateCharts(null);
      expect(global.Chart).not.toHaveBeenCalled();
    });

    it('should sort data by date before creating charts', () => {
      const unsortedData = [
        { date: '2025-01-10', weight: 70, bodyFat: 15, leanMass: 59.5 },
        { date: '2025-01-05', weight: 70.5, bodyFat: 15.5, leanMass: 59.0 }
      ];

      chartManager.updateCharts(unsortedData, true);

      // Verify Chart was called with sorted data
      expect(global.Chart).toHaveBeenCalled();
      const chartCall = global.Chart.mock.calls[0][1];
      expect(chartCall.data.labels).toEqual(['2025-01-05', '2025-01-10']);
    });
  });

  describe('createWeightChart', () => {
    const sampleData = [
      { date: '2025-01-05', weight: 70.5, bodyFat: 15.5, leanMass: 59.0 },
      { date: '2025-01-10', weight: 70, bodyFat: 15, leanMass: 59.5 }
    ];

    it('should create weight chart with correct data (metric)', () => {
      chartManager.createWeightChart(sampleData, true);

      expect(global.Chart).toHaveBeenCalledTimes(1);
      const chartConfig = global.Chart.mock.calls[0][1];
      
      expect(chartConfig.type).toBe('line');
      expect(chartConfig.data.labels).toEqual(['2025-01-05', '2025-01-10']);
      expect(chartConfig.data.datasets[0].data).toEqual([70.5, 70]);
      expect(chartConfig.data.datasets[0].label).toBe('Daily Weight');
      expect(chartConfig.data.datasets[1].label).toBe('7-Day Average');
    });

    it('should create weight chart with correct data (imperial)', () => {
      chartManager.createWeightChart(sampleData, false);

      const chartConfig = global.Chart.mock.calls[0][1];
      // Convert kg to lbs: 70.5 * 2.20462 ≈ 155.42, 70 * 2.20462 ≈ 154.32
      expect(chartConfig.data.datasets[0].data).toEqual([
        70.5 * 2.20462,
        70 * 2.20462
      ]);
    });

    it('should handle missing canvas element', () => {
      global.document.getElementById.mockReturnValue(null);
      
      expect(() => {
        chartManager.createWeightChart(sampleData, true);
      }).not.toThrow();
      
      expect(global.Chart).not.toHaveBeenCalled();
    });

    it('should destroy existing chart before creating new one', () => {
      const mockExistingChart = {
        destroy: jest.fn(),
        destroyed: false
      };
      chartManager.charts.weight = mockExistingChart;

      chartManager.createWeightChart(sampleData, true);

      expect(mockExistingChart.destroy).toHaveBeenCalled();
      expect(global.Chart).toHaveBeenCalled();
    });

    it('should call calculateMovingAverage for weight data', () => {
      chartManager.createWeightChart(sampleData, true);

      expect(calculationService.calculateMovingAverage).toHaveBeenCalledWith([70.5, 70], 7);
    });
  });

  describe('createBodyFatChart', () => {
    const sampleData = [
      { date: '2025-01-05', weight: 70.5, bodyFat: 15.5, leanMass: 59.0 },
      { date: '2025-01-10', weight: 70, bodyFat: 15, leanMass: 59.5 }
    ];

    it('should create body fat chart with correct data', () => {
      chartManager.createBodyFatChart(sampleData);

      expect(global.Chart).toHaveBeenCalledTimes(1);
      const chartConfig = global.Chart.mock.calls[0][1];
      
      expect(chartConfig.type).toBe('line');
      expect(chartConfig.data.labels).toEqual(['2025-01-05', '2025-01-10']);
      expect(chartConfig.data.datasets[0].data).toEqual([15.5, 15]);
      expect(chartConfig.data.datasets[0].label).toBe('Daily Body Fat %');
      expect(chartConfig.data.datasets[1].label).toBe('7-Day Average');
    });

    it('should handle missing canvas element', () => {
      global.document.getElementById.mockReturnValue(null);
      
      expect(() => {
        chartManager.createBodyFatChart(sampleData);
      }).not.toThrow();
      
      expect(global.Chart).not.toHaveBeenCalled();
    });

    it('should destroy existing chart before creating new one', () => {
      const mockExistingChart = {
        destroy: jest.fn(),
        destroyed: false
      };
      chartManager.charts.bodyFat = mockExistingChart;

      chartManager.createBodyFatChart(sampleData);

      expect(mockExistingChart.destroy).toHaveBeenCalled();
      expect(global.Chart).toHaveBeenCalled();
    });
  });

  describe('createLeanMassChart', () => {
    const sampleData = [
      { date: '2025-01-05', weight: 70.5, bodyFat: 15.5, leanMass: 59.0 },
      { date: '2025-01-10', weight: 70, bodyFat: 15, leanMass: 59.5 }
    ];

    it('should create lean mass chart with correct data (metric)', () => {
      chartManager.createLeanMassChart(sampleData, true);

      expect(global.Chart).toHaveBeenCalledTimes(1);
      const chartConfig = global.Chart.mock.calls[0][1];
      
      expect(chartConfig.type).toBe('line');
      expect(chartConfig.data.labels).toEqual(['2025-01-05', '2025-01-10']);
      expect(chartConfig.data.datasets[0].data).toEqual([59.0, 59.5]);
      expect(chartConfig.data.datasets[0].label).toBe('Daily Lean Mass');
      expect(chartConfig.data.datasets[1].label).toBe('7-Day Average');
    });

    it('should create lean mass chart with correct data (imperial)', () => {
      chartManager.createLeanMassChart(sampleData, false);

      const chartConfig = global.Chart.mock.calls[0][1];
      expect(chartConfig.data.datasets[0].data).toEqual([
        59.0 * 2.20462,
        59.5 * 2.20462
      ]);
    });

    it('should handle missing canvas element', () => {
      global.document.getElementById.mockReturnValue(null);
      
      expect(() => {
        chartManager.createLeanMassChart(sampleData, true);
      }).not.toThrow();
      
      expect(global.Chart).not.toHaveBeenCalled();
    });

    it('should destroy existing chart before creating new one', () => {
      const mockExistingChart = {
        destroy: jest.fn(),
        destroyed: false
      };
      chartManager.charts.leanMass = mockExistingChart;

      chartManager.createLeanMassChart(sampleData, true);

      expect(mockExistingChart.destroy).toHaveBeenCalled();
      expect(global.Chart).toHaveBeenCalled();
    });
  });

  describe('chart configuration methods', () => {
    it('should return correct weight chart options (metric)', () => {
      const options = chartManager.getWeightChartOptions(true);
      
      expect(options.responsive).toBe(true);
      expect(options.maintainAspectRatio).toBe(false);
      expect(options.scales.y.title.text).toBe('Weight (kg)');
      expect(options.scales.x.type).toBe('time');
    });

    it('should return correct weight chart options (imperial)', () => {
      const options = chartManager.getWeightChartOptions(false);
      
      expect(options.scales.y.title.text).toBe('Weight (lbs)');
    });

    it('should return correct body fat chart options', () => {
      const options = chartManager.getBodyFatChartOptions();
      
      expect(options.responsive).toBe(true);
      expect(options.scales.y.title.text).toBe('Body Fat (%)');
    });

    it('should return correct lean mass chart options (metric)', () => {
      const options = chartManager.getLeanMassChartOptions(true);
      
      expect(options.scales.y.title.text).toBe('Lean Mass (kg)');
    });

    it('should return correct lean mass chart options (imperial)', () => {
      const options = chartManager.getLeanMassChartOptions(false);
      
      expect(options.scales.y.title.text).toBe('Lean Mass (lbs)');
    });
  });

  describe('chart lifecycle management', () => {
    beforeEach(() => {
      chartManager.charts = {
        weight: { destroy: jest.fn(), destroyed: false },
        bodyFat: { destroy: jest.fn(), destroyed: false },
        leanMass: { destroy: jest.fn(), destroyed: false }
      };
    });

    it('should destroy all charts', () => {
      const weightDestroy = chartManager.charts.weight.destroy;
      const bodyFatDestroy = chartManager.charts.bodyFat.destroy;
      const leanMassDestroy = chartManager.charts.leanMass.destroy;

      chartManager.destroyCharts();

      expect(weightDestroy).toHaveBeenCalled();
      expect(bodyFatDestroy).toHaveBeenCalled();
      expect(leanMassDestroy).toHaveBeenCalled();
      expect(Object.keys(chartManager.charts)).toHaveLength(0);
    });

    it('should destroy specific chart', () => {
      const weightDestroy = chartManager.charts.weight.destroy;

      chartManager.destroyChart('weight');

      expect(weightDestroy).toHaveBeenCalled();
      expect(chartManager.charts.weight).toBeUndefined();
      expect(chartManager.charts.bodyFat).toBeDefined();
      expect(chartManager.charts.leanMass).toBeDefined();
    });

    it('should handle destroying non-existent chart', () => {
      expect(() => {
        chartManager.destroyChart('nonexistent');
      }).not.toThrow();
    });

    it('should check if chart exists', () => {
      expect(chartManager.hasChart('weight')).toBe(true);
      expect(chartManager.hasChart('nonexistent')).toBe(false);
    });

    it('should detect destroyed charts', () => {
      chartManager.charts.weight.destroyed = true;
      expect(chartManager.hasChart('weight')).toBe(false);
    });

    it('should get chart instance', () => {
      const chart = chartManager.getChart('weight');
      expect(chart).toBe(chartManager.charts.weight);
    });

    it('should return undefined for non-existent chart', () => {
      const chart = chartManager.getChart('nonexistent');
      expect(chart).toBeUndefined();
    });
  });

  describe('updateChartData', () => {
    const sampleData = [
      { date: '2025-01-05', weight: 70.5, bodyFat: 15.5, leanMass: 59.0 },
      { date: '2025-01-10', weight: 70, bodyFat: 15, leanMass: 59.5 }
    ];

    beforeEach(() => {
      chartManager.charts = {
        weight: {
          data: { labels: [], datasets: [{ data: [] }, { data: [] }] },
          update: jest.fn(),
          destroyed: false
        },
        bodyFat: {
          data: { labels: [], datasets: [{ data: [] }, { data: [] }] },
          update: jest.fn(),
          destroyed: false
        },
        leanMass: {
          data: { labels: [], datasets: [{ data: [] }, { data: [] }] },
          update: jest.fn(),
          destroyed: false
        }
      };
    });

    it('should update weight chart data', () => {
      chartManager.updateChartData('weight', sampleData, true);

      const chart = chartManager.charts.weight;
      expect(chart.data.labels).toEqual(['2025-01-05', '2025-01-10']);
      expect(chart.data.datasets[0].data).toEqual([70.5, 70]);
      expect(chart.update).toHaveBeenCalled();
    });

    it('should update body fat chart data', () => {
      chartManager.updateChartData('bodyFat', sampleData);

      const chart = chartManager.charts.bodyFat;
      expect(chart.data.labels).toEqual(['2025-01-05', '2025-01-10']);
      expect(chart.data.datasets[0].data).toEqual([15.5, 15]);
      expect(chart.update).toHaveBeenCalled();
    });

    it('should update lean mass chart data', () => {
      chartManager.updateChartData('leanMass', sampleData, true);

      const chart = chartManager.charts.leanMass;
      expect(chart.data.labels).toEqual(['2025-01-05', '2025-01-10']);
      expect(chart.data.datasets[0].data).toEqual([59.0, 59.5]);
      expect(chart.update).toHaveBeenCalled();
    });

    it('should handle non-existent chart', () => {
      expect(() => {
        chartManager.updateChartData('nonexistent', sampleData);
      }).not.toThrow();
    });

    it('should convert units for imperial weight data', () => {
      chartManager.updateChartData('weight', sampleData, false);

      const chart = chartManager.charts.weight;
      expect(chart.data.datasets[0].data).toEqual([
        70.5 * 2.20462,
        70 * 2.20462
      ]);
    });
  });

  describe('resizeCharts', () => {
    beforeEach(() => {
      chartManager.charts = {
        weight: { resize: jest.fn(), destroyed: false },
        bodyFat: { resize: jest.fn(), destroyed: false },
        leanMass: { resize: jest.fn(), destroyed: false }
      };
    });

    it('should resize all charts', () => {
      chartManager.resizeCharts();

      expect(chartManager.charts.weight.resize).toHaveBeenCalled();
      expect(chartManager.charts.bodyFat.resize).toHaveBeenCalled();
      expect(chartManager.charts.leanMass.resize).toHaveBeenCalled();
    });

    it('should handle destroyed charts', () => {
      chartManager.charts.weight.destroyed = true;

      expect(() => {
        chartManager.resizeCharts();
      }).not.toThrow();

      expect(chartManager.charts.weight.resize).not.toHaveBeenCalled();
      expect(chartManager.charts.bodyFat.resize).toHaveBeenCalled();
    });

    it('should handle empty charts object', () => {
      chartManager.charts = {};

      expect(() => {
        chartManager.resizeCharts();
      }).not.toThrow();
    });
  });
});