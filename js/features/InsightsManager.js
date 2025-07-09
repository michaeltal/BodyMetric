/**
 * InsightsManager - Handles period-based insights calculations and display
 * 
 * Responsibilities:
 * - Calculate period-based insights (7-day, 30-day, 90-day)
 * - Display trend changes and progress
 * - Generate insight text and classifications
 * - Format metric changes with proper styling
 */
class InsightsManager {
  constructor(calculationService) {
    this.calculationService = calculationService;
    
    // Standard insight periods in days
    this.periods = {
      sevenDay: 7,
      thirtyDay: 30,
      ninetyDay: 90
    };
  }

  /**
   * Update insights for all time periods
   */
  updateInsights(measurements) {
    const now = new Date();
    
    // Calculate start dates for each period
    const sevenDaysAgo = new Date(now.getTime() - this.periods.sevenDay * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - this.periods.thirtyDay * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - this.periods.ninetyDay * 24 * 60 * 60 * 1000);
    
    // Update each period's insights
    this.updatePeriodInsights('sevenDayInsights', measurements, sevenDaysAgo);
    this.updatePeriodInsights('thirtyDayInsights', measurements, thirtyDaysAgo);
    this.updatePeriodInsights('ninetyDayInsights', measurements, ninetyDaysAgo);
  }

  /**
   * Calculate insights for specific time period
   */
  updatePeriodInsights(elementId, measurements, startDate) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const periodData = this.filterMeasurementsByDate(measurements, startDate);
    
    if (periodData.length < 2) {
      element.innerHTML = '<div class="empty-state"><p>Not enough data for this period</p></div>';
      return;
    }
    
