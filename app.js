// Body Composition Tracker JavaScript
class BodyCompositionTracker {
  constructor() {
    this.measurements = [];
    this.currentPage = 1;
    this.itemsPerPage = 10;
    this.sortColumn = 'date';
    this.sortDirection = 'desc';
    this.useMetric = true;
    this.charts = {};
    this.goals = { weight: null, bodyFat: null, leanMass: null };
    this.height = 175;

    this.init();
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.updateCurrentDate();
    this.updateStats();
    this.updateCharts();
    this.updateTable();
    this.updateInsights();
    this.updateGoalProgress();
    this.setDefaultFormDate();
  }

  // Sample data for demo
  getSampleData() {
    return [
      { date: "2025-03-21", weight_kg: 75.1, weight_lbs: 165.7, body_fat_percent: 18.5, lean_mass_kg: 61.2, lean_mass_lbs: 135.0 },
      { date: "2025-03-28", weight_kg: 74.8, weight_lbs: 165.0, body_fat_percent: 18.2, lean_mass_kg: 61.2, lean_mass_lbs: 135.0 },
      { date: "2025-04-04", weight_kg: 74.5, weight_lbs: 164.2, body_fat_percent: 17.9, lean_mass_kg: 61.1, lean_mass_lbs: 134.7 },
      { date: "2025-04-11", weight_kg: 74.2, weight_lbs: 163.6, body_fat_percent: 17.6, lean_mass_kg: 61.1, lean_mass_lbs: 134.7 },
      { date: "2025-04-18", weight_kg: 74.0, weight_lbs: 163.1, body_fat_percent: 17.4, lean_mass_kg: 61.1, lean_mass_lbs: 134.7 },
      { date: "2025-04-25", weight_kg: 73.8, weight_lbs: 162.7, body_fat_percent: 17.2, lean_mass_kg: 61.1, lean_mass_lbs: 134.7 },
      { date: "2025-05-02", weight_kg: 73.6, weight_lbs: 162.3, body_fat_percent: 17.0, lean_mass_kg: 61.1, lean_mass_lbs: 134.7 },
      { date: "2025-05-09", weight_kg: 73.4, weight_lbs: 161.8, body_fat_percent: 16.8, lean_mass_kg: 61.1, lean_mass_lbs: 134.7 },
      { date: "2025-05-16", weight_kg: 73.3, weight_lbs: 161.6, body_fat_percent: 16.6, lean_mass_kg: 61.2, lean_mass_lbs: 134.9 },
      { date: "2025-05-23", weight_kg: 73.2, weight_lbs: 161.4, body_fat_percent: 16.5, lean_mass_kg: 61.1, lean_mass_lbs: 134.7 },
      { date: "2025-05-30", weight_kg: 73.1, weight_lbs: 161.2, body_fat_percent: 16.4, lean_mass_kg: 61.1, lean_mass_lbs: 134.7 },
      { date: "2025-06-06", weight_kg: 73.0, weight_lbs: 161.0, body_fat_percent: 16.3, lean_mass_kg: 61.1, lean_mass_lbs: 134.7 },
      { date: "2025-06-13", weight_kg: 72.9, weight_lbs: 160.7, body_fat_percent: 16.2, lean_mass_kg: 61.1, lean_mass_lbs: 134.7 },
      { date: "2025-06-20", weight_kg: 72.8, weight_lbs: 160.5, body_fat_percent: 16.1, lean_mass_kg: 61.1, lean_mass_lbs: 134.7 }
    ];
  }

