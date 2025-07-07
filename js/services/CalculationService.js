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

  formatTrend(trendData, unit) {
    if (!trendData) return '';
    
    return `
      <span class="trend-arrow">${trendData.arrow}</span>
      <span class="${trendData.trendClass}">
        ${trendData.sign}${trendData.diff}${unit} (${trendData.sign}${trendData.percentage}%)
      </span>
    `;
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
}

if (typeof window !== 'undefined') {
  window.CalculationService = CalculationService;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CalculationService;
}