    const insights = this.calculatePeriodInsights(periodData);
    element.innerHTML = this.renderInsights(insights);
  }

  /**
   * Filter measurements by start date
   */
  filterMeasurementsByDate(measurements, startDate) {
    if (!measurements || measurements.length === 0) return [];
    
    return measurements.filter(m => {
      const measurementDate = new Date(m.date);
      return measurementDate >= startDate;
    });
  }

  /**
   * Calculate insights for a period of measurements
   */
  calculatePeriodInsights(measurements) {
    if (measurements.length < 2) {
      return null;
    }

    const latest = measurements[0];
    const oldest = measurements[measurements.length - 1];
    
    const weightChange = latest.weight - oldest.weight;
    const bodyFatChange = latest.bodyFat - oldest.bodyFat;
    const leanMassChange = latest.leanMass - oldest.leanMass;
    
    return {
      weightChange,
      bodyFatChange,
      leanMassChange,
      periodDays: this.calculatePeriodDays(oldest.date, latest.date),
      startDate: oldest.date,
      endDate: latest.date,
      totalMeasurements: measurements.length
    };
  }

  /**
   * Calculate number of days between two dates
   */
  calculatePeriodDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  /**
   * Render insights HTML
   */
  renderInsights(insights) {
    if (!insights) {
      return '<div class="empty-state"><p>Not enough data for this period</p></div>';
    }

    const { weightChange, bodyFatChange, leanMassChange } = insights;

    return `
      <div class="insight-metric">
        <span class="insight-metric-label">Weight Change</span>
        <span class="insight-metric-value ${this.getChangeClass(weightChange)}">
          ${this.formatChange(weightChange)} kg
        </span>
      </div>
      <div class="insight-metric">
        <span class="insight-metric-label">Body Fat Change</span>
        <span class="insight-metric-value ${this.getChangeClass(bodyFatChange, true)}">
          ${this.formatChange(bodyFatChange)}%
        </span>
      </div>
      <div class="insight-metric">
        <span class="insight-metric-label">Lean Mass Change</span>
        <span class="insight-metric-value ${this.getChangeClass(leanMassChange)}">
          ${this.formatChange(leanMassChange)} kg
        </span>
      </div>
    `;
  }

  /**
   * Format change value with proper sign
   */
  formatChange(change) {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}`;
  }

  /**
   * Classify change as positive/negative/neutral
   */
  getChangeClass(change, isBodyFat = false) {
    if (Math.abs(change) < 0.1) return 'neutral';
    
    if (isBodyFat) {
      // For body fat, decrease is positive (good)
      return change > 0 ? 'negative' : 'positive';
    } else {
      // For weight and lean mass, increase is positive (good for lean mass, context-dependent for weight)
      return change > 0 ? 'positive' : 'negative';
    }
  }

  /**
   * Get insights summary for a specific period
   */
  getInsightsSummary(measurements, periodDays) {
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
    const periodData = this.filterMeasurementsByDate(measurements, startDate);
    
    if (periodData.length < 2) {
      return {
        hasData: false,
        message: 'Not enough data for this period'
      };
    }

    const insights = this.calculatePeriodInsights(periodData);
    
    return {
      hasData: true,
      insights,
      summary: this.generateInsightsSummary(insights)
    };
  }

  /**
   * Generate text summary of insights
   */
  generateInsightsSummary(insights) {
    if (!insights) return '';

    const { weightChange, bodyFatChange, leanMassChange, periodDays } = insights;
    
    let summary = `Over the last ${periodDays} days: `;
    const changes = [];

    if (Math.abs(weightChange) >= 0.1) {
      const direction = weightChange > 0 ? 'gained' : 'lost';
      changes.push(`${direction} ${Math.abs(weightChange).toFixed(1)} kg`);
    }

    if (Math.abs(bodyFatChange) >= 0.1) {
      const direction = bodyFatChange > 0 ? 'increased' : 'decreased';
      changes.push(`body fat ${direction} ${Math.abs(bodyFatChange).toFixed(1)}%`);
    }

    if (Math.abs(leanMassChange) >= 0.1) {
      const direction = leanMassChange > 0 ? 'gained' : 'lost';
      changes.push(`${direction} ${Math.abs(leanMassChange).toFixed(1)} kg lean mass`);
    }

    if (changes.length === 0) {
      return `${summary}measurements remained stable`;
    }

    return `${summary}${changes.join(', ')}`;
  }

  /**
   * Get trend analysis for metrics
   */
  getTrendAnalysis(measurements, periodDays = 30) {
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
    const periodData = this.filterMeasurementsByDate(measurements, startDate);
    
    if (periodData.length < 3) {
      return {
        hasData: false,
        message: 'Not enough data for trend analysis'
      };
    }

    // Calculate trends using moving averages
    const weights = periodData.map(m => m.weight);
    const bodyFats = periodData.map(m => m.bodyFat);
    const leanMasses = periodData.map(m => m.leanMass);

    const weightTrend = this.calculateTrendDirection(weights);
    const bodyFatTrend = this.calculateTrendDirection(bodyFats);
    const leanMassTrend = this.calculateTrendDirection(leanMasses);

    return {
      hasData: true,
      trends: {
        weight: weightTrend,
        bodyFat: bodyFatTrend,
        leanMass: leanMassTrend
      },
      analysis: this.formatTrendAnalysis(weightTrend, bodyFatTrend, leanMassTrend)
    };
  }

  /**
   * Calculate trend direction from a series of values
   */
  calculateTrendDirection(values) {
    if (values.length < 3) return 'stable';

    const first = values[values.length - 1]; // oldest
    const last = values[0]; // newest
    const change = last - first;
    const percentChange = (change / first) * 100;

    if (Math.abs(percentChange) < 1) return 'stable';
    return percentChange > 0 ? 'increasing' : 'decreasing';
  }

  /**
   * Format trend analysis into readable text
   */
  formatTrendAnalysis(weightTrend, bodyFatTrend, leanMassTrend) {
    const trends = [];

    if (weightTrend !== 'stable') {
      trends.push(`Weight ${weightTrend}`);
    }

    if (bodyFatTrend !== 'stable') {
      trends.push(`Body fat ${bodyFatTrend}`);
    }

    if (leanMassTrend !== 'stable') {
      trends.push(`Lean mass ${leanMassTrend}`);
    }

    if (trends.length === 0) {
      return 'All metrics remain stable';
    }

    return trends.join(', ');
  }

  /**
   * Get insights for custom date range
   */
  getCustomPeriodInsights(measurements, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const periodData = measurements.filter(m => {
      const measurementDate = new Date(m.date);
      return measurementDate >= start && measurementDate <= end;
    });

    if (periodData.length < 2) {
      return {
        hasData: false,
        message: 'Not enough data for this date range'
      };
    }

    const insights = this.calculatePeriodInsights(periodData);
    
    return {
      hasData: true,
      insights,
      html: this.renderInsights(insights)
    };
  }
}

// Browser compatibility
if (typeof window !== 'undefined') {
  window.InsightsManager = InsightsManager;
}

// Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InsightsManager;
}