/**
 * FormManager - Handles form submissions and form state management
 * 
 * Responsibilities:
 * - Handle form submissions (measurement, goals, edit)
 * - Manage form state and validation
 * - Handle unit toggles and conversions
 * - Update form availability based on existing data
 * - Manage goal inputs and placeholders
 */
class FormManager {
  constructor(dataManager, notificationService, uiManager) {
    this.dataManager = dataManager;
    this.notificationService = notificationService;
    this.uiManager = uiManager;
    this.useMetric = true;
    this.measurements = [];
    this.goals = { weight: null, bodyFat: null, leanMass: null };
    this.height = 175;
    
    // Callbacks for updating other parts of the app
    this.onMeasurementUpdate = null;
    this.onGoalUpdate = null;
    this.onUnitToggle = null;
  }

  /**
   * Initialize FormManager with current data
   */
  initialize(measurements, goals, height, useMetric) {
    this.measurements = measurements;
    this.goals = goals;
    this.height = height;
    this.useMetric = useMetric;
    this.updateGoalInputs();
  }

  /**
   * Set callbacks for app updates
   */
  setCallbacks(callbacks) {
    this.onMeasurementUpdate = callbacks.onMeasurementUpdate;
    this.onGoalUpdate = callbacks.onGoalUpdate;
    this.onUnitToggle = callbacks.onUnitToggle;
  }

  /**
   * Update measurements data
   */
  updateMeasurements(measurements) {
    this.measurements = measurements;
  }

  /**
   * Generate unique ID for measurements
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
  }

  /**
   * Set default form date to today
   */
  setDefaultFormDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('measurementDate');
    dateInput.value = today;
    this.updateFormAvailability(today);
  }

  /**
   * Handle measurement form submission
   */
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
    
    try {
      await this.dataManager.addMeasurement(measurement);
      this.measurements = this.dataManager.getMeasurements();
      
      // Reset form
      e.target.reset();
      this.setDefaultFormDate();
      this.updateFormAvailability(document.getElementById('measurementDate').value);
      
      // Show success message
      this.notificationService.showSuccess('Measurement saved successfully!');
      
      // Trigger app updates
      if (this.onMeasurementUpdate) {
        this.onMeasurementUpdate();
      }
    } catch (error) {
      this.notificationService.showError(`Failed to save measurement: ${error.message}`);
    }
  }

  /**
   * Handle goals form submission
   */
  async handleGoalsSubmit(e) {
    e.preventDefault();
    
    const weightGoal = parseFloat(document.getElementById('weightGoal').value);
    const bodyFatGoal = parseFloat(document.getElementById('bodyFatGoal').value);
    const leanMassGoal = parseFloat(document.getElementById('leanMassGoal').value);
    const height = parseFloat(document.getElementById('heightInput').value);
    
    try {
      // Handle weight goal - set to null if field is empty, otherwise use parsed value
      const weightInput = document.getElementById('weightGoal').value.trim();
      this.goals.weight = weightInput === '' ? null : (this.useMetric ? weightGoal : weightGoal / 2.20462);
      
      // Handle body fat goal - set to null if field is empty, otherwise use parsed value
      const bodyFatInput = document.getElementById('bodyFatGoal').value.trim();
      this.goals.bodyFat = bodyFatInput === '' ? null : bodyFatGoal;
      
      // Handle lean mass goal - set to null if field is empty, otherwise use parsed value
      const leanMassInput = document.getElementById('leanMassGoal').value.trim();
      this.goals.leanMass = leanMassInput === '' ? null : (this.useMetric ? leanMassGoal : leanMassGoal / 2.20462);
      
      if (height) {
        this.height = document.getElementById('heightUnitToggle').textContent === 'cm' ? height : height * 2.54;
        await this.dataManager.setHeight(this.height);
      }
      
      await this.dataManager.setGoals(this.goals);
      
      this.notificationService.showSuccess('Goals saved successfully!');
      
      // Trigger app updates
      if (this.onGoalUpdate) {
        this.onGoalUpdate();
      }
    } catch (error) {
      this.notificationService.showError(`Failed to save goals: ${error.message}`);
    }
  }

  /**
   * Handle edit form submission
   */
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
    
    try {
      await this.dataManager.updateMeasurement(id, updatedData);
      this.measurements = this.dataManager.getMeasurements();
      
      // Close modal
      document.getElementById('editModal').classList.remove('show');
      
      // Update form availability if edited measurement affects current form
      this.updateFormAvailability(document.getElementById('measurementDate').value);
      
      this.notificationService.showSuccess('Measurement updated successfully!');
      
      // Trigger app updates
      if (this.onMeasurementUpdate) {
        this.onMeasurementUpdate();
      }
    } catch (error) {
      this.notificationService.showError(`Failed to update measurement: ${error.message}`);
    }
  }

  /**
   * Handle height input changes
   */
  async handleHeightChange(e) {
    const height = parseFloat(e.target.value);
    if (height) {
      try {
        this.height = document.getElementById('heightUnitToggle').textContent === 'cm' ? height : height * 2.54;
        await this.dataManager.setHeight(this.height);
        
        // Update UI stats to reflect new BMI
        this.uiManager.updateStats(this.measurements, this.useMetric);
      } catch (error) {
        this.notificationService.showError(`Failed to save height: ${error.message}`);
      }
    }
  }

  /**
   * Toggle weight unit between kg and lbs
   */
  toggleWeightUnit() {
    this.useMetric = !this.useMetric;
    const button = document.getElementById('weightUnitToggle');
    button.textContent = this.useMetric ? 'kg' : 'lbs';
    
    // Update lean mass unit toggle to match
    document.getElementById('leanMassUnitToggle').textContent = this.useMetric ? 'kg' : 'lbs';
    
    this.updateGoalInputs();
    
    // Trigger app updates
    if (this.onUnitToggle) {
      this.onUnitToggle();
    }
  }

  /**
   * Toggle lean mass unit between kg and lbs
   */
  toggleLeanMassUnit() {
    this.useMetric = !this.useMetric;
    const button = document.getElementById('leanMassUnitToggle');
    button.textContent = this.useMetric ? 'kg' : 'lbs';
    
    // Update weight unit toggle to match
    document.getElementById('weightUnitToggle').textContent = this.useMetric ? 'kg' : 'lbs';
    
    this.updateGoalInputs();
    
    // Trigger app updates
    if (this.onUnitToggle) {
      this.onUnitToggle();
    }
  }

  /**
   * Toggle height unit between cm and inches
   */
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

  /**
   * Update form availability based on existing measurements
   */
  updateFormAvailability(date) {
    const exists = this.measurements.some(m => m.date === date);
    ['weight', 'bodyFat', 'leanMass'].forEach(id => {
      document.getElementById(id).disabled = exists;
    });
    document.querySelector('#measurementForm button[type="submit"]').disabled = exists;
  }

  /**
   * Update goal inputs based on current units
   */
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

  /**
   * Prepare edit form with measurement data
   */
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
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormManager;
}

// Make available in global scope for browser
if (typeof window !== 'undefined') {
  window.FormManager = FormManager;
}