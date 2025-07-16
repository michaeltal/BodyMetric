class GoalManager {
  constructor(calculationService, dataManager) {
    this.calculationService = calculationService;
    this.dataManager = dataManager;
  }

  /**
   * Update goal progress display for all metrics
   */
  updateGoalProgress(measurements, goals, useMetric = true) {
    const container = document.getElementById('goalProgress');
    
    if (!measurements || measurements.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>Add measurements to track goal progress</p></div>';
      return;
    }
    
    const latest = measurements[0];
    let html = '';
    
    if (goals.weight) {
      const progress = this.calculationService.calculateGoalProgress(latest.weight, goals.weight, false, measurements);
      const displayWeight = useMetric ? latest.weight : this.calculationService.convertWeight(latest.weight, false);
      const displayGoal = useMetric ? goals.weight : this.calculationService.convertWeight(goals.weight, false);
      const unit = useMetric ? 'kg' : 'lbs';
      html += this.renderGoalProgress('Weight', displayWeight, displayGoal, progress, unit);
    }
    
    if (goals.bodyFat) {
      const progress = this.calculationService.calculateGoalProgress(latest.bodyFat, goals.bodyFat, true, measurements);
      html += this.renderGoalProgress('Body Fat', latest.bodyFat, goals.bodyFat, progress, '%');
    }
    
    if (goals.leanMass) {
      const progress = this.calculationService.calculateGoalProgress(latest.leanMass, goals.leanMass, false, measurements);
      const displayLeanMass = useMetric ? latest.leanMass : this.calculationService.convertLeanMass(latest.leanMass, false);
      const displayGoal = useMetric ? goals.leanMass : this.calculationService.convertLeanMass(goals.leanMass, false);
      const unit = useMetric ? 'kg' : 'lbs';
      html += this.renderGoalProgress('Lean Mass', displayLeanMass, displayGoal, progress, unit);
    }
    
    container.innerHTML = html || '<div class="empty-state"><p>Set your goals above to track progress</p></div>';
  }

  /**
   * Calculate progress percentage for a specific goal
   */
  calculateProgress(current, target, isBodyFat = false, measurements = []) {
    return this.calculationService.calculateGoalProgress(current, target, isBodyFat, measurements);
  }

  /**
   * Render progress bar HTML
   */
  renderGoalProgress(label, current, target, progress, unit) {
    const remaining = Math.abs(target - current);
    const remainingText = remaining < 0.1 ? 'Goal achieved!' : `${remaining.toFixed(1)} ${unit} to go`;
    
    return `
      <div class="goal-progress-item">
        <div class="goal-progress-label">${label}</div>
        <div class="goal-progress-value">${remainingText}</div>
        <div class="goal-progress-bar">
          <div class="goal-progress-fill" style="width: ${progress}%"></div>
        </div>
      </div>
    `;
  }

  /**
   * Check if goal is achieved
   */
  isGoalAchieved(current, target, isBodyFat = false) {
    if (isBodyFat) {
      return current <= target;
    } else {
      return Math.abs(current - target) < 0.1;
    }
  }

  /**
   * Format goal achievement message
   */
  formatGoalAchievement(current, target, isBodyFat = false) {
    if (this.isGoalAchieved(current, target, isBodyFat)) {
      return 'Goal achieved!';
    }
    
    const remaining = Math.abs(target - current);
    const direction = target > current ? 'to go' : 'over target';
    return `${remaining.toFixed(1)} ${direction}`;
  }

  /**
   * Get progress status for a specific goal
   */
  getGoalStatus(current, target, isBodyFat = false) {
    const progress = this.calculateProgress(current, target, isBodyFat);
    const achieved = this.isGoalAchieved(current, target, isBodyFat);
    
    return {
      progress: progress,
      achieved: achieved,
      remaining: Math.abs(target - current),
      message: this.formatGoalAchievement(current, target, isBodyFat)
    };
  }

  /**
   * Update goal input fields with current values
   */
  updateGoalInputs(goals, height, useMetric = true) {
    const goalInputs = {
      weight: document.getElementById('goalWeight'),
      bodyFat: document.getElementById('goalBodyFat'),
      leanMass: document.getElementById('goalLeanMass')
    };

    if (goalInputs.weight && goals.weight) {
      const displayWeight = useMetric ? goals.weight : this.calculationService.convertWeight(goals.weight, false);
      goalInputs.weight.value = displayWeight.toFixed(1);
    }

    if (goalInputs.bodyFat && goals.bodyFat) {
      goalInputs.bodyFat.value = goals.bodyFat.toFixed(1);
    }

    if (goalInputs.leanMass && goals.leanMass) {
      const displayLeanMass = useMetric ? goals.leanMass : this.calculationService.convertLeanMass(goals.leanMass, false);
      goalInputs.leanMass.value = displayLeanMass.toFixed(1);
    }
  }

  /**
   * Get recommended goals based on current measurements
   */
  getRecommendedGoals(measurements, height, useMetric = true) {
    if (!measurements || measurements.length === 0) {
      return null;
    }

    const latest = measurements[0];
    const bmi = this.calculationService.calculateBMI(latest.weight, height);
    
    // Conservative recommendations based on BMI and current values
    const recommendations = {
      weight: null,
      bodyFat: null,
      leanMass: null
    };

    // Weight goal: aim for healthy BMI range (18.5-24.9)
    if (bmi > 25) {
      // Aim for BMI of 24
      recommendations.weight = 24 * Math.pow(height / 100, 2);
    } else if (bmi < 18.5) {
      // Aim for BMI of 20
      recommendations.weight = 20 * Math.pow(height / 100, 2);
    }

    // Body fat goal: gender-neutral healthy range
    if (latest.bodyFat > 20) {
      recommendations.bodyFat = Math.max(12, latest.bodyFat - 5);
    }

    // Lean mass goal: maintain or increase slightly
    recommendations.leanMass = latest.leanMass + 1;

    return recommendations;
  }

  estimateGoalAchievement(measurements, goals, useMetric = true) {
    if (!measurements || !goals) {
      return null;
    }

    const latest = measurements[0];
    const estimates = {};

    if (goals.weight !== undefined && goals.weight !== null) {
      const currentWeight = latest ? latest.weight : null;
      const goalWeight = goals.weight;
      const timeline = this.calculationService.estimateGoalTimeline(measurements, 'weight', currentWeight, goalWeight, 30);
      
      estimates.weight = {
        ...timeline,
        currentValue: useMetric ? currentWeight : (currentWeight ? this.calculationService.convertWeight(currentWeight, false) : null),
        goalValue: useMetric ? goalWeight : this.calculationService.convertWeight(goalWeight, false),
        unit: useMetric ? 'kg' : 'lbs'
      };
      
      if (timeline.success) {
        estimates.weight.formatted = this.calculationService.formatTimelineEstimate(timeline.daysToGoal, timeline.confidence);
      }
    }

    if (goals.bodyFat !== undefined && goals.bodyFat !== null) {
      const currentBodyFat = latest ? latest.bodyFat : null;
      const goalBodyFat = goals.bodyFat;
      const timeline = this.calculationService.estimateGoalTimeline(measurements, 'bodyFat', currentBodyFat, goalBodyFat, 30);
      
      estimates.bodyFat = {
        ...timeline,
        currentValue: currentBodyFat,
        goalValue: goalBodyFat,
        unit: '%'
      };
      
      if (timeline.success) {
        estimates.bodyFat.formatted = this.calculationService.formatTimelineEstimate(timeline.daysToGoal, timeline.confidence);
      }
    }

    if (goals.leanMass !== undefined && goals.leanMass !== null) {
      const currentLeanMass = latest ? latest.leanMass : null;
      const goalLeanMass = goals.leanMass;
      const timeline = this.calculationService.estimateGoalTimeline(measurements, 'leanMass', currentLeanMass, goalLeanMass, 30);
      
      estimates.leanMass = {
        ...timeline,
        currentValue: useMetric ? currentLeanMass : (currentLeanMass ? this.calculationService.convertLeanMass(currentLeanMass, false) : null),
        goalValue: useMetric ? goalLeanMass : this.calculationService.convertLeanMass(goalLeanMass, false),
        unit: useMetric ? 'kg' : 'lbs'
      };
      
      if (timeline.success) {
        estimates.leanMass.formatted = this.calculationService.formatTimelineEstimate(timeline.daysToGoal, timeline.confidence);
      }
    }

    return Object.keys(estimates).length > 0 ? estimates : null;
  }

  renderGoalTimeline(estimate, confidence) {
    if (!estimate || !estimate.success) {
      let message = '';
      let className = 'timeline-info';
      
      if (!estimate) {
        message = 'Set a goal to see timeline estimate';
        className = 'timeline-info';
      } else {
        switch (estimate.reason) {
          case 'insufficient_data':
            message = 'Need more measurement data for timeline estimation';
            className = 'timeline-info';
            break;
          case 'no_goal':
            message = 'Set a goal to see timeline estimate';
            className = 'timeline-info';
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
          default:
            message = 'Timeline estimate not available';
            className = 'timeline-info';
        }
      }
      
      return `
        <div class="goal-timeline-container">
          <div class="goal-timeline-estimate ${className}">
            ${message}
          </div>
        </div>
      `;
    }

    const confidenceClass = `confidence-${estimate.confidence}`;
    const achievableClass = estimate.achievable ? 'achievable' : 'challenging';
    
    return `
      <div class="goal-timeline-container">
        <div class="goal-timeline-estimate ${achievableClass}">
          <span class="timeline-text">${estimate.formatted.estimate}</span>
          <span class="goal-confidence-indicator ${confidenceClass}" title="${this.getConfidenceTooltip(estimate.confidence)}">
            ${estimate.confidence} confidence
          </span>
        </div>
        <div class="goal-timeline-details">
          <span class="timeline-rate">at ${Math.abs(estimate.dailyRate).toFixed(2)} ${estimate.unit}/day</span>
          <span class="timeline-target-date">${estimate.targetDate.toLocaleDateString()}</span>
        </div>
      </div>
    `;
  }

  getTimelineStatus(estimate) {
    if (!estimate) {
      return {
        status: 'insufficient_data',
        message: 'Need more data',
        class: 'status-neutral'
      };
    }

    if (estimate.achievable) {
      if (estimate.confidence === 'high') {
        return {
          status: 'achievable',
          message: 'On track',
          class: 'status-positive'
        };
      } else if (estimate.confidence === 'medium') {
        return {
          status: 'likely',
          message: 'Likely achievable',
          class: 'status-positive'
        };
      } else {
        return {
          status: 'uncertain',
          message: 'Progress uncertain',
          class: 'status-neutral'
        };
      }
    } else {
      return {
        status: 'challenging',
        message: 'Adjust strategy',
        class: 'status-negative'
      };
    }
  }

  /**
   * Get tooltip text for confidence level
   */
  getConfidenceTooltip(confidence) {
    switch (confidence) {
      case 'high':
        return 'Based on a strong and consistent trend in your recent measurements.';
      case 'medium':
        return 'Based on a moderate trend in your recent measurements. More data will improve accuracy.';
      case 'low':
        return 'Based on a weak or inconsistent trend. The prediction is less reliable.';
      default:
        return 'Confidence in this prediction is unknown.';
    }
  }

  updateGoalProgressWithTimeline(measurements, goals, useMetric = true) {
    const container = document.getElementById('goalProgress');
    
    if (!measurements || measurements.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>Add measurements to track goal progress</p></div>';
      return;
    }

    const latest = measurements[0];
    const estimates = this.estimateGoalAchievement(measurements, goals, useMetric);
    let html = '';

    if (goals.weight !== undefined && goals.weight !== null) {
      const progress = this.calculationService.calculateGoalProgress(latest.weight, goals.weight, false, measurements);
      const displayWeight = useMetric ? latest.weight : this.calculationService.convertWeight(latest.weight, false);
      const displayGoal = useMetric ? goals.weight : this.calculationService.convertWeight(goals.weight, false);
      const unit = useMetric ? 'kg' : 'lbs';
      
      html += this.renderGoalProgress('Weight', displayWeight, displayGoal, progress, unit);
      
      // Always show timeline box, even if estimate failed
      const weightEstimate = estimates && estimates.weight ? estimates.weight : null;
      html += this.renderGoalTimeline(weightEstimate, weightEstimate && weightEstimate.confidence);
    }

    if (goals.bodyFat !== undefined && goals.bodyFat !== null) {
      const progress = this.calculationService.calculateGoalProgress(latest.bodyFat, goals.bodyFat, true, measurements);
      html += this.renderGoalProgress('Body Fat', latest.bodyFat, goals.bodyFat, progress, '%');
      
      // Always show timeline box, even if estimate failed
      const bodyFatEstimate = estimates && estimates.bodyFat ? estimates.bodyFat : null;
      html += this.renderGoalTimeline(bodyFatEstimate, bodyFatEstimate && bodyFatEstimate.confidence);
    }

    if (goals.leanMass !== undefined && goals.leanMass !== null) {
      const progress = this.calculationService.calculateGoalProgress(latest.leanMass, goals.leanMass, false, measurements);
      const displayLeanMass = useMetric ? latest.leanMass : this.calculationService.convertLeanMass(latest.leanMass, false);
      const displayGoal = useMetric ? goals.leanMass : this.calculationService.convertLeanMass(goals.leanMass, false);
      const unit = useMetric ? 'kg' : 'lbs';
      
      html += this.renderGoalProgress('Lean Mass', displayLeanMass, displayGoal, progress, unit);
      
      // Always show timeline box, even if estimate failed
      const leanMassEstimate = estimates && estimates.leanMass ? estimates.leanMass : null;
      html += this.renderGoalTimeline(leanMassEstimate, leanMassEstimate && leanMassEstimate.confidence);
    }

    container.innerHTML = html || '<div class="empty-state"><p>Set your goals above to track progress</p></div>';
  }

  getGoalTimelinesSummary(measurements, goals, useMetric = true) {
    const estimates = this.estimateGoalAchievement(measurements, goals, useMetric);
    
    if (!estimates) {
      return {
        hasTimelines: false,
        message: 'Set goals and add more measurements to see timeline estimates'
      };
    }

    const summaries = [];
    
    if (estimates.weight) {
      const status = this.getTimelineStatus(estimates.weight);
      const timelineText = estimates.weight.success ? estimates.weight.formatted.estimate : 'No estimate';
      summaries.push(`Weight: ${timelineText} (${status.message})`);
    }

    if (estimates.bodyFat) {
      const status = this.getTimelineStatus(estimates.bodyFat);
      const timelineText = estimates.bodyFat.success ? estimates.bodyFat.formatted.estimate : 'No estimate';
      summaries.push(`Body Fat: ${timelineText} (${status.message})`);
    }

    if (estimates.leanMass) {
      const status = this.getTimelineStatus(estimates.leanMass);
      const timelineText = estimates.leanMass.success ? estimates.leanMass.formatted.estimate : 'No estimate';
      summaries.push(`Lean Mass: ${timelineText} (${status.message})`);
    }

    return {
      hasTimelines: true,
      summaries,
      estimates
    };
  }
}

// Browser compatibility
if (typeof window !== 'undefined') {
  window.GoalManager = GoalManager;
}

// Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GoalManager;
}