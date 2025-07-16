/**
 * UnifiedGoalManager - Unified goal-centric dashboard combining insights and goal progress
 * 
 * This service replaces the separate InsightsManager and GoalManager approach with
 * a unified goal-centric view that shows all relevant information for each goal
 * in integrated cards.
 * 
 * Responsibilities:
 * - Render goal-centric cards with integrated insights
 * - Calculate period-based trends for each specific goal metric
 * - Display timeline estimations within goal context
 * - Provide better space utilization and user experience
 * - Maintain backwards compatibility with existing APIs
 */
class UnifiedGoalManager {
  constructor(calculationService, dataManager) {
    this.calculationService = calculationService;
    this.dataManager = dataManager;
    
    // Standard insight periods in days
    this.periods = {
      sevenDay: 7,
      thirtyDay: 30,
      ninetyDay: 90
    };
  }

  /**
   * Main method to update unified goal progress display
   */
  updateUnifiedGoalProgress(measurements, goals, useMetric = true) {
    const container = document.getElementById('unifiedGoalProgress');
    
    if (!container) {
      console.error('UnifiedGoalManager: unifiedGoalProgress container not found');
      return;
    }
    
    if (!measurements || measurements.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>Add measurements to track goal progress</p></div>';
      return;
    }

    const latest = measurements[0];
    
    // Check if any goals are set
    const hasAnyGoal = (goals.weight !== undefined && goals.weight !== null) ||
                      (goals.bodyFat !== undefined && goals.bodyFat !== null) ||
                      (goals.leanMass !== undefined && goals.leanMass !== null);
    
    let html = '';
    
    // Always create cards for all metrics, pass hasAnyGoal for layout optimization
    html += this.renderGoalCard('weight', 'Weight', latest.weight, goals.weight, measurements, useMetric, hasAnyGoal);
    html += this.renderGoalCard('bodyFat', 'Body Fat', latest.bodyFat, goals.bodyFat, measurements, useMetric, hasAnyGoal);
    html += this.renderGoalCard('leanMass', 'Lean Mass', latest.leanMass, goals.leanMass, measurements, useMetric, hasAnyGoal);
    
    container.innerHTML = html;
  }

  /**
   * Render a unified goal card with insights, progress, and timeline
   */
  renderGoalCard(field, label, currentValue, goalValue, measurements, useMetric, hasAnyGoal) {
    const isBodyFat = field === 'bodyFat';
    const unit = this.getDisplayUnit(field, useMetric);
    const hasGoal = goalValue !== undefined && goalValue !== null;
    
    // Convert values for display
    const displayCurrent = this.convertForDisplay(currentValue, field, useMetric);
    const displayGoal = hasGoal ? this.convertForDisplay(goalValue, field, useMetric) : null;
    
    // Calculate progress only if goal is set
    let progress = null;
    if (hasGoal) {
      try {
        progress = this.calculationService.calculateGoalProgress(currentValue, goalValue, isBodyFat, measurements);
      } catch (error) {
        console.error('Error calculating goal progress:', error);
        progress = null;
      }
    }
    
    // Calculate insights for this metric (regardless of goal status)
    let insights = null;
    try {
      insights = this.calculateInsightsForMetric(measurements, field);
    } catch (error) {
      console.error('Error calculating insights:', error);
      insights = null;
    }
    
    // Calculate timeline estimation only if goal is set
    let timeline = null;
    if (hasGoal) {
      try {
        timeline = this.calculationService.estimateGoalTimeline(measurements, field, currentValue, goalValue, 30);
      } catch (error) {
        console.error('Error calculating timeline:', error);
        timeline = null;
      }
    }
    
    // Render goal card - only include progress section if any goals are set
    return `
      <div class="unified-goal-card">
        ${this.renderGoalHeader(label, displayCurrent, displayGoal, unit, hasGoal)}
        ${hasAnyGoal ? this.renderGoalProgress(displayCurrent, displayGoal, progress, unit, hasGoal) : ''}
        ${this.renderGoalInsights(insights, field, useMetric)}
        ${this.renderGoalTimeline(timeline, unit, hasGoal)}
      </div>
    `;
  }

