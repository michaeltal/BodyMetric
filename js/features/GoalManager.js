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
}

// Browser compatibility
if (typeof window !== 'undefined') {
  window.GoalManager = GoalManager;
}

// Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GoalManager;
}