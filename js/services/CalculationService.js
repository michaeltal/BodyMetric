class CalculationService {
  constructor() {
    this.KG_TO_LBS = 2.20462;
    this.CM_TO_INCHES = 0.393701;
  }

  calculateBMI(weight, height) {
    if (!height || height <= 0) return null;
    
    const heightM = height / 100;
    return weight / (heightM * heightM);
  }

  getBMICategory(bmi) {
    if (!bmi) return '--';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  calculateMovingAverage(data, windowSize) {
    const result = [];
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(data.length, i + Math.ceil(windowSize / 2));
      const window = data.slice(start, end);
      const average = window.reduce((sum, val) => sum + val, 0) / window.length;
      result.push(average);
    }
    return result;
  }

  getAverage(measurements, field, start = 0, end) {
    const slice = measurements.slice(start, end);
    if (slice.length === 0) return null;
    const sum = slice.reduce((acc, m) => acc + m[field], 0);
    return sum / slice.length;
  }

  calculateTrend(current, previous) {
    if (previous === null || previous === undefined) return null;
    
    const diff = current - previous;
    const percentage = ((diff / previous) * 100);
    
    let trendClass, arrow, sign;
    if (Math.abs(diff) < 0.1) {
      trendClass = 'trend-neutral';
      arrow = '➡️';
      sign = '';
    } else if (diff > 0) {
      trendClass = 'trend-up';
      arrow = '⬆️';
      sign = '+';
    } else {
      trendClass = 'trend-down';
      arrow = '⬇️';
      sign = '';
    }
    
    return {
      diff: parseFloat(diff.toFixed(1)),
      percentage: parseFloat(percentage.toFixed(1)),
      trendClass,
      arrow,
      sign
    };
  }

  formatTrend(trendData, unit, contextLabel = '') {
    if (!trendData) return '';
    
    return `
      <div class="trend-main">
        <span class="trend-arrow">${trendData.arrow}</span>
        <span class="${trendData.trendClass}">
          ${trendData.sign}${trendData.diff}${unit} (${trendData.sign}${trendData.percentage}%)
        </span>
      </div>
      ${contextLabel ? `<span class="trend-context">${contextLabel}</span>` : ''}
    `;
  }

  getCurrentStatsContext(measurements) {
    if (!measurements || measurements.length < 2) return '';
    
    const latest = measurements[0];
    const previous = measurements[1];
    
    const latestDate = new Date(latest.date);
    const previousDate = new Date(previous.date);
    const daysDiff = Math.round((latestDate - previousDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      return 'vs. yesterday';
    } else if (daysDiff === 0) {
      return 'vs. same day';
    } else {
      return `vs. ${daysDiff} days ago`;
    }
  }

  getSevenDayAverageContext(measurements) {
    if (!measurements || measurements.length < 7) return '';
    
    let baseWeight = this.getAverage(measurements, 'weight', 7, 14);
    
    if (baseWeight !== null) {
      return 'vs. previous week';
    } else if (measurements[7]) {
      const baseDate = new Date(measurements[7].date);
      const currentDate = new Date(measurements[0].date);
      const daysDiff = Math.round((currentDate - baseDate) / (1000 * 60 * 60 * 24));
      return `vs. ${daysDiff} days ago`;
    } else {
      return '';
    }
  }

  convertWeight(weight, toMetric) {
    if (toMetric) {
      return weight;
    } else {
      return weight * this.KG_TO_LBS;
    }
  }

  convertLeanMass(leanMass, toMetric) {
    if (toMetric) {
      return leanMass;
    } else {
      return leanMass * this.KG_TO_LBS;
    }
  }

  convertHeight(height, toCm) {
    if (toCm) {
      return height;
    } else {
      return height * this.CM_TO_INCHES;
    }
  }

  formatWeight(weight, useMetric) {
    if (useMetric) {
      return weight.toFixed(1);
    } else {
      return (weight * this.KG_TO_LBS).toFixed(1);
    }
  }

  formatLeanMass(leanMass, useMetric) {
    if (useMetric) {
      return leanMass.toFixed(1);
    } else {
      return (leanMass * this.KG_TO_LBS).toFixed(1);
    }
  }

  formatHeight(height, useCm) {
    if (useCm) {
      return height.toFixed(0);
    } else {
      return (height * this.CM_TO_INCHES).toFixed(1);
    }
  }

  calculateGoalProgress(current, target, isBodyFat = false, measurements = []) {
    if (isBodyFat) {
      const initialBodyFat = measurements[measurements.length - 1]?.bodyFat || current;
      const totalReduction = initialBodyFat - target;
      const currentReduction = initialBodyFat - current;
      return totalReduction > 0 ? Math.min(100, (currentReduction / totalReduction) * 100) : 0;
    } else {
      // Determine field based on context - this is a simplified approach
      const fieldName = Math.abs(target - 65) < Math.abs(target - 50) ? 'weight' : 'leanMass';
      const initial = measurements[measurements.length - 1]?.[fieldName] || current;
      const totalChange = Math.abs(target - initial);
      const currentChange = Math.abs(current - initial);
      return totalChange > 0 ? Math.min(100, (currentChange / totalChange) * 100) : 0;
    }
  }

  getChangeClass(change, isBodyFat = false) {
    if (Math.abs(change) < 0.1) return 'neutral';
    
    if (isBodyFat) {
      return change > 0 ? 'negative' : 'positive';
    } else {
      return change > 0 ? 'positive' : 'negative';
    }
  }

  calculatePeriodInsights(measurements, startDate) {
    if (!measurements || measurements.length < 2) {
      return null;
    }
    
    const periodData = measurements.filter(m => new Date(m.date) >= startDate);
    
    if (periodData.length < 2) {
      return null;
    }
    
    const latest = periodData[0];
    const oldest = periodData[periodData.length - 1];
    
    return {
      weightChange: latest.weight - oldest.weight,
      bodyFatChange: latest.bodyFat - oldest.bodyFat,
      leanMassChange: latest.leanMass - oldest.leanMass,
      period: periodData.length
    };
  }

  validateMeasurement(measurement) {
    const errors = [];
    
    if (!measurement.date) {
      errors.push('Date is required');
    }
    
    if (!measurement.weight || measurement.weight <= 0) {
      errors.push('Weight must be a positive number');
    }
    
    if (!measurement.bodyFat || measurement.bodyFat <= 0 || measurement.bodyFat > 100) {
      errors.push('Body fat must be between 0 and 100');
    }
    
    if (!measurement.leanMass || measurement.leanMass <= 0) {
      errors.push('Lean mass must be a positive number');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  normalizeWeight(weight, isMetric) {
    return isMetric ? weight : weight / this.KG_TO_LBS;
  }

  normalizeLeanMass(leanMass, isMetric) {
    return isMetric ? leanMass : leanMass / this.KG_TO_LBS;
  }

  normalizeHeight(height, isCm) {
    return isCm ? height : height * 2.54;
  }

  calculateLinearRegression(measurements, field, days = 30) {
    if (!measurements || measurements.length < 2) {
      return null;
    }

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentData = measurements.filter(m => new Date(m.date) >= cutoffDate);
    
    if (recentData.length < 2) {
      return null;
    }

    const baseDate = new Date(recentData[recentData.length - 1].date);
    const dataPoints = recentData.map(m => ({
      x: Math.floor((new Date(m.date) - baseDate) / (1000 * 60 * 60 * 24)),
      y: m[field],
      daysAgo: Math.floor((new Date() - new Date(m.date)) / (1000 * 60 * 60 * 24))
    }));

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    let totalWeight = 0;

    for (const point of dataPoints) {
      const weight = Math.exp(-point.daysAgo / 10);
      sumX += point.x * weight;
      sumY += point.y * weight;
      sumXY += point.x * point.y * weight;
      sumX2 += point.x * point.x * weight;
      sumY2 += point.y * point.y * weight;
      totalWeight += weight;
    }

    const slope = (totalWeight * sumXY - sumX * sumY) / (totalWeight * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / totalWeight;

    const yMean = sumY / totalWeight;
    let ssRes = 0, ssTot = 0;

    for (const point of dataPoints) {
      const weight = Math.exp(-point.daysAgo / 10);
      const yPred = slope * point.x + intercept;
      ssRes += weight * Math.pow(point.y - yPred, 2);
      ssTot += weight * Math.pow(point.y - yMean, 2);
    }

    const rSquared = ssTot > 0 ? Math.max(0, 1 - (ssRes / ssTot)) : 0;

    return {
      slope,
      intercept,
      rSquared,
      dataPoints: dataPoints.length,
      timeframeDays: days
    };
  }

  calculateTrendSlope(measurements, field, days = 30) {
    const regression = this.calculateLinearRegression(measurements, field, days);
    return regression ? regression.slope : null;
  }

  estimateGoalTimeline(measurements, field, currentValue, goalValue, days = 30) {
    // Check for insufficient data
    if (!measurements || measurements.length < 2) {
      return {
        success: false,
        reason: 'insufficient_data',
        currentValue,
        goalValue
      };
    }

    // Check for missing or achieved goal
    if (!goalValue) {
      return {
        success: false,
        reason: 'no_goal',
        currentValue,
        goalValue
      };
    }

    if (goalValue === currentValue) {
      return {
        success: false,
        reason: 'goal_achieved',
        currentValue,
        goalValue
      };
    }

    const regression = this.calculateLinearRegression(measurements, field, days);
    if (!regression || Math.abs(regression.slope) < 0.001) {
      return {
        success: false,
        reason: 'trend_too_weak',
        currentValue,
        goalValue
      };
    }

    const remainingChange = goalValue - currentValue;
    const daysToGoal = Math.ceil(remainingChange / regression.slope);

    if (daysToGoal <= 0) {
      return {
        success: false,
        reason: 'invalid_timeline',
        currentValue,
        goalValue
      };
    }

    if (daysToGoal > 1000) {
      return {
        success: false,
        reason: 'timeline_too_long',
        currentValue,
        goalValue
      };
    }

    const confidence = this.getConfidenceLevel(regression.rSquared);
    const targetDate = new Date(Date.now() + daysToGoal * 24 * 60 * 60 * 1000);

    return {
      success: true,
      daysToGoal,
      targetDate,
      confidence,
      rSquared: regression.rSquared,
      dailyRate: regression.slope,
      achievable: this.isGoalAchievable(regression.slope, remainingChange),
      currentValue,
      goalValue
    };
  }

  calculatePredictionConfidence(measurements, field, days = 30) {
    const regression = this.calculateLinearRegression(measurements, field, days);
    return regression ? regression.rSquared : 0;
  }

  getWeightedAverage(measurements, field, days = 30) {
    if (!measurements || measurements.length === 0) {
      return null;
    }

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentData = measurements.filter(m => new Date(m.date) >= cutoffDate);
    
    if (recentData.length === 0) {
      return null;
    }

    let weightedSum = 0;
    let totalWeight = 0;

    for (const measurement of recentData) {
      const daysAgo = Math.floor((new Date() - new Date(measurement.date)) / (1000 * 60 * 60 * 24));
      const weight = Math.exp(-daysAgo / 10);
      weightedSum += measurement[field] * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : null;
  }

  getConfidenceLevel(rSquared) {
    if (rSquared >= 0.7) return 'high';
    if (rSquared >= 0.4) return 'medium';
    return 'low';
  }

  isGoalAchievable(slope, remainingChange) {
    const sameDirection = (slope > 0 && remainingChange > 0) || (slope < 0 && remainingChange < 0);
    const reasonableRate = Math.abs(slope) > 0.01;
    return sameDirection && reasonableRate;
  }

  formatTimelineEstimate(days, confidence) {
    if (!days || days <= 0) return null;

    let timeText;
    if (days <= 30) {
      timeText = days === 1 ? '1 day' : `${days} days`;
    } else if (days <= 90) {
      const weeks = Math.round(days / 7);
      timeText = weeks === 1 ? '1 week' : `${weeks} weeks`;
    } else {
      const months = Math.round(days / 30);
      timeText = months === 1 ? '1 month' : `${months} months`;
    }

    return {
      estimate: `~${timeText}`,
      confidence,
      exact: days === 1 ? '1 day' : `${days} days`
    };
  }
}

if (typeof window !== 'undefined') {
  window.CalculationService = CalculationService;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CalculationService;
}