  /**
   * Render goal card header
   */
  renderGoalHeader(label, currentValue, goalValue, unit, hasGoal) {
    // Handle undefined or null current values
    const displayCurrent = (currentValue !== undefined && currentValue !== null) ? currentValue.toFixed(1) : 'N/A';
    
    if (!hasGoal) {
      return `
        <div class="goal-header">
          <h3 class="goal-title">${label}</h3>
          <div class="goal-values">
            <span class="goal-current">${displayCurrent} ${unit}</span>
            <span class="goal-no-target clickable" onclick="document.getElementById('toggleGoalForm').click()" title="Click to set goal">No goal set</span>
          </div>
        </div>
      `;
    }
    
    // Handle undefined or null goal values
    const displayGoal = (goalValue !== undefined && goalValue !== null) ? goalValue.toFixed(1) : 'N/A';
    
    return `
      <div class="goal-header">
        <h3 class="goal-title">${label}</h3>
        <div class="goal-values">
          <span class="goal-current">${displayCurrent} ${unit}</span>
          <span class="goal-arrow">→</span>
          <span class="goal-target">${displayGoal} ${unit}</span>
        </div>
      </div>
    `;
  }

  /**
   * Render goal progress bar and remaining amount
   */
  renderGoalProgress(currentValue, goalValue, progress, unit, hasGoal) {
    if (!hasGoal) {
      return `
        <div class="goal-progress">
          <div class="goal-no-progress-minimal">
            <!-- Empty space to maintain visual alignment -->
          </div>
        </div>
      `;
    }
    
    const remaining = Math.abs(goalValue - currentValue);
    const remainingText = remaining < 0.1 ? 'Goal achieved!' : `${remaining.toFixed(1)} ${unit} to go`;
    
    return `
      <div class="goal-progress">
        <div class="goal-progress-bar">
          <div class="goal-progress-fill" style="width: ${progress}%"></div>
        </div>
        <div class="goal-progress-text">
          <span class="goal-remaining">${remainingText}</span>
          <span class="goal-percentage">(${Math.round(progress)}%)</span>
        </div>
      </div>
    `;
  }

  /**
   * Render goal insights grid (7-day, 30-day, 90-day)
   */
  renderGoalInsights(insights, field, useMetric) {
    if (!insights || Object.keys(insights).length === 0) {
      return `
        <div class="goal-insights">
          <div class="goal-insights-empty">
            <p>Add more measurements to see progress insights</p>
          </div>
        </div>
      `;
    }

    const unit = this.getDisplayUnit(field, useMetric);
    
    return `
      <div class="goal-insights">
        <div class="goal-insights-grid">
          ${this.renderInsightItem('7-Day', insights.sevenDay, unit)}
          ${this.renderInsightItem('30-Day', insights.thirtyDay, unit)}
          ${this.renderInsightItem('90-Day', insights.ninetyDay, unit)}
        </div>
      </div>
    `;
  }

  /**
   * Render individual insight item
   */
  renderInsightItem(period, change, unit) {
    if (change === null || change === undefined) {
      return `
        <div class="goal-insight-item">
          <div class="insight-period">${period}</div>
          <div class="insight-value insufficient-data">N/A</div>
        </div>
      `;
    }

    const changeClass = this.getChangeClass(change);
    const formattedChange = this.formatChange(change, unit);
    
    return `
      <div class="goal-insight-item">
        <div class="insight-period">${period}</div>
        <div class="insight-value ${changeClass}">${formattedChange}</div>
      </div>
    `;
  }

