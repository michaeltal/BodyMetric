const InsightsManager = require('../../js/features/InsightsManager');

describe('InsightsManager', () => {
  let insightsManager;
  let calculationService;

  beforeEach(() => {
    // Mock CalculationService
    calculationService = {
      calculateMovingAverage: jest.fn(),
      calculateTrend: jest.fn()
    };

    insightsManager = new InsightsManager(calculationService);

    // Mock DOM elements
    global.document = {
      getElementById: jest.fn(() => ({
        innerHTML: ''
      }))
    };
  });

  describe('constructor', () => {
    it('should initialize with calculation service', () => {
      expect(insightsManager.calculationService).toBe(calculationService);
      expect(insightsManager.periods).toEqual({
        sevenDay: 7,
        thirtyDay: 30,
        ninetyDay: 90
      });
    });
  });

  describe('updateInsights', () => {
    it('should update insights for all periods', () => {
      const measurements = [
        { date: '2025-01-10', weight: 70, bodyFat: 15, leanMass: 59.5 },
        { date: '2025-01-05', weight: 70.5, bodyFat: 15.5, leanMass: 59.0 }
      ];

      const mockElement = { innerHTML: '' };
      global.document.getElementById.mockReturnValue(mockElement);

      insightsManager.updateInsights(measurements);

      expect(global.document.getElementById).toHaveBeenCalledWith('sevenDayInsights');
      expect(global.document.getElementById).toHaveBeenCalledWith('thirtyDayInsights');
      expect(global.document.getElementById).toHaveBeenCalledWith('ninetyDayInsights');
    });

    it('should handle empty measurements array', () => {
      const mockElement = { innerHTML: '' };
      global.document.getElementById.mockReturnValue(mockElement);

      insightsManager.updateInsights([]);

      expect(mockElement.innerHTML).toContain('Not enough data for this period');
    });

    it('should handle null measurements', () => {
      const mockElement = { innerHTML: '' };
      global.document.getElementById.mockReturnValue(mockElement);

      insightsManager.updateInsights(null);

      expect(mockElement.innerHTML).toContain('Not enough data for this period');
    });
  });

  describe('updatePeriodInsights', () => {
    it('should handle missing DOM element', () => {
      global.document.getElementById.mockReturnValue(null);

      expect(() => {
        insightsManager.updatePeriodInsights('nonexistent', [], new Date());
      }).not.toThrow();
    });

    it('should show empty state for insufficient data', () => {
      const mockElement = { innerHTML: '' };
      global.document.getElementById.mockReturnValue(mockElement);

      const measurements = [
        { date: '2025-01-10', weight: 70, bodyFat: 15, leanMass: 59.5 }
      ];

      insightsManager.updatePeriodInsights('test', measurements, new Date('2025-01-05'));

      expect(mockElement.innerHTML).toContain('Not enough data for this period');
    });

    it('should render insights for valid data', () => {
      const mockElement = { innerHTML: '' };
      global.document.getElementById.mockReturnValue(mockElement);

      const measurements = [
        { date: '2025-01-10', weight: 70, bodyFat: 15, leanMass: 59.5 },
        { date: '2025-01-05', weight: 70.5, bodyFat: 15.5, leanMass: 59.0 }
      ];

      insightsManager.updatePeriodInsights('test', measurements, new Date('2025-01-01'));

      expect(mockElement.innerHTML).toContain('Weight Change');
      expect(mockElement.innerHTML).toContain('Body Fat Change');
      expect(mockElement.innerHTML).toContain('Lean Mass Change');
    });
  });

  describe('filterMeasurementsByDate', () => {
    it('should filter measurements by start date', () => {
      const measurements = [
        { date: '2025-01-10', weight: 70, bodyFat: 15, leanMass: 59.5 },
        { date: '2025-01-05', weight: 70.5, bodyFat: 15.5, leanMass: 59.0 },
        { date: '2025-01-01', weight: 71, bodyFat: 16, leanMass: 58.5 }
      ];

      const startDate = new Date('2025-01-03');
      const result = insightsManager.filterMeasurementsByDate(measurements, startDate);

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2025-01-10');
      expect(result[1].date).toBe('2025-01-05');
    });

    it('should handle empty measurements array', () => {
      const result = insightsManager.filterMeasurementsByDate([], new Date());
      expect(result).toHaveLength(0);
    });

    it('should handle null measurements', () => {
      const result = insightsManager.filterMeasurementsByDate(null, new Date());
      expect(result).toHaveLength(0);
    });
  });

  describe('calculatePeriodInsights', () => {
    it('should calculate insights correctly', () => {
      const measurements = [
        { date: '2025-01-10', weight: 70, bodyFat: 15, leanMass: 59.5 },
        { date: '2025-01-05', weight: 70.5, bodyFat: 15.5, leanMass: 59.0 }
      ];

      const insights = insightsManager.calculatePeriodInsights(measurements);

      expect(insights.weightChange).toBe(-0.5);
      expect(insights.bodyFatChange).toBe(-0.5);
      expect(insights.leanMassChange).toBe(0.5);
      expect(insights.periodDays).toBe(5);
      expect(insights.startDate).toBe('2025-01-05');
      expect(insights.endDate).toBe('2025-01-10');
      expect(insights.totalMeasurements).toBe(2);
    });

    it('should return null for insufficient data', () => {
      const measurements = [
        { date: '2025-01-10', weight: 70, bodyFat: 15, leanMass: 59.5 }
      ];

      const insights = insightsManager.calculatePeriodInsights(measurements);
      expect(insights).toBeNull();
    });

    it('should handle empty measurements array', () => {
      const insights = insightsManager.calculatePeriodInsights([]);
      expect(insights).toBeNull();
    });
  });

  describe('calculatePeriodDays', () => {
    it('should calculate days between dates correctly', () => {
      const days = insightsManager.calculatePeriodDays('2025-01-05', '2025-01-10');
      expect(days).toBe(5);
    });

    it('should handle same date', () => {
      const days = insightsManager.calculatePeriodDays('2025-01-05', '2025-01-05');
      expect(days).toBe(0);
    });

    it('should handle reverse dates', () => {
      const days = insightsManager.calculatePeriodDays('2025-01-10', '2025-01-05');
      expect(days).toBe(-5);
    });
  });

  describe('renderInsights', () => {
    it('should render insights HTML correctly', () => {
      const insights = {
        weightChange: -0.5,
        bodyFatChange: -0.5,
        leanMassChange: 0.5,
        periodDays: 5,
        startDate: '2025-01-05',
        endDate: '2025-01-10',
        totalMeasurements: 2
      };

      const html = insightsManager.renderInsights(insights);

      expect(html).toContain('Weight Change');
      expect(html).toContain('-0.5 kg');
      expect(html).toContain('Body Fat Change');
      expect(html).toContain('-0.5%');
      expect(html).toContain('Lean Mass Change');
      expect(html).toContain('+0.5 kg');
    });

    it('should handle null insights', () => {
      const html = insightsManager.renderInsights(null);
      expect(html).toContain('Not enough data for this period');
    });
  });

  describe('formatChange', () => {
    it('should format positive change with plus sign', () => {
      expect(insightsManager.formatChange(0.5)).toBe('+0.5');
    });

    it('should format negative change without plus sign', () => {
      expect(insightsManager.formatChange(-0.5)).toBe('-0.5');
    });

    it('should format zero change', () => {
      expect(insightsManager.formatChange(0)).toBe('+0.0');
    });
  });

  describe('getChangeClass', () => {
    it('should return neutral for small changes', () => {
      expect(insightsManager.getChangeClass(0.05)).toBe('neutral');
      expect(insightsManager.getChangeClass(-0.05)).toBe('neutral');
    });

    it('should return correct classes for regular metrics', () => {
      expect(insightsManager.getChangeClass(0.5)).toBe('positive');
      expect(insightsManager.getChangeClass(-0.5)).toBe('negative');
    });

    it('should return inverted classes for body fat', () => {
      expect(insightsManager.getChangeClass(0.5, true)).toBe('negative');
      expect(insightsManager.getChangeClass(-0.5, true)).toBe('positive');
    });
  });

  describe('getInsightsSummary', () => {
    it('should return summary for valid data', () => {
      // Use dates relative to today
      const today = new Date();
      const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
      const sixDaysAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
      
      const measurements = [
        { date: today.toISOString().split('T')[0], weight: 70, bodyFat: 15, leanMass: 59.5 },
        { date: threeDaysAgo.toISOString().split('T')[0], weight: 70.2, bodyFat: 15.2, leanMass: 59.3 },
        { date: sixDaysAgo.toISOString().split('T')[0], weight: 70.5, bodyFat: 15.5, leanMass: 59.0 }
      ];

      const summary = insightsManager.getInsightsSummary(measurements, 7);

      expect(summary.hasData).toBe(true);
      expect(summary.insights).toBeDefined();
      expect(summary.summary).toContain('Over the last');
    });

    it('should return no data for insufficient measurements', () => {
      const measurements = [
        { date: '2025-01-10', weight: 70, bodyFat: 15, leanMass: 59.5 }
      ];

      const summary = insightsManager.getInsightsSummary(measurements, 7);

      expect(summary.hasData).toBe(false);
      expect(summary.message).toBe('Not enough data for this period');
    });
  });

  describe('generateInsightsSummary', () => {
    it('should generate summary for significant changes', () => {
      const insights = {
        weightChange: -0.5,
        bodyFatChange: -0.5,
        leanMassChange: 0.5,
        periodDays: 7
      };

      const summary = insightsManager.generateInsightsSummary(insights);

      expect(summary).toContain('Over the last 7 days');
      expect(summary).toContain('lost 0.5 kg');
      expect(summary).toContain('body fat decreased 0.5%');
      expect(summary).toContain('gained 0.5 kg lean mass');
    });

    it('should handle stable measurements', () => {
      const insights = {
        weightChange: 0.05,
        bodyFatChange: 0.05,
        leanMassChange: 0.05,
        periodDays: 7
      };

      const summary = insightsManager.generateInsightsSummary(insights);

      expect(summary).toContain('measurements remained stable');
    });

    it('should handle null insights', () => {
      const summary = insightsManager.generateInsightsSummary(null);
      expect(summary).toBe('');
    });
  });

  describe('getTrendAnalysis', () => {
    it('should return trend analysis for sufficient data', () => {
      // Use dates relative to today
      const today = new Date();
      const fiveDaysAgo = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000);
      const tenDaysAgo = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000);
      const twentyDaysAgo = new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000);
      
      const measurements = [
        { date: today.toISOString().split('T')[0], weight: 70, bodyFat: 15, leanMass: 59.5 },
        { date: fiveDaysAgo.toISOString().split('T')[0], weight: 70.2, bodyFat: 15.2, leanMass: 59.3 },
        { date: tenDaysAgo.toISOString().split('T')[0], weight: 70.4, bodyFat: 15.4, leanMass: 59.1 },
        { date: twentyDaysAgo.toISOString().split('T')[0], weight: 70.5, bodyFat: 15.5, leanMass: 59.0 }
      ];

      const analysis = insightsManager.getTrendAnalysis(measurements, 30);

      expect(analysis.hasData).toBe(true);
      expect(analysis.trends).toBeDefined();
      expect(analysis.trends.weight).toBeDefined();
      expect(analysis.trends.bodyFat).toBeDefined();
      expect(analysis.trends.leanMass).toBeDefined();
      expect(analysis.analysis).toBeDefined();
    });

    it('should return no data for insufficient measurements', () => {
      const measurements = [
        { date: '2025-01-10', weight: 70, bodyFat: 15, leanMass: 59.5 },
        { date: '2025-01-05', weight: 70.5, bodyFat: 15.5, leanMass: 59.0 }
      ];

      const analysis = insightsManager.getTrendAnalysis(measurements, 30);

      expect(analysis.hasData).toBe(false);
      expect(analysis.message).toBe('Not enough data for trend analysis');
    });
  });

  describe('calculateTrendDirection', () => {
    it('should calculate increasing trend', () => {
      const values = [75, 74, 73]; // oldest to newest
      const trend = insightsManager.calculateTrendDirection(values);
      expect(trend).toBe('increasing');
    });

    it('should calculate decreasing trend', () => {
      const values = [73, 74, 75]; // oldest to newest
      const trend = insightsManager.calculateTrendDirection(values);
      expect(trend).toBe('decreasing');
    });

    it('should calculate stable trend for small changes', () => {
      const values = [74, 74.2, 74.1]; // oldest to newest
      const trend = insightsManager.calculateTrendDirection(values);
      expect(trend).toBe('stable');
    });

    it('should handle insufficient data', () => {
      const values = [74, 75];
      const trend = insightsManager.calculateTrendDirection(values);
      expect(trend).toBe('stable');
    });
  });

  describe('formatTrendAnalysis', () => {
    it('should format trends correctly', () => {
      const analysis = insightsManager.formatTrendAnalysis('decreasing', 'decreasing', 'increasing');
      expect(analysis).toBe('Weight decreasing, Body fat decreasing, Lean mass increasing');
    });

    it('should handle all stable trends', () => {
      const analysis = insightsManager.formatTrendAnalysis('stable', 'stable', 'stable');
      expect(analysis).toBe('All metrics remain stable');
    });

    it('should handle mixed trends', () => {
      const analysis = insightsManager.formatTrendAnalysis('increasing', 'stable', 'decreasing');
      expect(analysis).toBe('Weight increasing, Lean mass decreasing');
    });
  });

  describe('getCustomPeriodInsights', () => {
    it('should return insights for custom date range', () => {
      const measurements = [
        { date: '2025-01-10', weight: 70, bodyFat: 15, leanMass: 59.5 },
        { date: '2025-01-05', weight: 70.5, bodyFat: 15.5, leanMass: 59.0 }
      ];

      const insights = insightsManager.getCustomPeriodInsights(measurements, '2025-01-01', '2025-01-15');

      expect(insights.hasData).toBe(true);
      expect(insights.insights).toBeDefined();
      expect(insights.html).toContain('Weight Change');
    });

    it('should return no data for insufficient measurements in range', () => {
      const measurements = [
        { date: '2025-01-10', weight: 70, bodyFat: 15, leanMass: 59.5 }
      ];

      const insights = insightsManager.getCustomPeriodInsights(measurements, '2025-01-01', '2025-01-15');

      expect(insights.hasData).toBe(false);
      expect(insights.message).toBe('Not enough data for this date range');
    });

    it('should filter measurements correctly by date range', () => {
      const measurements = [
        { date: '2025-01-15', weight: 70, bodyFat: 15, leanMass: 59.5 },
        { date: '2025-01-10', weight: 70.2, bodyFat: 15.2, leanMass: 59.3 },
        { date: '2025-01-05', weight: 70.5, bodyFat: 15.5, leanMass: 59.0 },
        { date: '2025-01-01', weight: 71, bodyFat: 16, leanMass: 58.5 }
      ];

      const insights = insightsManager.getCustomPeriodInsights(measurements, '2025-01-04', '2025-01-12');

      expect(insights.hasData).toBe(true);
      expect(insights.insights.totalMeasurements).toBe(2); // Only 2025-01-10 and 2025-01-05
    });
  });
});