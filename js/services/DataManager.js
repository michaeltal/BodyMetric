class DataManager {
  constructor() {
    this.measurements = [];
    this.goals = { weight: null, bodyFat: null, leanMass: null };
    this.height = 175;
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  async loadData() {
    try {
      const res = await fetch('/data');
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      
      const data = await res.json();
      this.measurements = data.measurements || [];
      this.goals = data.goals || { weight: null, bodyFat: null, leanMass: null };
      this.height = data.height || 175;
      
      this.measurements.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      console.error('Failed to load data from server:', error);
      throw new Error('Unable to connect to server. Please check your connection and try again.');
    }
  }

  async saveToServer() {
    try {
      const response = await fetch('/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          measurements: this.measurements,
          goals: this.goals,
          height: this.height
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to save to server:', error);
      throw new Error('Unable to save data to server. Please check your connection and try again.');
    }
  }

  async addMeasurement(measurement) {
    const existingIndex = this.measurements.findIndex(m => m.date === measurement.date);
    
    if (existingIndex >= 0) {
      this.measurements[existingIndex] = { ...this.measurements[existingIndex], ...measurement };
    } else {
      measurement.id = measurement.id || this.generateId();
      this.measurements.push(measurement);
    }
    
    this.measurements.sort((a, b) => new Date(b.date) - new Date(a.date));
    await this.saveToServer();
  }

  async updateMeasurement(id, updatedData) {
    const measurementIndex = this.measurements.findIndex(m => m.id === id);
    if (measurementIndex === -1) return false;
    
    this.measurements[measurementIndex] = { ...this.measurements[measurementIndex], ...updatedData };
    this.measurements.sort((a, b) => new Date(b.date) - new Date(a.date));
    await this.saveToServer();
    return true;
  }

  async deleteMeasurement(id) {
    const initialLength = this.measurements.length;
    this.measurements = this.measurements.filter(m => m.id !== id);
    
    if (this.measurements.length < initialLength) {
      await this.saveToServer();
      return true;
    }
    return false;
  }

  getMeasurement(id) {
    return this.measurements.find(m => m.id === id);
  }

  getMeasurements() {
    return [...this.measurements];
  }

  getGoals() {
    return { ...this.goals };
  }

  async setGoals(goals) {
    this.goals = { ...this.goals, ...goals };
    await this.saveToServer();
  }

  getHeight() {
    return this.height;
  }

  async setHeight(height) {
    this.height = height;
    await this.saveToServer();
  }

  measurementExistsForDate(date) {
    return this.measurements.some(m => m.date === date);
  }
}

if (typeof window !== 'undefined') {
  window.DataManager = DataManager;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataManager;
}