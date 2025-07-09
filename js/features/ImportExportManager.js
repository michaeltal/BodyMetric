/**
 * ImportExportManager - Handles CSV import/export operations
 * 
 * Responsibilities:
 * - Export measurements to CSV format
 * - Import CSV files with validation
 * - Handle import errors and user feedback
 * - Data transformation and validation
 */
class ImportExportManager {
  constructor(dataManager, notificationService) {
    this.dataManager = dataManager;
    this.notificationService = notificationService;
    
    // Callbacks for updating the app after import
    this.onImportSuccess = null;
  }

  /**
   * Set callback for when import succeeds
   */
  setCallbacks(callbacks) {
    this.onImportSuccess = callbacks.onImportSuccess;
  }

  /**
   * Export measurements to CSV file
   */
  exportData(measurements) {
    if (!measurements || measurements.length === 0) {
      this.notificationService.showError('No measurements to export');
      return;
    }

    const csvContent = measurements.map(m => 
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
    
    this.notificationService.showSuccess('Data exported successfully!');
  }

  /**
   * Import measurements from CSV file
   */
  async importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csv = e.target.result;
        const validatedMeasurements = this.validateAndParseCSV(csv);
        
        if (validatedMeasurements.length > 0) {
          const importResult = await this.processMeasurements(validatedMeasurements);
          this.handleImportResult(importResult);
          
          // Trigger app updates if import was successful
          if (importResult.successCount > 0 && this.onImportSuccess) {
            this.onImportSuccess();
          }
        } else {
          this.notificationService.showError('No valid measurements found in the file');
        }
      } catch (error) {
        this.notificationService.showError('Error importing data. Please check the file format.');
      }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  }

  /**
   * Validate and parse CSV data
   */
  validateAndParseCSV(csv) {
    const lines = csv.split('\n');
    const validatedMeasurements = [];
    
    // Skip header row (index 0)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const [date, weight, bodyFat, leanMass] = line.split(',');
      
      if (this.isValidMeasurementData(date, weight, bodyFat, leanMass)) {
        validatedMeasurements.push({
          id: this.generateId(),
          date: date.trim(),
          weight: parseFloat(weight),
          bodyFat: parseFloat(bodyFat),
          leanMass: parseFloat(leanMass),
          weightLbs: parseFloat(weight) * 2.20462,
          leanMassLbs: parseFloat(leanMass) * 2.20462,
          rowNumber: i + 1
        });
      }
    }
    
    return validatedMeasurements;
  }

  /**
   * Validate measurement data from CSV
   */
  isValidMeasurementData(date, weight, bodyFat, leanMass) {
    // Check if all required fields are present
    if (!date || !weight || !bodyFat || !leanMass) {
      return false;
    }
    
    // Check if numeric values are valid
    const weightNum = parseFloat(weight);
    const bodyFatNum = parseFloat(bodyFat);
    const leanMassNum = parseFloat(leanMass);
    
    if (isNaN(weightNum) || isNaN(bodyFatNum) || isNaN(leanMassNum)) {
      return false;
    }
    
    // Basic range validation
    if (weightNum <= 0 || weightNum > 500) return false;
    if (bodyFatNum < 0 || bodyFatNum > 50) return false;
    if (leanMassNum <= 0 || leanMassNum > 400) return false;
    
    // Check date format (basic validation)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date.trim())) return false;
    
    return true;
  }

  /**
   * Process validated measurements by adding them to the data manager
   */
  async processMeasurements(measurements) {
    let successCount = 0;
    const errors = [];
    
    for (const measurement of measurements) {
      try {
        await this.dataManager.addMeasurement(measurement);
        successCount++;
      } catch (error) {
        errors.push(`Row ${measurement.rowNumber}: ${error.message}`);
      }
    }
    
    return {
      successCount,
      errors,
      totalCount: measurements.length
    };
  }

  /**
   * Handle import result and show appropriate notifications
   */
  handleImportResult(result) {
    const { successCount, errors, totalCount } = result;
    
    if (errors.length === 0) {
      this.notificationService.showSuccess(`Imported ${successCount} measurements successfully!`);
    } else if (successCount > 0) {
      this.notificationService.showError(`Imported ${successCount} measurements, ${errors.length} failed: ${errors.join(', ')}`);
    } else {
      this.notificationService.showError(`Import failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Generate unique ID for measurements
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
  }

  /**
   * Get import statistics for the last import operation
   */
  getImportStats(measurements) {
    if (!measurements || measurements.length === 0) {
      return {
        totalMeasurements: 0,
        dateRange: null,
        averageWeight: 0,
        averageBodyFat: 0,
        averageLeanMass: 0
      };
    }

    const sorted = [...measurements].sort((a, b) => new Date(a.date) - new Date(b.date));
    const totalWeight = measurements.reduce((sum, m) => sum + m.weight, 0);
    const totalBodyFat = measurements.reduce((sum, m) => sum + m.bodyFat, 0);
    const totalLeanMass = measurements.reduce((sum, m) => sum + m.leanMass, 0);

    return {
      totalMeasurements: measurements.length,
      dateRange: {
        start: sorted[0].date,
        end: sorted[sorted.length - 1].date
      },
      averageWeight: totalWeight / measurements.length,
      averageBodyFat: totalBodyFat / measurements.length,
      averageLeanMass: totalLeanMass / measurements.length
    };
  }

  /**
   * Export data with custom format options
   */
  exportDataWithOptions(measurements, options = {}) {
    const {
      includeImperialUnits = false,
      dateFormat = 'YYYY-MM-DD',
      filename = null
    } = options;

    if (!measurements || measurements.length === 0) {
      this.notificationService.showError('No measurements to export');
      return;
    }

    let header = 'Date,Weight (kg),Body Fat %,Lean Mass (kg)';
    if (includeImperialUnits) {
      header += ',Weight (lbs),Lean Mass (lbs)';
    }
    header += '\n';

    const csvContent = measurements.map(m => {
      let row = `${m.date},${m.weight.toFixed(2)},${m.bodyFat.toFixed(1)},${m.leanMass.toFixed(2)}`;
      if (includeImperialUnits) {
        row += `,${m.weightLbs.toFixed(2)},${m.leanMassLbs.toFixed(2)}`;
      }
      return row;
    }).join('\n');
    
    const csv = header + csvContent;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const defaultFilename = `body-composition-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.download = filename || defaultFilename;
    
    a.click();
    URL.revokeObjectURL(url);
    
    this.notificationService.showSuccess('Data exported successfully!');
  }
}

// Browser compatibility
if (typeof window !== 'undefined') {
  window.ImportExportManager = ImportExportManager;
}

// Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImportExportManager;
}