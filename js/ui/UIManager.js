/**
 * UIManager - Handles display logic and statistics updates
 * 
 * Responsibilities:
 * - Update current statistics display
 * - Update 7-day average statistics
 * - Handle empty state displays
 * - Format and display trends
 * - Update BMI calculations and categories
 * - Handle date formatting
 */
class UIManager {
  constructor(calculationService, dataManager) {
    this.calculationService = calculationService;
    this.dataManager = dataManager;
  }

  /**
   * Update current date display
   */
  updateCurrentDate() {
    const now = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
  }

  /**
   * Update all statistics displays
   * @param {Array} measurements - Array of measurement objects
   * @param {boolean} useMetric - Whether to use metric units
   */
  updateStats(measurements, useMetric) {
    if (measurements.length === 0) {
      this.showEmptyStats();
      this.showEmptyAverageStats();
      return;
    }

    const latest = measurements[0];
    const previous = measurements[1];
    
    // Update current values
    document.getElementById('currentWeight').textContent = this.calculationService.formatWeight(latest.weight, useMetric);
    document.getElementById('currentBodyFat').textContent = `${latest.bodyFat.toFixed(1)}`;
    document.getElementById('currentLeanMass').textContent = this.calculationService.formatLeanMass(latest.leanMass, useMetric);
    
    // Update units
    document.getElementById('weightUnit').textContent = useMetric ? 'kg' : 'lbs';
    document.getElementById('leanMassUnit').textContent = useMetric ? 'kg' : 'lbs';
    
    // Update trends
    if (previous) {
      this.updateTrend('weightTrend', latest.weight, previous.weight, 'kg');
      this.updateTrend('bodyFatTrend', latest.bodyFat, previous.bodyFat, '%');
      this.updateTrend('leanMassTrend', latest.leanMass, previous.leanMass, 'kg');
    }
    
    // Update BMI
    this.updateBMI(latest.weight);

    // Update 7 day averages
    this.updateSevenDayStats(measurements, useMetric);
  }

  /**
   * Show empty state for statistics
   */
  showEmptyStats() {
    document.getElementById('currentWeight').textContent = '--.-';
    document.getElementById('currentBodyFat').textContent = '--.-%';
    document.getElementById('currentLeanMass').textContent = '--.-';
    document.getElementById('currentBMI').textContent = '--.-';
    document.getElementById('bmiCategory').textContent = '--';

    this.showEmptyAverageStats();

    // Clear trends
    ['weightTrend', 'bodyFatTrend', 'leanMassTrend'].forEach(id => {
      document.getElementById(id).innerHTML = '';
    });
  }

  /**
   * Show empty state for average statistics
   */
  showEmptyAverageStats() {
    document.getElementById('avgWeight').textContent = '--.-';
    document.getElementById('avgBodyFat').textContent = '--.-%';
    document.getElementById('avgLeanMass').textContent = '--.-';
    document.getElementById('avgBMI').textContent = '--.-';
    document.getElementById('avgBMICategory').textContent = '--';

    ['avgWeightTrend', 'avgBodyFatTrend', 'avgLeanMassTrend'].forEach(id => {
      document.getElementById(id).innerHTML = '';
    });
  }

  /**
   * Update trend display for a specific element
   * @param {string} elementId - ID of the element to update
   * @param {number} current - Current value
   * @param {number} previous - Previous value
   * @param {string} unit - Unit for display
   */
  updateTrend(elementId, current, previous, unit) {
    const element = document.getElementById(elementId);
    const trendData = this.calculationService.calculateTrend(current, previous);
    const trendHtml = this.calculationService.formatTrend(trendData, unit);
    element.innerHTML = trendHtml;
  }

  /**
   * Update BMI display
   * @param {number} weight - Weight in kg
   */
  updateBMI(weight) {
    const height = this.dataManager.getHeight();
    if (!height) return;
    
    const bmi = this.calculationService.calculateBMI(weight, height);
    const category = this.calculationService.getBMICategory(bmi);
    
    document.getElementById('currentBMI').textContent = bmi.toFixed(1);
    document.getElementById('bmiCategory').textContent = category;
  }

  /**
   * Update average BMI display
   * @param {number} weight - Average weight in kg
   */
  updateAverageBMI(weight) {
    const height = this.dataManager.getHeight();
    if (!height) return;

    const bmi = this.calculationService.calculateBMI(weight, height);
    const category = this.calculationService.getBMICategory(bmi);
    
    document.getElementById('avgBMI').textContent = bmi.toFixed(1);
    document.getElementById('avgBMICategory').textContent = category;
  }

  /**
   * Update 7-day average statistics
   * @param {Array} measurements - Array of measurement objects
   * @param {boolean} useMetric - Whether to use metric units
   */
  updateSevenDayStats(measurements, useMetric) {
    const avgWeight = this.calculationService.getAverage(measurements, 'weight', 0, 7);
    const avgBodyFat = this.calculationService.getAverage(measurements, 'bodyFat', 0, 7);
    const avgLean = this.calculationService.getAverage(measurements, 'leanMass', 0, 7);

    // Determine baseline using the previous seven days or the most recent prior entry
    let baseWeight = this.calculationService.getAverage(measurements, 'weight', 7, 14);
    let baseBodyFat = this.calculationService.getAverage(measurements, 'bodyFat', 7, 14);
    let baseLean = this.calculationService.getAverage(measurements, 'leanMass', 7, 14);

    // Use single entry before the 7 day window if no average available
    if (baseWeight == null && measurements[7]) {
      baseWeight = measurements[7].weight;
      baseBodyFat = measurements[7].bodyFat;
      baseLean = measurements[7].leanMass;
    }

    if (avgWeight == null) {
      this.showEmptyAverageStats();
      return;
    }

    document.getElementById('avgWeight').textContent = this.calculationService.formatWeight(avgWeight, useMetric);
    document.getElementById('avgBodyFat').textContent = avgBodyFat.toFixed(1);
    document.getElementById('avgLeanMass').textContent = this.calculationService.formatLeanMass(avgLean, useMetric);
    document.getElementById('avgWeightUnit').textContent = useMetric ? 'kg' : 'lbs';
    document.getElementById('avgLeanMassUnit').textContent = useMetric ? 'kg' : 'lbs';

    if (baseWeight != null) {
      this.updateTrend('avgWeightTrend', avgWeight, baseWeight, 'kg');
      this.updateTrend('avgBodyFatTrend', avgBodyFat, baseBodyFat, '%');
      this.updateTrend('avgLeanMassTrend', avgLean, baseLean, 'kg');
    } else {
      // Neutral trend when no historical data for comparison
      this.updateTrend('avgWeightTrend', avgWeight, avgWeight, 'kg');
      this.updateTrend('avgBodyFatTrend', avgBodyFat, avgBodyFat, '%');
      this.updateTrend('avgLeanMassTrend', avgLean, avgLean, 'kg');
    }

    this.updateAverageBMI(avgWeight);
  }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIManager;
}

// Make available in global scope for browser
if (typeof window !== 'undefined') {
  window.UIManager = UIManager;
}