  async loadData() {
    try {
      const res = await fetch('/data');
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      this.measurements = data.measurements || [];
      this.goals = data.goals || { weight: null, bodyFat: null, leanMass: null };
      this.height = data.height || 175;
      localStorage.setItem('bodyCompositionData', JSON.stringify(this.measurements));
      localStorage.setItem('bodyCompositionGoals', JSON.stringify(this.goals));
      localStorage.setItem('bodyCompositionHeight', this.height.toString());
    } catch (e) {
      this.loadMeasurementsLocal();
      this.goals = this.loadGoalsLocal();
      this.height = this.loadHeightLocal();
    }

    this.measurements.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  saveToServer() {
    fetch('/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        measurements: this.measurements,
        goals: this.goals,
        height: this.height
      })
    }).catch(() => {});
  }

  loadMeasurementsLocal() {
    const stored = localStorage.getItem('bodyCompositionData');
    if (stored) {
      this.measurements = JSON.parse(stored);
    } else {
      // Load sample data for demo
      const sampleData = this.getSampleData();
      this.measurements = sampleData.map(item => ({
        id: this.generateId(),
        date: item.date,
        weight: item.weight_kg,
        bodyFat: item.body_fat_percent,
        leanMass: item.lean_mass_kg,
        weightLbs: item.weight_lbs,
        leanMassLbs: item.lean_mass_lbs
      }));
      this.saveMeasurements();
    }
    
    // Sort by date descending
    this.measurements.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  saveMeasurements() {
    localStorage.setItem('bodyCompositionData', JSON.stringify(this.measurements));
    this.saveToServer();
  }

  loadGoalsLocal() {
    const stored = localStorage.getItem('bodyCompositionGoals');
    return stored ? JSON.parse(stored) : {
      weight: null,
      bodyFat: null,
      leanMass: null
    };
  }

  saveGoals() {
    localStorage.setItem('bodyCompositionGoals', JSON.stringify(this.goals));
    this.saveToServer();
  }

  loadHeightLocal() {
    const stored = localStorage.getItem('bodyCompositionHeight');
    return stored ? parseFloat(stored) : 175; // Default height in cm
  }

  saveHeight() {
    localStorage.setItem('bodyCompositionHeight', this.height.toString());
    this.saveToServer();
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  setupEventListeners() {
    // Form submission
    document.getElementById('measurementForm').addEventListener('submit', this.handleFormSubmit.bind(this));
    
    // Unit toggles
    document.getElementById('weightUnitToggle').addEventListener('click', this.toggleWeightUnit.bind(this));
    document.getElementById('leanMassUnitToggle').addEventListener('click', this.toggleLeanMassUnit.bind(this));
    document.getElementById('heightUnitToggle').addEventListener('click', this.toggleHeightUnit.bind(this));
    
    // Table sorting
    document.querySelectorAll('[data-sort]').forEach(header => {
      header.addEventListener('click', this.handleSort.bind(this));
    });
    
    // Pagination
    document.getElementById('prevPage').addEventListener('click', this.previousPage.bind(this));
    document.getElementById('nextPage').addEventListener('click', this.nextPage.bind(this));
    
    // Search
    document.getElementById('tableSearch').addEventListener('input', this.handleSearch.bind(this));
    
    // Export/Import
    document.getElementById('exportBtn').addEventListener('click', this.exportData.bind(this));
    document.getElementById('importInput').addEventListener('change', this.importData.bind(this));
    
    // Goals form
    document.getElementById('goalsForm').addEventListener('submit', this.handleGoalsSubmit.bind(this));
    
    // Height input
    document.getElementById('heightInput').addEventListener('input', this.handleHeightChange.bind(this));
    
    // Modal
    document.getElementById('closeModal').addEventListener('click', this.closeModal.bind(this));
    document.getElementById('cancelEdit').addEventListener('click', this.closeModal.bind(this));
    document.getElementById('editForm').addEventListener('submit', this.handleEditSubmit.bind(this));
    
    // Close modal on backdrop click
    document.getElementById('editModal').addEventListener('click', (e) => {
      if (e.target.id === 'editModal') {
        this.closeModal();
      }
    });
  }

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

  setDefaultFormDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('measurementDate').value = today;
  }

  updateStats() {
    if (this.measurements.length === 0) {
      this.showEmptyStats();
      this.showEmptyAverageStats();
      return;
    }

    const latest = this.measurements[0];
    const previous = this.measurements[1];
    
    // Update current values
    document.getElementById('currentWeight').textContent = this.formatWeight(latest.weight);
    document.getElementById('currentBodyFat').textContent = `${latest.bodyFat.toFixed(1)}`;
    document.getElementById('currentLeanMass').textContent = this.formatLeanMass(latest.leanMass);
    
    // Update units
    document.getElementById('weightUnit').textContent = this.useMetric ? 'kg' : 'lbs';
    document.getElementById('leanMassUnit').textContent = this.useMetric ? 'kg' : 'lbs';
    
    // Update trends
    if (previous) {
      this.updateTrend('weightTrend', latest.weight, previous.weight, 'kg');
      this.updateTrend('bodyFatTrend', latest.bodyFat, previous.bodyFat, '%');
      this.updateTrend('leanMassTrend', latest.leanMass, previous.leanMass, 'kg');
    }
    
    // Update BMI
    this.updateBMI(latest.weight);

    // Update 7 day averages
    this.updateSevenDayStats();
  }

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

  updateTrend(elementId, current, previous, unit) {
    const element = document.getElementById(elementId);
    const diff = current - previous;
    const percentage = ((diff / previous) * 100).toFixed(1);
    
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
    
    element.innerHTML = `
      <span class="trend-arrow">${arrow}</span>
      <span class="${trendClass}">
        ${sign}${diff.toFixed(1)}${unit} (${sign}${percentage}%)
      </span>
    `;
  }

  updateBMI(weight) {
    if (!this.height) return;
    
    const heightM = this.height / 100; // Convert cm to meters
    const bmi = weight / (heightM * heightM);
    
    document.getElementById('currentBMI').textContent = bmi.toFixed(1);
    
    let category;
    if (bmi < 18.5) category = 'Underweight';
    else if (bmi < 25) category = 'Normal';
    else if (bmi < 30) category = 'Overweight';
    else category = 'Obese';
    
    document.getElementById('bmiCategory').textContent = category;
  }

  updateAverageBMI(weight) {
    if (!this.height) return;

    const heightM = this.height / 100;
    const bmi = weight / (heightM * heightM);

    document.getElementById('avgBMI').textContent = bmi.toFixed(1);

    let category;
    if (bmi < 18.5) category = 'Underweight';
    else if (bmi < 25) category = 'Normal';
    else if (bmi < 30) category = 'Overweight';
    else category = 'Obese';

    document.getElementById('avgBMICategory').textContent = category;
  }

  getAverage(field, start, end) {
    const slice = this.measurements.slice(start, end);
    if (slice.length === 0) return null;
    const sum = slice.reduce((acc, m) => acc + m[field], 0);
    return sum / slice.length;
  }

  updateSevenDayStats() {
    const avgWeight = this.getAverage('weight', 0, 7);
    const prevAvgWeight = this.getAverage('weight', 7, 14);
    const avgBodyFat = this.getAverage('bodyFat', 0, 7);
    const prevAvgBodyFat = this.getAverage('bodyFat', 7, 14);
    const avgLean = this.getAverage('leanMass', 0, 7);
    const prevAvgLean = this.getAverage('leanMass', 7, 14);

    if (avgWeight == null) {
      this.showEmptyAverageStats();
      return;
    }

    document.getElementById('avgWeight').textContent = this.formatWeight(avgWeight);
    document.getElementById('avgBodyFat').textContent = avgBodyFat.toFixed(1);
    document.getElementById('avgLeanMass').textContent = this.formatLeanMass(avgLean);
    document.getElementById('avgWeightUnit').textContent = this.useMetric ? 'kg' : 'lbs';
    document.getElementById('avgLeanMassUnit').textContent = this.useMetric ? 'kg' : 'lbs';

    if (prevAvgWeight != null) {
      this.updateTrend('avgWeightTrend', avgWeight, prevAvgWeight, 'kg');
    }
    if (prevAvgBodyFat != null) {
      this.updateTrend('avgBodyFatTrend', avgBodyFat, prevAvgBodyFat, '%');
    }
    if (prevAvgLean != null) {
      this.updateTrend('avgLeanMassTrend', avgLean, prevAvgLean, 'kg');
    }

    this.updateAverageBMI(avgWeight);
  }

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

  formatWeight(weight) {
    if (this.useMetric) {
      return weight.toFixed(1);
    } else {
      return (weight * 2.20462).toFixed(1);
    }
  }

  formatLeanMass(leanMass) {
    if (this.useMetric) {
      return leanMass.toFixed(1);
    } else {
      return (leanMass * 2.20462).toFixed(1);
    }
  }

  updateCharts() {
    if (this.measurements.length === 0) return;
    
    const sortedData = [...this.measurements].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    this.createWeightChart(sortedData);
    this.createBodyFatChart(sortedData);
    this.createLeanMassChart(sortedData);
  }

  createWeightChart(data) {
    const ctx = document.getElementById('weightChart').getContext('2d');
    
    if (this.charts.weight) {
      this.charts.weight.destroy();
    }
    
    const labels = data.map(d => d.date);
    const weights = data.map(d => this.useMetric ? d.weight : d.weight * 2.20462);
    const movingAverage = this.calculateMovingAverage(weights, 7);
    
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
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: this.useMetric ? 'Weight (kg)' : 'Weight (lbs)'
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
      }
    });
  }

  createBodyFatChart(data) {
    const ctx = document.getElementById('bodyFatChart').getContext('2d');
    
    if (this.charts.bodyFat) {
      this.charts.bodyFat.destroy();
    }
    
    const labels = data.map(d => d.date);
    const bodyFats = data.map(d => d.bodyFat);
    const movingAverage = this.calculateMovingAverage(bodyFats, 7);
    
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
      options: {
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
      }
    });
  }

  createLeanMassChart(data) {
    const ctx = document.getElementById('leanMassChart').getContext('2d');
    
    if (this.charts.leanMass) {
      this.charts.leanMass.destroy();
    }
    
    const labels = data.map(d => d.date);
    const leanMasses = data.map(d => this.useMetric ? d.leanMass : d.leanMass * 2.20462);
    const movingAverage = this.calculateMovingAverage(leanMasses, 7);
    
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
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: this.useMetric ? 'Lean Mass (kg)' : 'Lean Mass (lbs)'
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
      }
    });
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

  updateTable() {
    const tbody = document.getElementById('tableBody');
    const searchTerm = document.getElementById('tableSearch').value.toLowerCase();
    
    let filteredData = this.measurements.filter(measurement => {
      return measurement.date.includes(searchTerm) ||
             measurement.weight.toString().includes(searchTerm) ||
             measurement.bodyFat.toString().includes(searchTerm) ||
             measurement.leanMass.toString().includes(searchTerm);
    });
    
    // Sort data
    filteredData.sort((a, b) => {
      let aVal = a[this.sortColumn];
      let bVal = b[this.sortColumn];
      
      if (this.sortColumn === 'date') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (this.sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    // Pagination
    const totalPages = Math.ceil(filteredData.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);
    
    // Update pagination controls
    document.getElementById('pageIndicator').textContent = `Page ${this.currentPage} of ${totalPages}`;
    document.getElementById('prevPage').disabled = this.currentPage === 1;
    document.getElementById('nextPage').disabled = this.currentPage === totalPages;
    
    // Render table rows
    tbody.innerHTML = pageData.map(measurement => `
      <tr>
        <td>${new Date(measurement.date).toLocaleDateString()}</td>
        <td>${this.formatWeight(measurement.weight)} ${this.useMetric ? 'kg' : 'lbs'}</td>
        <td>${measurement.bodyFat.toFixed(1)}%</td>
        <td>${this.formatLeanMass(measurement.leanMass)} ${this.useMetric ? 'kg' : 'lbs'}</td>
        <td>
          <div class="action-buttons">
            <button class="action-btn action-btn--edit" onclick="tracker.editMeasurement('${measurement.id}')">
              Edit
            </button>
            <button class="action-btn action-btn--delete" onclick="tracker.deleteMeasurement('${measurement.id}')">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `).join('');
    
    // Update sort indicators
    document.querySelectorAll('[data-sort]').forEach(header => {
      header.classList.remove('sort-asc', 'sort-desc');
      if (header.getAttribute('data-sort') === this.sortColumn) {
        header.classList.add(`sort-${this.sortDirection}`);
      }
    });
  }

  updateInsights() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    this.updatePeriodInsights('sevenDayInsights', sevenDaysAgo);
    this.updatePeriodInsights('thirtyDayInsights', thirtyDaysAgo);
    this.updatePeriodInsights('ninetyDayInsights', ninetyDaysAgo);
  }

  updatePeriodInsights(elementId, startDate) {
    const element = document.getElementById(elementId);
    const periodData = this.measurements.filter(m => new Date(m.date) >= startDate);
    
    if (periodData.length < 2) {
      element.innerHTML = '<div class="empty-state"><p>Not enough data for this period</p></div>';
      return;
    }
    
    const latest = periodData[0];
    const oldest = periodData[periodData.length - 1];
    
    const weightChange = latest.weight - oldest.weight;
    const bodyFatChange = latest.bodyFat - oldest.bodyFat;
    const leanMassChange = latest.leanMass - oldest.leanMass;
    
    element.innerHTML = `
      <div class="insight-metric">
        <span class="insight-metric-label">Weight Change</span>
        <span class="insight-metric-value ${this.getChangeClass(weightChange)}">
          ${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg
        </span>
      </div>
      <div class="insight-metric">
        <span class="insight-metric-label">Body Fat Change</span>
        <span class="insight-metric-value ${this.getChangeClass(bodyFatChange, true)}">
          ${bodyFatChange > 0 ? '+' : ''}${bodyFatChange.toFixed(1)}%
        </span>
      </div>
      <div class="insight-metric">
        <span class="insight-metric-label">Lean Mass Change</span>
        <span class="insight-metric-value ${this.getChangeClass(leanMassChange)}">
          ${leanMassChange > 0 ? '+' : ''}${leanMassChange.toFixed(1)} kg
        </span>
      </div>
    `;
  }

  getChangeClass(change, isBodyFat = false) {
    if (Math.abs(change) < 0.1) return 'neutral';
    
    if (isBodyFat) {
      return change > 0 ? 'negative' : 'positive';
    } else {
      return change > 0 ? 'positive' : 'negative';
    }
  }

  updateGoalProgress() {
    const container = document.getElementById('goalProgress');
    
    if (this.measurements.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>Add measurements to track goal progress</p></div>';
      return;
    }
    
    const latest = this.measurements[0];
    let html = '';
    
    if (this.goals.weight) {
      const progress = this.calculateGoalProgress(latest.weight, this.goals.weight);
      html += this.renderGoalProgress('Weight', latest.weight, this.goals.weight, progress, 'kg');
    }
    
    if (this.goals.bodyFat) {
      const progress = this.calculateGoalProgress(latest.bodyFat, this.goals.bodyFat, true);
      html += this.renderGoalProgress('Body Fat', latest.bodyFat, this.goals.bodyFat, progress, '%');
    }
    
    if (this.goals.leanMass) {
      const progress = this.calculateGoalProgress(latest.leanMass, this.goals.leanMass);
      html += this.renderGoalProgress('Lean Mass', latest.leanMass, this.goals.leanMass, progress, 'kg');
    }
    
    container.innerHTML = html || '<div class="empty-state"><p>Set your goals above to track progress</p></div>';
  }

  calculateGoalProgress(current, target, isBodyFat = false) {
    if (isBodyFat) {
      // For body fat, progress is based on reduction
      const initialBodyFat = this.measurements[this.measurements.length - 1]?.bodyFat || current;
      const totalReduction = initialBodyFat - target;
      const currentReduction = initialBodyFat - current;
      return totalReduction > 0 ? Math.min(100, (currentReduction / totalReduction) * 100) : 0;
    } else {
      // For weight and lean mass, progress is based on reaching target
      const initial = this.measurements[this.measurements.length - 1]?.[isBodyFat ? 'bodyFat' : (target === this.goals.weight ? 'weight' : 'leanMass')] || current;
      const totalChange = Math.abs(target - initial);
      const currentChange = Math.abs(current - initial);
      return totalChange > 0 ? Math.min(100, (currentChange / totalChange) * 100) : 0;
    }
  }

  renderGoalProgress(label, current, target, progress, unit) {
    const remaining = target - current;
    const remainingText = remaining > 0 ? `${remaining.toFixed(1)} ${unit} to go` : 'Goal achieved!';
    
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

  // Event Handlers
  handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const date = formData.get('measurementDate') || document.getElementById('measurementDate').value;
    const weight = parseFloat(document.getElementById('weight').value);
    const bodyFat = parseFloat(document.getElementById('bodyFat').value);
    const leanMass = parseFloat(document.getElementById('leanMass').value);
    
    if (!date || !weight || !bodyFat || !leanMass) {
      alert('Please fill in all fields');
      return;
    }
    
    // Check if measurement for this date already exists
    const existingIndex = this.measurements.findIndex(m => m.date === date);
    
    const measurement = {
      id: existingIndex >= 0 ? this.measurements[existingIndex].id : this.generateId(),
      date,
      weight: this.useMetric ? weight : weight / 2.20462, // Store in kg
      bodyFat,
      leanMass: this.useMetric ? leanMass : leanMass / 2.20462, // Store in kg
      weightLbs: this.useMetric ? weight * 2.20462 : weight,
      leanMassLbs: this.useMetric ? leanMass * 2.20462 : leanMass
    };
    
    if (existingIndex >= 0) {
      this.measurements[existingIndex] = measurement;
    } else {
      this.measurements.push(measurement);
    }
    
    this.measurements.sort((a, b) => new Date(b.date) - new Date(a.date));
    this.saveMeasurements();
    this.updateStats();
    this.updateCharts();
    this.updateTable();
    this.updateInsights();
    this.updateGoalProgress();
    
    // Reset form
    e.target.reset();
    this.setDefaultFormDate();
    
    // Show success message
    this.showNotification('Measurement saved successfully!', 'success');
  }

  handleGoalsSubmit(e) {
    e.preventDefault();
    
    const weightGoal = parseFloat(document.getElementById('weightGoal').value);
    const bodyFatGoal = parseFloat(document.getElementById('bodyFatGoal').value);
    const leanMassGoal = parseFloat(document.getElementById('leanMassGoal').value);
    const height = parseFloat(document.getElementById('heightInput').value);
    
    if (weightGoal) this.goals.weight = this.useMetric ? weightGoal : weightGoal / 2.20462;
    if (bodyFatGoal) this.goals.bodyFat = bodyFatGoal;
    if (leanMassGoal) this.goals.leanMass = this.useMetric ? leanMassGoal : leanMassGoal / 2.20462;
    
    if (height) {
      this.height = document.getElementById('heightUnitToggle').textContent === 'cm' ? height : height * 2.54;
      this.saveHeight();
    }
    
    this.saveGoals();
    this.updateGoalProgress();
    this.updateStats(); // Update BMI if height changed
    
    this.showNotification('Goals saved successfully!', 'success');
  }

  handleHeightChange(e) {
    const height = parseFloat(e.target.value);
    if (height) {
      this.height = document.getElementById('heightUnitToggle').textContent === 'cm' ? height : height * 2.54;
      this.saveHeight();
      this.updateStats();
    }
  }

  toggleWeightUnit() {
    this.useMetric = !this.useMetric;
    const button = document.getElementById('weightUnitToggle');
    button.textContent = this.useMetric ? 'kg' : 'lbs';
    
    // Update lean mass unit toggle to match
    document.getElementById('leanMassUnitToggle').textContent = this.useMetric ? 'kg' : 'lbs';
    
    this.updateStats();
    this.updateCharts();
    this.updateTable();
    this.updateGoalInputs();
  }

  toggleLeanMassUnit() {
    this.useMetric = !this.useMetric;
    const button = document.getElementById('leanMassUnitToggle');
    button.textContent = this.useMetric ? 'kg' : 'lbs';
    
    // Update weight unit toggle to match
    document.getElementById('weightUnitToggle').textContent = this.useMetric ? 'kg' : 'lbs';
    
    this.updateStats();
    this.updateCharts();
    this.updateTable();
    this.updateGoalInputs();
  }

  toggleHeightUnit() {
    const button = document.getElementById('heightUnitToggle');
    const input = document.getElementById('heightInput');
    const currentValue = parseFloat(input.value);
    
    if (button.textContent === 'cm') {
      button.textContent = 'in';
      if (currentValue) {
        input.value = (currentValue / 2.54).toFixed(1);
      } else {
        input.value = (this.height / 2.54).toFixed(1);
      }
    } else {
      button.textContent = 'cm';
      if (currentValue) {
        input.value = (currentValue * 2.54).toFixed(0);
      } else {
        input.value = this.height.toFixed(0);
      }
    }
  }

  updateGoalInputs() {
    // Update goal input placeholders/values based on current unit
    if (this.goals.weight) {
      const weightGoal = this.useMetric ? this.goals.weight : this.goals.weight * 2.20462;
      document.getElementById('weightGoal').value = weightGoal.toFixed(1);
    }
    
    if (this.goals.leanMass) {
      const leanMassGoal = this.useMetric ? this.goals.leanMass : this.goals.leanMass * 2.20462;
      document.getElementById('leanMassGoal').value = leanMassGoal.toFixed(1);
    }
    
    // Update unit labels
    document.getElementById('weightGoalUnit').textContent = this.useMetric ? 'kg' : 'lbs';
    document.getElementById('leanMassGoalUnit').textContent = this.useMetric ? 'kg' : 'lbs';
  }

  handleSort(e) {
    const column = e.target.getAttribute('data-sort');
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'desc';
    }
    this.updateTable();
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateTable();
    }
  }

  nextPage() {
    const totalPages = Math.ceil(this.measurements.length / this.itemsPerPage);
    if (this.currentPage < totalPages) {
      this.currentPage++;
      this.updateTable();
    }
  }

  handleSearch() {
    this.currentPage = 1;
    this.updateTable();
  }

  editMeasurement(id) {
    const measurement = this.measurements.find(m => m.id === id);
    if (!measurement) return;
    
    document.getElementById('editId').value = id;
    document.getElementById('editDate').value = measurement.date;
    document.getElementById('editWeight').value = this.useMetric ? measurement.weight : measurement.weight * 2.20462;
    document.getElementById('editBodyFat').value = measurement.bodyFat;
    document.getElementById('editLeanMass').value = this.useMetric ? measurement.leanMass : measurement.leanMass * 2.20462;
    
    // Update unit labels
    document.getElementById('editWeightUnit').textContent = this.useMetric ? 'kg' : 'lbs';
    document.getElementById('editLeanMassUnit').textContent = this.useMetric ? 'kg' : 'lbs';
    
    document.getElementById('editModal').classList.add('show');
  }

  handleEditSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('editId').value;
    const date = document.getElementById('editDate').value;
    const weight = parseFloat(document.getElementById('editWeight').value);
    const bodyFat = parseFloat(document.getElementById('editBodyFat').value);
    const leanMass = parseFloat(document.getElementById('editLeanMass').value);
    
    const measurementIndex = this.measurements.findIndex(m => m.id === id);
    if (measurementIndex === -1) return;
    
    this.measurements[measurementIndex] = {
      ...this.measurements[measurementIndex],
      date,
      weight: this.useMetric ? weight : weight / 2.20462,
      bodyFat,
      leanMass: this.useMetric ? leanMass : leanMass / 2.20462,
      weightLbs: this.useMetric ? weight * 2.20462 : weight,
      leanMassLbs: this.useMetric ? leanMass * 2.20462 : leanMass
    };
    
    this.measurements.sort((a, b) => new Date(b.date) - new Date(a.date));
    this.saveMeasurements();
    this.updateStats();
    this.updateCharts();
    this.updateTable();
    this.updateInsights();
    this.updateGoalProgress();
    
    this.closeModal();
    this.showNotification('Measurement updated successfully!', 'success');
  }

  deleteMeasurement(id) {
    if (confirm('Are you sure you want to delete this measurement?')) {
      this.measurements = this.measurements.filter(m => m.id !== id);
      this.saveMeasurements();
      this.updateStats();
      this.updateCharts();
      this.updateTable();
      this.updateInsights();
      this.updateGoalProgress();
      
      this.showNotification('Measurement deleted successfully!', 'success');
    }
  }

  closeModal() {
    document.getElementById('editModal').classList.remove('show');
  }

  exportData() {
    const csvContent = this.measurements.map(m => 
      `${m.date},${m.weight.toFixed(2)},${m.bodyFat.toFixed(1)},${m.leanMass.toFixed(2)}`
    ).join('\n');
    
    const header = 'Date,Weight (kg),Body Fat %,Lean Mass (kg)\n';
    const csv = header + csvContent;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `body-composition-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    this.showNotification('Data exported successfully!', 'success');
  }

  importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target.result;
        const lines = csv.split('\n');
        const header = lines[0];
        
        // Simple CSV parsing
        const newMeasurements = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const [date, weight, bodyFat, leanMass] = line.split(',');
          
          if (date && weight && bodyFat && leanMass) {
            newMeasurements.push({
              id: this.generateId(),
              date: date.trim(),
              weight: parseFloat(weight),
              bodyFat: parseFloat(bodyFat),
              leanMass: parseFloat(leanMass),
              weightLbs: parseFloat(weight) * 2.20462,
              leanMassLbs: parseFloat(leanMass) * 2.20462
            });
          }
        }
        
        if (newMeasurements.length > 0) {
          this.measurements = [...this.measurements, ...newMeasurements];
          this.measurements.sort((a, b) => new Date(b.date) - new Date(a.date));
          this.saveMeasurements();
          this.updateStats();
          this.updateCharts();
          this.updateTable();
          this.updateInsights();
          this.updateGoalProgress();
          
          this.showNotification(`Imported ${newMeasurements.length} measurements successfully!`, 'success');
        } else {
          this.showNotification('No valid measurements found in the file', 'error');
        }
      } catch (error) {
        this.showNotification('Error importing data. Please check the file format.', 'error');
      }
    };
    
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  }

  showNotification(message, type = 'info') {
    // Create a simple notification system
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--color-${type === 'error' ? 'error' : 'success'});
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      z-index: 1001;
      animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.tracker = new BodyCompositionTracker();
  
  // Add CSS for notifications
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
});