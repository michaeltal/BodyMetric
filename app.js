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
    this.goalManager = null;
    this.importExportManager = null;
    this.insightsManager = null;
    this.chartManager = null;

    this.init();
  }

  async init() {
    await this.loadServices();
    await this.loadData();
    this.setupFormManager();
    this.setupTableManager();
    this.setupImportExportManager();
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

  setupImportExportManager() {
    // Set up callbacks for import/export actions
    this.importExportManager.setCallbacks({
      onImportSuccess: () => {
        this.measurements = this.dataManager.getMeasurements();
        this.uiManager.updateStats(this.measurements, this.useMetric);
        this.updateCharts();
        this.tableManager.updateMeasurements(this.measurements);
        this.formManager.updateMeasurements(this.measurements);
        this.updateInsights();
        this.updateGoalProgress();
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
    this.goalManager = new services.GoalManager(this.calculationService, this.dataManager);
    this.importExportManager = new services.ImportExportManager(this.dataManager, this.notificationService);
    this.insightsManager = new services.InsightsManager(this.calculationService);
    this.chartManager = new services.ChartManager(this.calculationService);
    
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
    document.getElementById('exportBtn').addEventListener('click', () => {
      this.importExportManager.exportData(this.measurements);
    });
    document.getElementById('importInput').addEventListener('change', this.importExportManager.importData.bind(this.importExportManager));
    
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
    this.chartManager.updateCharts(this.measurements, this.useMetric);
  }



  updateInsights() {
    this.insightsManager.updateInsights(this.measurements);
  }

  updateGoalProgress() {
    this.goalManager.updateGoalProgress(this.measurements, this.goals, this.useMetric);
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


  showNotification(message, type = 'info') {
    return this.notificationService.showNotification(message, type);
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.tracker = new BodyCompositionTracker();
});