// Body Composition Tracker JavaScript
class BodyCompositionTracker {
  constructor() {
    this.measurements = [];
    this.useMetric = true;
    this.charts = {};
    this.goals = { weight: null, bodyFat: null, leanMass: null };
    this.height = 175;

    // Services will be loaded in init
    this.notificationService = null;
    this.calculationService = null;
    this.dataManager = null;
    this.uiManager = null;
    this.formManager = null;
    this.tableManager = null;

    this.init();
  }

  async init() {
    await this.loadServices();
    await this.loadData();
    this.setupFormManager();
    this.setupTableManager();
    this.setupEventListeners();
    this.uiManager.updateCurrentDate();
    this.uiManager.updateStats(this.measurements, this.useMetric);
    this.updateCharts();
    this.tableManager.updateMeasurements(this.measurements);
    this.updateInsights();
    this.updateGoalProgress();
    this.formManager.setDefaultFormDate();
  }

  async loadData() {
    await this.dataManager.loadData();
    this.measurements = this.dataManager.getMeasurements();
    this.goals = this.dataManager.getGoals();
    this.height = this.dataManager.getHeight();
  }

  setupFormManager() {
    // Initialize FormManager with current data
    this.formManager.initialize(this.measurements, this.goals, this.height, this.useMetric);
    
    // Set up callbacks for when FormManager updates data
    this.formManager.setCallbacks({
      onMeasurementUpdate: () => {
        this.measurements = this.dataManager.getMeasurements();
        this.uiManager.updateStats(this.measurements, this.useMetric);
        this.updateCharts();
        this.tableManager.updateMeasurements(this.measurements);
        this.updateInsights();
        this.updateGoalProgress();
      },
      onGoalUpdate: () => {
        this.goals = this.dataManager.getGoals();
        this.height = this.dataManager.getHeight();
        this.uiManager.updateStats(this.measurements, this.useMetric);
        this.updateGoalProgress();
      },
      onUnitToggle: () => {
        this.useMetric = this.formManager.useMetric;
        this.uiManager.updateStats(this.measurements, this.useMetric);
        this.updateCharts();
        this.tableManager.updateUnits(this.useMetric);
      }
    });
  }

  setupTableManager() {
    // Initialize TableManager with current data
    this.tableManager.initialize(this.measurements, this.useMetric);
    
    // Set up callbacks for table actions
    this.tableManager.setCallbacks({
      onEdit: (id) => {
        this.formManager.editMeasurement(id);
      },
      onDelete: (id) => {
        this.deleteMeasurement(id);
      }
    });
  }

  async loadServices() {
    const moduleLoader = new ModuleLoader();
    const services = await moduleLoader.loadServices();
    
    this.notificationService = new services.NotificationService();
    this.calculationService = new services.CalculationService();
    this.dataManager = new services.DataManager();
    this.uiManager = new services.UIManager(this.calculationService, this.dataManager);
    this.formManager = new services.FormManager(this.dataManager, this.notificationService, this.uiManager);
    this.tableManager = new services.TableManager(this.calculationService);
    
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
    document.getElementById('measurementForm').addEventListener('submit', this.formManager.handleFormSubmit.bind(this.formManager));
    document.getElementById('measurementDate').addEventListener('change', (e) => {
      this.formManager.updateFormAvailability(e.target.value);
    });
    
    // Unit toggles
    document.getElementById('weightUnitToggle').addEventListener('click', this.formManager.toggleWeightUnit.bind(this.formManager));
    document.getElementById('leanMassUnitToggle').addEventListener('click', this.formManager.toggleLeanMassUnit.bind(this.formManager));
    document.getElementById('heightUnitToggle').addEventListener('click', this.formManager.toggleHeightUnit.bind(this.formManager));
    
    // Table sorting
    document.querySelectorAll('[data-sort]').forEach(header => {
      header.addEventListener('click', this.tableManager.handleSort.bind(this.tableManager));
    });
    
    // Pagination
    document.getElementById('prevPage').addEventListener('click', this.tableManager.previousPage.bind(this.tableManager));
    document.getElementById('nextPage').addEventListener('click', this.tableManager.nextPage.bind(this.tableManager));
    
    // Search
    document.getElementById('tableSearch').addEventListener('input', this.tableManager.handleSearch.bind(this.tableManager));
    
    // Export/Import
    document.getElementById('exportBtn').addEventListener('click', this.exportData.bind(this));
    document.getElementById('importInput').addEventListener('change', this.importData.bind(this));
    
    // Goals form
    document.getElementById('goalsForm').addEventListener('submit', this.formManager.handleGoalsSubmit.bind(this.formManager));
    
    // Height input
    document.getElementById('heightInput').addEventListener('input', this.formManager.handleHeightChange.bind(this.formManager));
    
    // Modal
    document.getElementById('closeModal').addEventListener('click', this.closeModal.bind(this));
    document.getElementById('cancelEdit').addEventListener('click', this.closeModal.bind(this));
    document.getElementById('editForm').addEventListener('submit', this.formManager.handleEditSubmit.bind(this.formManager));
    
    // Close modal on backdrop click
    document.getElementById('editModal').addEventListener('click', (e) => {
      if (e.target.id === 'editModal') {
        this.closeModal();
      }
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


  async deleteMeasurement(id) {
    if (confirm('Are you sure you want to delete this measurement?')) {
      try {
        const deleted = await this.dataManager.deleteMeasurement(id);
        if (deleted) {
          this.measurements = this.dataManager.getMeasurements();
          this.uiManager.updateStats(this.measurements, this.useMetric);
          this.updateCharts();
          this.tableManager.updateMeasurements(this.measurements);
          this.formManager.updateMeasurements(this.measurements);
          this.updateInsights();
          this.updateGoalProgress();
          this.formManager.updateFormAvailability(document.getElementById('measurementDate').value);

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
          this.uiManager.updateStats(this.measurements, this.useMetric);
          this.updateCharts();
          this.tableManager.updateMeasurements(this.measurements);
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