  /**
   * Render goal timeline estimation
   */
  renderGoalTimeline(timeline, unit, hasGoal) {
    if (!hasGoal) {
      return `
        <div class="goal-timeline">
          <div class="goal-timeline-estimate timeline-info">
            <span class="timeline-text">Set a goal to see timeline estimate</span>
          </div>
        </div>
      `;
    }
    
    if (!timeline || !timeline.success) {
      let message = 'Timeline estimate not available';
      let className = 'timeline-info';
      
      if (timeline) {
        switch (timeline.reason) {
          case 'insufficient_data':
            message = 'Need more measurement data for timeline estimation';
            break;
          case 'no_goal':
            message = 'Set a goal to see timeline estimate';
            break;
          case 'goal_achieved':
            message = 'Goal already achieved! 🎉';
            className = 'timeline-success';
            break;
          case 'trend_too_weak':
            message = 'Trend too weak for reliable prediction';
            className = 'timeline-warning';
            break;
          case 'timeline_too_long':
            message = 'Goal timeline too long to predict reliably';
            className = 'timeline-warning';
            break;
          case 'invalid_timeline':
            message = 'Current trend goes in opposite direction from goal';
            className = 'timeline-warning';
            break;
        }
      }
      
      return `
        <div class="goal-timeline">
          <div class="goal-timeline-estimate ${className}">
            ${message}
          </div>
        </div>
      `;
    }

    const confidenceClass = `confidence-${timeline.confidence}`;
    const achievableClass = timeline.achievable ? 'achievable' : 'challenging';
    const formatted = this.calculationService.formatTimelineEstimate(timeline.daysToGoal, timeline.confidence);
    
    // Handle case where formatting fails
    if (!formatted || !formatted.estimate) {
      return `
        <div class="goal-timeline">
          <div class="goal-timeline-estimate timeline-info">
            Timeline estimate not available
          </div>
        </div>
      `;
    }
    
    return `
      <div class="goal-timeline">
        <div class="goal-timeline-estimate ${achievableClass}">
          <span class="timeline-text">${formatted.estimate}</span>
          <span class="goal-confidence-indicator ${confidenceClass}">
            ${timeline.confidence} confidence
          </span>
        </div>
        <div class="goal-timeline-details">
          <span class="timeline-rate">at ${Math.abs(timeline.dailyRate).toFixed(2)} ${unit}/day</span>
          <span class="timeline-target-date">${timeline.targetDate.toLocaleDateString()}</span>
        </div>
      </div>
    `;
  }

  /**
   * Calculate insights for a specific metric (regardless of goal status)
   */
  calculateInsightsForMetric(measurements, field) {
    if (!measurements || measurements.length < 2) {
      return null;
    }

    const now = new Date();
    const insights = {};

    // Calculate insights for each period
    [
      { key: 'sevenDay', days: this.periods.sevenDay },
      { key: 'thirtyDay', days: this.periods.thirtyDay },
      { key: 'ninetyDay', days: this.periods.ninetyDay }
    ].forEach(period => {
      const startDate = new Date(now.getTime() - period.days * 24 * 60 * 60 * 1000);
      const periodData = this.filterMeasurementsByDate(measurements, startDate);
      
      if (periodData.length >= 2) {
        const latest = periodData[0];
        const oldest = periodData[periodData.length - 1];
        insights[period.key] = latest[field] - oldest[field];
      } else {
        insights[period.key] = null;
      }
    });

    return insights;
  }

  /**
   * Calculate insights for a specific goal metric (backwards compatibility)
   */
  calculateInsightsForGoal(measurements, field, currentValue, goalValue) {
    return this.calculateInsightsForMetric(measurements, field);
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
   * Get display unit for a field
   */
  getDisplayUnit(field, useMetric) {
    switch (field) {
      case 'weight':
      case 'leanMass':
        return useMetric ? 'kg' : 'lbs';
      case 'bodyFat':
        return '%';
      default:
        return '';
    }
  }

  /**
   * Convert value for display based on unit preferences
   */
  convertForDisplay(value, field, useMetric) {
    if (field === 'bodyFat' || useMetric) {
      return value;
    }
    
    switch (field) {
      case 'weight':
        return this.calculationService.convertWeight(value, false);
      case 'leanMass':
        return this.calculationService.convertLeanMass(value, false);
      default:
        return value;
    }
  }

  /**
   * Get CSS class for change value
   */
  getChangeClass(change) {
    if (change > 0) return 'positive-change';
    if (change < 0) return 'negative-change';
    return 'no-change';
  }

  /**
   * Format change value with proper sign and unit
   */
  formatChange(change, unit) {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)} ${unit}`;
  }

  /**
   * Backwards compatibility method - delegates to unified approach
   */
  updateGoalProgress(measurements, goals, useMetric = true) {
    console.warn('UnifiedGoalManager: updateGoalProgress is deprecated, use updateUnifiedGoalProgress instead');
    this.updateUnifiedGoalProgress(measurements, goals, useMetric);
  }

  /**
   * Backwards compatibility method - delegates to unified approach
   */
  updateInsights(measurements) {
    console.warn('UnifiedGoalManager: updateInsights is deprecated, insights are now integrated into goal cards');
    // This method is intentionally empty since insights are now part of goal cards
  }
}

// Browser compatibility
if (typeof window !== 'undefined') {
  window.UnifiedGoalManager = UnifiedGoalManager;
}

// Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UnifiedGoalManager;
}