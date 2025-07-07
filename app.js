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

    // Services will be loaded in init
    this.notificationService = null;
    this.calculationService = null;
    this.dataManager = null;

    this.init();
  }

  async init() {
    await this.loadServices();
    await this.loadData();
    this.setupEventListeners();
    this.updateCurrentDate();
    this.updateStats();
    this.updateCharts();
    this.updateTable();
    this.updateInsights();
    this.updateGoalProgress();
    this.updateGoalInputs();
    this.setDefaultFormDate();
  }

  async loadData() {
    await this.dataManager.loadData();
    this.measurements = this.dataManager.getMeasurements();
    this.goals = this.dataManager.getGoals();
    this.height = this.dataManager.getHeight();
  }

  async loadServices() {
    const moduleLoader = new ModuleLoader();
    const services = await moduleLoader.loadServices();
    
    this.notificationService = new services.NotificationService();
    this.calculationService = new services.CalculationService();
    this.dataManager = new services.DataManager();
    
    console.log('Services loaded successfully');
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









  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
  }

  setupEventListeners() {
    // Form submission
    document.getElementById('measurementForm').addEventListener('submit', this.handleFormSubmit.bind(this));
    document.getElementById('measurementDate').addEventListener('change', (e) => {
      this.updateFormAvailability(e.target.value);
    });
    
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
    const dateInput = document.getElementById('measurementDate');
    dateInput.value = today;
    this.updateFormAvailability(today);
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
    document.getElementById('currentWeight').textContent = this.calculationService.formatWeight(latest.weight, this.useMetric);
    document.getElementById('currentBodyFat').textContent = `${latest.bodyFat.toFixed(1)}`;
    document.getElementById('currentLeanMass').textContent = this.calculationService.formatLeanMass(latest.leanMass, this.useMetric);
    
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
    const trendData = this.calculationService.calculateTrend(current, previous);
    const trendHtml = this.calculationService.formatTrend(trendData, unit);
    element.innerHTML = trendHtml;
  }

  updateBMI(weight) {
    if (!this.height) return;
    
    const bmi = this.calculationService.calculateBMI(weight, this.height);
    const category = this.calculationService.getBMICategory(bmi);
    
    document.getElementById('currentBMI').textContent = bmi.toFixed(1);
    document.getElementById('bmiCategory').textContent = category;
  }

  updateAverageBMI(weight) {
    if (!this.height) return;

    const bmi = this.calculationService.calculateBMI(weight, this.height);
    const category = this.calculationService.getBMICategory(bmi);
    
    document.getElementById('avgBMI').textContent = bmi.toFixed(1);
    document.getElementById('avgBMICategory').textContent = category;
  }


  updateSevenDayStats() {
    const avgWeight = this.calculationService.getAverage(this.measurements, 'weight', 0, 7);
    const avgBodyFat = this.calculationService.getAverage(this.measurements, 'bodyFat', 0, 7);
    const avgLean = this.calculationService.getAverage(this.measurements, 'leanMass', 0, 7);

    // Determine baseline using the previous seven days or the most recent prior entry
    let baseWeight = this.calculationService.getAverage(this.measurements, 'weight', 7, 14);
    let baseBodyFat = this.calculationService.getAverage(this.measurements, 'bodyFat', 7, 14);
    let baseLean = this.calculationService.getAverage(this.measurements, 'leanMass', 7, 14);

    // Use single entry before the 7 day window if no average available
    if (baseWeight == null && this.measurements[7]) {
      baseWeight = this.measurements[7].weight;
      baseBodyFat = this.measurements[7].bodyFat;
      baseLean = this.measurements[7].leanMass;
    }

    if (avgWeight == null) {
      this.showEmptyAverageStats();
      return;
    }

    document.getElementById('avgWeight').textContent = this.calculationService.formatWeight(avgWeight, this.useMetric);
    document.getElementById('avgBodyFat').textContent = avgBodyFat.toFixed(1);
    document.getElementById('avgLeanMass').textContent = this.calculationService.formatLeanMass(avgLean, this.useMetric);
    document.getElementById('avgWeightUnit').textContent = this.useMetric ? 'kg' : 'lbs';
    document.getElementById('avgLeanMassUnit').textContent = this.useMetric ? 'kg' : 'lbs';

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
    const movingAverage = this.calculationService.calculateMovingAverage(weights, 7);
    
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
    const movingAverage = this.calculationService.calculateMovingAverage(bodyFats, 7);
    
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
    const movingAverage = this.calculationService.calculateMovingAverage(leanMasses, 7);
    
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
    const totalPages = Math.max(1, Math.ceil(filteredData.length / this.itemsPerPage));

    if (this.currentPage > totalPages) {
      this.currentPage = totalPages;
    }

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);
    
    // Update pagination controls
    document.getElementById('pageIndicator').textContent = `Page ${this.currentPage} of ${totalPages}`;
    document.getElementById('prevPage').disabled = this.currentPage === 1;
    const disableNext = this.currentPage === totalPages || (totalPages === 1 && filteredData.length === 0);
    document.getElementById('nextPage').disabled = disableNext;
    
    // Render table rows
    tbody.innerHTML = pageData.map(measurement => `
      <tr>
        <td>${new Date(measurement.date).toLocaleDateString()}</td>
        <td>${this.calculationService.formatWeight(measurement.weight, this.useMetric)} ${this.useMetric ? 'kg' : 'lbs'}</td>
        <td>${measurement.bodyFat.toFixed(1)}%</td>
        <td>${this.calculationService.formatLeanMass(measurement.leanMass, this.useMetric)} ${this.useMetric ? 'kg' : 'lbs'}</td>
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
      const progress = this.calculationService.calculateGoalProgress(latest.weight, this.goals.weight, false, this.measurements);
      html += this.renderGoalProgress('Weight', latest.weight, this.goals.weight, progress, 'kg');
    }
    
    if (this.goals.bodyFat) {
      const progress = this.calculationService.calculateGoalProgress(latest.bodyFat, this.goals.bodyFat, true, this.measurements);
      html += this.renderGoalProgress('Body Fat', latest.bodyFat, this.goals.bodyFat, progress, '%');
    }
    
    if (this.goals.leanMass) {
      const progress = this.calculationService.calculateGoalProgress(latest.leanMass, this.goals.leanMass, false, this.measurements);
      html += this.renderGoalProgress('Lean Mass', latest.leanMass, this.goals.leanMass, progress, 'kg');
    }
    
    container.innerHTML = html || '<div class="empty-state"><p>Set your goals above to track progress</p></div>';
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
  async handleFormSubmit(e) {
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
    
    await this.dataManager.addMeasurement(measurement);
    this.measurements = this.dataManager.getMeasurements();
    this.updateStats();
    this.updateCharts();
    this.updateTable();
    this.updateInsights();
    this.updateGoalProgress();
    
    // Reset form
    e.target.reset();
    this.setDefaultFormDate();
    this.updateFormAvailability(document.getElementById('measurementDate').value);
    
    // Show success message
    this.showNotification('Measurement saved successfully!', 'success');
  }

  async handleGoalsSubmit(e) {
    e.preventDefault();
    
    const weightGoal = parseFloat(document.getElementById('weightGoal').value);
    const bodyFatGoal = parseFloat(document.getElementById('bodyFatGoal').value);
    const leanMassGoal = parseFloat(document.getElementById('leanMassGoal').value);
    const height = parseFloat(document.getElementById('heightInput').value);
    
    try {
      if (weightGoal) this.goals.weight = this.useMetric ? weightGoal : weightGoal / 2.20462;
      if (bodyFatGoal) this.goals.bodyFat = bodyFatGoal;
      if (leanMassGoal) this.goals.leanMass = this.useMetric ? leanMassGoal : leanMassGoal / 2.20462;
      
      if (height) {
        this.height = document.getElementById('heightUnitToggle').textContent === 'cm' ? height : height * 2.54;
        await this.dataManager.setHeight(this.height);
      }
      
      await this.dataManager.setGoals(this.goals);
      this.updateGoalProgress();
      this.updateStats(); // Update BMI if height changed
      
      this.showNotification('Goals saved successfully!', 'success');
    } catch (error) {
      this.showNotification(`Failed to save goals: ${error.message}`, 'error');
    }
  }

  async handleHeightChange(e) {
    const height = parseFloat(e.target.value);
    if (height) {
      try {
        this.height = document.getElementById('heightUnitToggle').textContent === 'cm' ? height : height * 2.54;
        await this.dataManager.setHeight(this.height);
        this.updateStats();
      } catch (error) {
        this.showNotification(`Failed to save height: ${error.message}`, 'error');
      }
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

  updateFormAvailability(date) {
    const exists = this.measurements.some(m => m.date === date);
    ['weight', 'bodyFat', 'leanMass'].forEach(id => {
      document.getElementById(id).disabled = exists;
    });
    document.querySelector('#measurementForm button[type="submit"]').disabled = exists;
  }

  updateGoalInputs() {
    // Update goal input placeholders/values based on current unit
    if (this.goals.weight) {
      const weightGoal = this.useMetric ? this.goals.weight : this.goals.weight * 2.20462;
      document.getElementById('weightGoal').value = weightGoal.toFixed(1);
    }

    if (this.goals.bodyFat) {
      document.getElementById('bodyFatGoal').value = this.goals.bodyFat.toFixed(1);
    }

    if (this.goals.leanMass) {
      const leanMassGoal = this.useMetric ? this.goals.leanMass : this.goals.leanMass * 2.20462;
      document.getElementById('leanMassGoal').value = leanMassGoal.toFixed(1);
    }

    // Height input
    const heightInput = document.getElementById('heightInput');
    if (heightInput) {
      const heightButton = document.getElementById('heightUnitToggle');
      if (heightButton.textContent === 'cm') {
        heightInput.value = this.height ? this.height.toFixed(0) : '';
      } else {
        heightInput.value = this.height ? (this.height / 2.54).toFixed(1) : '';
      }
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

  async handleEditSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('editId').value;
    const date = document.getElementById('editDate').value;
    const weight = parseFloat(document.getElementById('editWeight').value);
    const bodyFat = parseFloat(document.getElementById('editBodyFat').value);
    const leanMass = parseFloat(document.getElementById('editLeanMass').value);
    
    const measurementIndex = this.measurements.findIndex(m => m.id === id);
    if (measurementIndex === -1) return;
    
    const updatedData = {
      date,
      weight: this.useMetric ? weight : weight / 2.20462,
      bodyFat,
      leanMass: this.useMetric ? leanMass : leanMass / 2.20462,
      weightLbs: this.useMetric ? weight * 2.20462 : weight,
      leanMassLbs: this.useMetric ? leanMass * 2.20462 : leanMass
    };
    
    await this.dataManager.updateMeasurement(id, updatedData);
    this.measurements = this.dataManager.getMeasurements();
    this.updateStats();
    this.updateCharts();
    this.updateTable();
    this.updateInsights();
    this.updateGoalProgress();
    
    this.closeModal();
    this.showNotification('Measurement updated successfully!', 'success');
  }

  async deleteMeasurement(id) {
    if (confirm('Are you sure you want to delete this measurement?')) {
      try {
        const deleted = await this.dataManager.deleteMeasurement(id);
        if (deleted) {
          this.measurements = this.dataManager.getMeasurements();
          this.updateStats();
          this.updateCharts();
          this.updateTable();
          this.updateInsights();
          this.updateGoalProgress();
          this.updateFormAvailability(document.getElementById('measurementDate').value);

          this.showNotification('Measurement deleted successfully!', 'success');
        }
      } catch (error) {
        this.showNotification(`Failed to delete measurement: ${error.message}`, 'error');
      }
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

  async importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csv = e.target.result;
        const lines = csv.split('\n');
        
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
          // Import all measurements with error tracking
          let successCount = 0;
          const errors = [];
          
          for (const measurement of newMeasurements) {
            try {
              await this.dataManager.addMeasurement(measurement);
              successCount++;
            } catch (error) {
              errors.push(`Row ${newMeasurements.indexOf(measurement) + 2}: ${error.message}`);
            }
          }
          
          this.measurements = this.dataManager.getMeasurements();
          this.updateStats();
          this.updateCharts();
          this.updateTable();
          this.updateInsights();
          this.updateGoalProgress();
          
          if (errors.length === 0) {
            this.showNotification(`Imported ${successCount} measurements successfully!`, 'success');
          } else if (successCount > 0) {
            this.showNotification(`Imported ${successCount} measurements, ${errors.length} failed: ${errors.join(', ')}`, 'error');
          } else {
            this.showNotification(`Import failed: ${errors.join(', ')}`, 'error');
          }
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
    return this.notificationService.showNotification(message, type);
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.tracker = new BodyCompositionTracker();
});