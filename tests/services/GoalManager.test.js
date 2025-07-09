const GoalManager = require('../../js/features/GoalManager');
const CalculationService = require('../../js/services/CalculationService');
const DataManager = require('../../js/services/DataManager');

describe('GoalManager', () => {
  let goalManager;
  let calculationService;
  let dataManager;
  let mockContainer;

  beforeEach(() => {
    // Mock DOM elements
    mockContainer = {
      innerHTML: ''
    };
    
    global.document = {
      getElementById: jest.fn(() => mockContainer)
    };

    calculationService = new CalculationService();
    dataManager = new DataManager();
    goalManager = new GoalManager(calculationService, dataManager);
  });

  afterEach(() => {
    delete global.document;
  });

  describe('updateGoalProgress', () => {
    test('should show empty state when no measurements', () => {
      const goals = { weight: 70, bodyFat: 10, leanMass: 50 };
      
      goalManager.updateGoalProgress([], goals);
      
      expect(mockContainer.innerHTML).toContain('Add measurements to track goal progress');
    });

    test('should show empty state when measurements is null', () => {
      const goals = { weight: 70, bodyFat: 10, leanMass: 50 };
      
      goalManager.updateGoalProgress(null, goals);
      
      expect(mockContainer.innerHTML).toContain('Add measurements to track goal progress');
    });

    test('should show goal setting message when no goals set', () => {
      const measurements = [
        { weight: 75, bodyFat: 12, leanMass: 45 }
      ];
      
      goalManager.updateGoalProgress(measurements, {});
      
      expect(mockContainer.innerHTML).toContain('Set your goals above to track progress');
    });

    test('should render weight goal progress', () => {
      const measurements = [
        { weight: 75, bodyFat: 12, leanMass: 45 },
        { weight: 80, bodyFat: 15, leanMass: 40 }
      ];
      const goals = { weight: 70 };
      
      goalManager.updateGoalProgress(measurements, goals);
      
      expect(mockContainer.innerHTML).toContain('Weight');
      expect(mockContainer.innerHTML).toContain('5.0 kg to go');
    });

    test('should render body fat goal progress', () => {
      const measurements = [
        { weight: 75, bodyFat: 12, leanMass: 45 },
        { weight: 80, bodyFat: 15, leanMass: 40 }
      ];
      const goals = { bodyFat: 10 };
      
      goalManager.updateGoalProgress(measurements, goals);
      
      expect(mockContainer.innerHTML).toContain('Body Fat');
      expect(mockContainer.innerHTML).toContain('2.0 % to go');
    });

    test('should render lean mass goal progress', () => {
      const measurements = [
        { weight: 75, bodyFat: 12, leanMass: 45 },
        { weight: 80, bodyFat: 15, leanMass: 40 }
      ];
      const goals = { leanMass: 50 };
      
      goalManager.updateGoalProgress(measurements, goals);
      
      expect(mockContainer.innerHTML).toContain('Lean Mass');
      expect(mockContainer.innerHTML).toContain('5.0 kg to go');
    });

    test('should show goal achieved when target is reached', () => {
      const measurements = [
        { weight: 70, bodyFat: 10, leanMass: 50 }
      ];
      const goals = { weight: 70, bodyFat: 10, leanMass: 50 };
      
      goalManager.updateGoalProgress(measurements, goals);
      
      expect(mockContainer.innerHTML).toContain('Goal achieved!');
    });

    test('should handle imperial units for weight', () => {
      const measurements = [
        { weight: 75, bodyFat: 12, leanMass: 45 }
      ];
      const goals = { weight: 70 };
      
      goalManager.updateGoalProgress(measurements, goals, false);
      
      expect(mockContainer.innerHTML).toContain('lbs');
    });

    test('should handle imperial units for lean mass', () => {
      const measurements = [
        { weight: 75, bodyFat: 12, leanMass: 45 }
      ];
      const goals = { leanMass: 50 };
      
      goalManager.updateGoalProgress(measurements, goals, false);
      
      expect(mockContainer.innerHTML).toContain('lbs');
    });
  });

  describe('calculateProgress', () => {
    test('should calculate weight goal progress correctly', () => {
      const measurements = [
        { weight: 75 },
        { weight: 80 }
      ];
      
      const progress = goalManager.calculateProgress(75, 70, false, measurements);
      
      expect(progress).toBeGreaterThan(0);
      expect(progress).toBeLessThanOrEqual(100);
    });

    test('should calculate body fat goal progress correctly', () => {
      const measurements = [
        { bodyFat: 12 },
        { bodyFat: 15 }
      ];
      
      const progress = goalManager.calculateProgress(12, 10, true, measurements);
      
      expect(progress).toBeGreaterThan(0);
      expect(progress).toBeLessThanOrEqual(100);
    });
  });

  describe('renderGoalProgress', () => {
    test('should render progress bar with correct values', () => {
      const html = goalManager.renderGoalProgress('Weight', 75, 70, 50, 'kg');
      
      expect(html).toContain('Weight');
      expect(html).toContain('5.0 kg to go');
      expect(html).toContain('width: 50%');
      expect(html).toContain('goal-progress-item');
    });

    test('should show goal achieved when target is reached', () => {
      const html = goalManager.renderGoalProgress('Weight', 70, 70, 100, 'kg');
      
      expect(html).toContain('Goal achieved!');
    });

    test('should handle negative remaining values (over target)', () => {
      const html = goalManager.renderGoalProgress('Weight', 65, 70, 100, 'kg');
      
      expect(html).toContain('5.0 kg to go');
    });
  });

  describe('isGoalAchieved', () => {
    test('should return true when weight goal is achieved', () => {
      expect(goalManager.isGoalAchieved(70, 70, false)).toBe(true);
      expect(goalManager.isGoalAchieved(70.05, 70, false)).toBe(true);
    });

    test('should return false when weight goal is not achieved', () => {
      expect(goalManager.isGoalAchieved(75, 70, false)).toBe(false);
      expect(goalManager.isGoalAchieved(65, 70, false)).toBe(false);
    });

    test('should return true when body fat goal is achieved', () => {
      expect(goalManager.isGoalAchieved(10, 10, true)).toBe(true);
      expect(goalManager.isGoalAchieved(9, 10, true)).toBe(true);
    });

    test('should return false when body fat goal is not achieved', () => {
      expect(goalManager.isGoalAchieved(12, 10, true)).toBe(false);
    });
  });

  describe('formatGoalAchievement', () => {
    test('should format achievement message correctly', () => {
      expect(goalManager.formatGoalAchievement(70, 70, false)).toBe('Goal achieved!');
      expect(goalManager.formatGoalAchievement(75, 70, false)).toBe('5.0 over target');
      expect(goalManager.formatGoalAchievement(65, 70, false)).toBe('5.0 to go');
    });

    test('should handle body fat achievement correctly', () => {
      expect(goalManager.formatGoalAchievement(10, 10, true)).toBe('Goal achieved!');
      expect(goalManager.formatGoalAchievement(12, 10, true)).toBe('2.0 over target');
    });
  });

  describe('getGoalStatus', () => {
    test('should return complete goal status', () => {
      const measurements = [
        { weight: 75 },
        { weight: 80 }
      ];
      
      const status = goalManager.getGoalStatus(75, 70, false);
      
      expect(status).toHaveProperty('progress');
      expect(status).toHaveProperty('achieved');
      expect(status).toHaveProperty('remaining');
      expect(status).toHaveProperty('message');
      expect(status.remaining).toBe(5);
    });
  });

  describe('updateGoalInputs', () => {
    test('should update goal input fields with metric values', () => {
      const mockInputs = {
        weight: { value: '' },
        bodyFat: { value: '' },
        leanMass: { value: '' }
      };
      
      global.document.getElementById = jest.fn((id) => {
        if (id === 'goalWeight') return mockInputs.weight;
        if (id === 'goalBodyFat') return mockInputs.bodyFat;
        if (id === 'goalLeanMass') return mockInputs.leanMass;
        return null;
      });
      
      const goals = { weight: 70, bodyFat: 10, leanMass: 50 };
      
      goalManager.updateGoalInputs(goals, 175, true);
      
      expect(mockInputs.weight.value).toBe('70.0');
      expect(mockInputs.bodyFat.value).toBe('10.0');
      expect(mockInputs.leanMass.value).toBe('50.0');
    });

    test('should update goal input fields with imperial values', () => {
      const mockInputs = {
        weight: { value: '' },
        leanMass: { value: '' }
      };
      
      global.document.getElementById = jest.fn((id) => {
        if (id === 'goalWeight') return mockInputs.weight;
        if (id === 'goalLeanMass') return mockInputs.leanMass;
        return null;
      });
      
      const goals = { weight: 70, leanMass: 50 };
      
      goalManager.updateGoalInputs(goals, 175, false);
      
      expect(parseFloat(mockInputs.weight.value)).toBeCloseTo(154.32, 1);
      expect(parseFloat(mockInputs.leanMass.value)).toBeCloseTo(110.23, 1);
    });
  });

  describe('getRecommendedGoals', () => {
    test('should return null when no measurements', () => {
      const recommendations = goalManager.getRecommendedGoals([], 175);
      
      expect(recommendations).toBeNull();
    });

    test('should recommend weight loss for high BMI', () => {
      const measurements = [
        { weight: 90, bodyFat: 25, leanMass: 67.5 }
      ];
      
      const recommendations = goalManager.getRecommendedGoals(measurements, 175);
      
      expect(recommendations.weight).toBeLessThan(90);
      expect(recommendations.weight).toBeCloseTo(73.5, 1);
    });

    test('should recommend weight gain for low BMI', () => {
      const measurements = [
        { weight: 50, bodyFat: 8, leanMass: 46 }
      ];
      
      const recommendations = goalManager.getRecommendedGoals(measurements, 175);
      
      expect(recommendations.weight).toBeGreaterThan(50);
      expect(recommendations.weight).toBeCloseTo(61.25, 1);
    });

    test('should recommend body fat reduction for high body fat', () => {
      const measurements = [
        { weight: 75, bodyFat: 25, leanMass: 56.25 }
      ];
      
      const recommendations = goalManager.getRecommendedGoals(measurements, 175);
      
      expect(recommendations.bodyFat).toBeLessThan(25);
      expect(recommendations.bodyFat).toBe(20);
    });

    test('should recommend lean mass increase', () => {
      const measurements = [
        { weight: 75, bodyFat: 15, leanMass: 63.75 }
      ];
      
      const recommendations = goalManager.getRecommendedGoals(measurements, 175);
      
      expect(recommendations.leanMass).toBe(64.75);
    });
  });
});