const FormManager = require('../../js/ui/FormManager');

describe('FormManager', () => {
  let formManager;
  let mockDataManager;
  let mockNotificationService;
  let mockUIManager;

  beforeEach(() => {
    // Mock DOM elements
    global.document = {
      getElementById: jest.fn(() => ({
        value: '',
        textContent: 'kg',
        disabled: false,
        classList: {
          add: jest.fn(),
          remove: jest.fn()
        }
      })),
      querySelector: jest.fn(() => ({
        disabled: false
      }))
    };

    // Mock FormData
    global.FormData = jest.fn(() => ({
      get: jest.fn(() => '2025-07-08')
    }));

    // Mock alert
    global.alert = jest.fn();

    // Mock DataManager
    mockDataManager = {
      addMeasurement: jest.fn(),
      updateMeasurement: jest.fn(),
      setGoals: jest.fn(),
      setHeight: jest.fn(),
      getMeasurements: jest.fn(() => [])
    };

    // Mock NotificationService
    mockNotificationService = {
      showSuccess: jest.fn(),
      showError: jest.fn()
    };

    // Mock UIManager
    mockUIManager = {
      updateStats: jest.fn()
    };

    formManager = new FormManager(mockDataManager, mockNotificationService, mockUIManager);
  });

  describe('constructor', () => {
    test('should initialize with services and default values', () => {
      expect(formManager.dataManager).toBe(mockDataManager);
      expect(formManager.notificationService).toBe(mockNotificationService);
      expect(formManager.uiManager).toBe(mockUIManager);
      expect(formManager.useMetric).toBe(true);
      expect(formManager.measurements).toEqual([]);
      expect(formManager.goals).toEqual({ weight: null, bodyFat: null, leanMass: null });
      expect(formManager.height).toBe(175);
    });
  });

  describe('initialize', () => {
    test('should initialize with provided data', () => {
      const measurements = [{ id: '1', date: '2025-07-08', weight: 70 }];
      const goals = { weight: 75, bodyFat: 15, leanMass: 60 };
      const height = 180;
      const useMetric = false;

      const updateGoalInputsSpy = jest.spyOn(formManager, 'updateGoalInputs');

      formManager.initialize(measurements, goals, height, useMetric);

      expect(formManager.measurements).toBe(measurements);
      expect(formManager.goals).toBe(goals);
      expect(formManager.height).toBe(height);
      expect(formManager.useMetric).toBe(useMetric);
      expect(updateGoalInputsSpy).toHaveBeenCalled();
    });
  });

  describe('setCallbacks', () => {
    test('should set callback functions', () => {
      const callbacks = {
        onMeasurementUpdate: jest.fn(),
        onGoalUpdate: jest.fn(),
        onUnitToggle: jest.fn()
      };

      formManager.setCallbacks(callbacks);

      expect(formManager.onMeasurementUpdate).toBe(callbacks.onMeasurementUpdate);
      expect(formManager.onGoalUpdate).toBe(callbacks.onGoalUpdate);
      expect(formManager.onUnitToggle).toBe(callbacks.onUnitToggle);
    });
  });

  describe('generateId', () => {
    test('should generate unique IDs', () => {
      const id1 = formManager.generateId();
      const id2 = formManager.generateId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });
  });

  describe('setDefaultFormDate', () => {
    test('should set today\'s date and update form availability', () => {
      const mockDateInput = { value: '' };
      global.document.getElementById.mockReturnValue(mockDateInput);
      
      const updateFormAvailabilitySpy = jest.spyOn(formManager, 'updateFormAvailability');

      formManager.setDefaultFormDate();

      expect(mockDateInput.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(updateFormAvailabilitySpy).toHaveBeenCalled();
    });
  });

  describe('handleFormSubmit', () => {
    let mockEvent;
    let mockFormElements;

    beforeEach(() => {
      mockEvent = {
        preventDefault: jest.fn(),
        target: {
          reset: jest.fn()
        }
      };

      mockFormElements = {
        measurementDate: { value: '2025-07-08' },
        weight: { value: '70' },
        bodyFat: { value: '15' },
        leanMass: { value: '60' }
      };

      global.document.getElementById.mockImplementation((id) => mockFormElements[id] || { value: '' });
    });

    test('should handle successful form submission', async () => {
      const setDefaultFormDateSpy = jest.spyOn(formManager, 'setDefaultFormDate');
      const updateFormAvailabilitySpy = jest.spyOn(formManager, 'updateFormAvailability');
      const onMeasurementUpdate = jest.fn();
      formManager.onMeasurementUpdate = onMeasurementUpdate;

      await formManager.handleFormSubmit(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockDataManager.addMeasurement).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          date: '2025-07-08',
          weight: 70,
          bodyFat: 15,
          leanMass: 60,
          weightLbs: expect.any(Number),
          leanMassLbs: expect.any(Number)
        })
      );
      expect(mockEvent.target.reset).toHaveBeenCalled();
      expect(setDefaultFormDateSpy).toHaveBeenCalled();
      expect(updateFormAvailabilitySpy).toHaveBeenCalled();
      expect(mockNotificationService.showSuccess).toHaveBeenCalledWith('Measurement saved successfully!');
      expect(onMeasurementUpdate).toHaveBeenCalled();
    });

    test('should handle imperial units correctly', async () => {
      formManager.useMetric = false;
      
      await formManager.handleFormSubmit(mockEvent);

      expect(mockDataManager.addMeasurement).toHaveBeenCalledWith({
        id: expect.any(String),
        date: '2025-07-08',
        weight: 70 / 2.20462,
        bodyFat: 15,
        leanMass: 60 / 2.20462,
        weightLbs: 70,
        leanMassLbs: 60
      });
    });

    test('should handle missing fields', async () => {
      mockFormElements.weight.value = '';

      await formManager.handleFormSubmit(mockEvent);

      expect(global.alert).toHaveBeenCalledWith('Please fill in all fields');
      expect(mockDataManager.addMeasurement).not.toHaveBeenCalled();
    });

    test('should handle data manager error', async () => {
      mockDataManager.addMeasurement.mockRejectedValue(new Error('Database error'));

      await formManager.handleFormSubmit(mockEvent);

      expect(mockNotificationService.showError).toHaveBeenCalledWith('Failed to save measurement: Database error');
    });
  });

  describe('handleGoalsSubmit', () => {
    let mockEvent;
    let mockFormElements;

    beforeEach(() => {
      mockEvent = {
        preventDefault: jest.fn()
      };

      mockFormElements = {
        weightGoal: { value: '75' },
        bodyFatGoal: { value: '12' },
        leanMassGoal: { value: '65' },
        heightInput: { value: '180' },
        heightUnitToggle: { textContent: 'cm' }
      };

      global.document.getElementById.mockImplementation((id) => mockFormElements[id] || { value: '' });
    });

    test('should handle successful goals submission', async () => {
      const onGoalUpdate = jest.fn();
      formManager.onGoalUpdate = onGoalUpdate;

      await formManager.handleGoalsSubmit(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(formManager.goals.weight).toBe(75);
      expect(formManager.goals.bodyFat).toBe(12);
      expect(formManager.goals.leanMass).toBe(65);
      expect(formManager.height).toBe(180);
      expect(mockDataManager.setGoals).toHaveBeenCalledWith(formManager.goals);
      expect(mockDataManager.setHeight).toHaveBeenCalledWith(180);
      expect(mockNotificationService.showSuccess).toHaveBeenCalledWith('Goals saved successfully!');
      expect(onGoalUpdate).toHaveBeenCalled();
    });

    test('should handle imperial units for goals', async () => {
      formManager.useMetric = false;
      mockFormElements.heightUnitToggle.textContent = 'in';

      await formManager.handleGoalsSubmit(mockEvent);

      expect(formManager.goals.weight).toBe(75 / 2.20462);
      expect(formManager.goals.leanMass).toBe(65 / 2.20462);
      expect(formManager.height).toBe(180 * 2.54);
    });

    test('should handle empty goal fields', async () => {
      mockFormElements.weightGoal.value = '';
      mockFormElements.bodyFatGoal.value = '';
      mockFormElements.leanMassGoal.value = '';
      mockFormElements.heightInput.value = '';

      await formManager.handleGoalsSubmit(mockEvent);

      expect(mockDataManager.setGoals).toHaveBeenCalledWith(formManager.goals);
      expect(mockDataManager.setHeight).not.toHaveBeenCalled();
    });

    test('should handle data manager error', async () => {
      mockDataManager.setGoals.mockRejectedValue(new Error('Database error'));

      await formManager.handleGoalsSubmit(mockEvent);

      expect(mockNotificationService.showError).toHaveBeenCalledWith('Failed to save goals: Database error');
    });
  });

  describe('handleEditSubmit', () => {
    let mockEvent;
    let mockFormElements;

    beforeEach(() => {
      mockEvent = {
        preventDefault: jest.fn()
      };

      mockFormElements = {
        editId: { value: 'test-id' },
        editDate: { value: '2025-07-08' },
        editWeight: { value: '72' },
        editBodyFat: { value: '16' },
        editLeanMass: { value: '61' },
        editModal: { classList: { remove: jest.fn() } }
      };

      global.document.getElementById.mockImplementation((id) => mockFormElements[id] || { value: '' });
      
      formManager.measurements = [{ id: 'test-id', date: '2025-07-08', weight: 70 }];
    });

    test('should handle successful edit submission', async () => {
      const updateFormAvailabilitySpy = jest.spyOn(formManager, 'updateFormAvailability');
      const onMeasurementUpdate = jest.fn();
      formManager.onMeasurementUpdate = onMeasurementUpdate;

      await formManager.handleEditSubmit(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockDataManager.updateMeasurement).toHaveBeenCalledWith('test-id', 
        expect.objectContaining({
          date: '2025-07-08',
          weight: 72,
          bodyFat: 16,
          leanMass: 61,
          weightLbs: expect.any(Number),
          leanMassLbs: expect.any(Number)
        })
      );
      expect(mockFormElements.editModal.classList.remove).toHaveBeenCalledWith('show');
      expect(updateFormAvailabilitySpy).toHaveBeenCalled();
      expect(mockNotificationService.showSuccess).toHaveBeenCalledWith('Measurement updated successfully!');
      expect(onMeasurementUpdate).toHaveBeenCalled();
    });

    test('should handle non-existent measurement', async () => {
      formManager.measurements = [];

      await formManager.handleEditSubmit(mockEvent);

      expect(mockDataManager.updateMeasurement).not.toHaveBeenCalled();
    });

    test('should handle data manager error', async () => {
      mockDataManager.updateMeasurement.mockRejectedValue(new Error('Database error'));

      await formManager.handleEditSubmit(mockEvent);

      expect(mockNotificationService.showError).toHaveBeenCalledWith('Failed to update measurement: Database error');
    });
  });

  describe('handleHeightChange', () => {
    test('should handle height change in cm', async () => {
      const mockEvent = { target: { value: '180' } };
      global.document.getElementById.mockReturnValue({ textContent: 'cm' });

      await formManager.handleHeightChange(mockEvent);

      expect(formManager.height).toBe(180);
      expect(mockDataManager.setHeight).toHaveBeenCalledWith(180);
      expect(mockUIManager.updateStats).toHaveBeenCalled();
    });

    test('should handle height change in inches', async () => {
      const mockEvent = { target: { value: '70' } };
      global.document.getElementById.mockReturnValue({ textContent: 'in' });

      await formManager.handleHeightChange(mockEvent);

      expect(formManager.height).toBe(70 * 2.54);
      expect(mockDataManager.setHeight).toHaveBeenCalledWith(70 * 2.54);
    });

    test('should handle empty height', async () => {
      const mockEvent = { target: { value: '' } };

      await formManager.handleHeightChange(mockEvent);

      expect(mockDataManager.setHeight).not.toHaveBeenCalled();
    });
  });

  describe('toggleWeightUnit', () => {
    test('should toggle from metric to imperial', () => {
      const mockButton = { textContent: 'kg' };
      const mockLeanMassButton = { textContent: 'kg' };
      const updateGoalInputsSpy = jest.spyOn(formManager, 'updateGoalInputs');
      const onUnitToggle = jest.fn();
      formManager.onUnitToggle = onUnitToggle;

      global.document.getElementById.mockImplementation((id) => {
        if (id === 'weightUnitToggle') return mockButton;
        if (id === 'leanMassUnitToggle') return mockLeanMassButton;
        return { textContent: '' };
      });

      formManager.toggleWeightUnit();

      expect(formManager.useMetric).toBe(false);
      expect(mockButton.textContent).toBe('lbs');
      expect(mockLeanMassButton.textContent).toBe('lbs');
      expect(updateGoalInputsSpy).toHaveBeenCalled();
      expect(onUnitToggle).toHaveBeenCalled();
    });
  });

  describe('toggleLeanMassUnit', () => {
    test('should toggle from metric to imperial', () => {
      const mockButton = { textContent: 'kg' };
      const mockWeightButton = { textContent: 'kg' };
      const updateGoalInputsSpy = jest.spyOn(formManager, 'updateGoalInputs');
      const onUnitToggle = jest.fn();
      formManager.onUnitToggle = onUnitToggle;

      global.document.getElementById.mockImplementation((id) => {
        if (id === 'leanMassUnitToggle') return mockButton;
        if (id === 'weightUnitToggle') return mockWeightButton;
        return { textContent: '' };
      });

      formManager.toggleLeanMassUnit();

      expect(formManager.useMetric).toBe(false);
      expect(mockButton.textContent).toBe('lbs');
      expect(mockWeightButton.textContent).toBe('lbs');
      expect(updateGoalInputsSpy).toHaveBeenCalled();
      expect(onUnitToggle).toHaveBeenCalled();
    });
  });

  describe('toggleHeightUnit', () => {
    test('should toggle from cm to inches', () => {
      const mockButton = { textContent: 'cm' };
      const mockInput = { value: '180' };
      formManager.height = 180;

      global.document.getElementById.mockImplementation((id) => {
        if (id === 'heightUnitToggle') return mockButton;
        if (id === 'heightInput') return mockInput;
        return {};
      });

      formManager.toggleHeightUnit();

      expect(mockButton.textContent).toBe('in');
      expect(mockInput.value).toBe('70.9'); // 180 / 2.54
    });

    test('should toggle from inches to cm', () => {
      const mockButton = { textContent: 'in' };
      const mockInput = { value: '70' };
      formManager.height = 177.8;

      global.document.getElementById.mockImplementation((id) => {
        if (id === 'heightUnitToggle') return mockButton;
        if (id === 'heightInput') return mockInput;
        return {};
      });

      formManager.toggleHeightUnit();

      expect(mockButton.textContent).toBe('cm');
      expect(mockInput.value).toBe('178'); // 70 * 2.54
    });
  });

  describe('updateFormAvailability', () => {
    test('should disable form when measurement exists for date', () => {
      formManager.measurements = [{ id: '1', date: '2025-07-08', weight: 70 }];
      
      const mockElements = {
        weight: { disabled: false },
        bodyFat: { disabled: false },
        leanMass: { disabled: false }
      };
      const mockSubmitButton = { disabled: false };

      global.document.getElementById.mockImplementation((id) => mockElements[id]);
      global.document.querySelector.mockReturnValue(mockSubmitButton);

      formManager.updateFormAvailability('2025-07-08');

      expect(mockElements.weight.disabled).toBe(true);
      expect(mockElements.bodyFat.disabled).toBe(true);
      expect(mockElements.leanMass.disabled).toBe(true);
      expect(mockSubmitButton.disabled).toBe(true);
    });

    test('should enable form when no measurement exists for date', () => {
      formManager.measurements = [{ id: '1', date: '2025-07-07', weight: 70 }];
      
      const mockElements = {
        weight: { disabled: true },
        bodyFat: { disabled: true },
        leanMass: { disabled: true }
      };
      const mockSubmitButton = { disabled: true };

      global.document.getElementById.mockImplementation((id) => mockElements[id]);
      global.document.querySelector.mockReturnValue(mockSubmitButton);

      formManager.updateFormAvailability('2025-07-08');

      expect(mockElements.weight.disabled).toBe(false);
      expect(mockElements.bodyFat.disabled).toBe(false);
      expect(mockElements.leanMass.disabled).toBe(false);
      expect(mockSubmitButton.disabled).toBe(false);
    });
  });

  describe('updateGoalInputs', () => {
    test('should update goal inputs with metric values', () => {
      formManager.goals = { weight: 75, bodyFat: 12, leanMass: 65 };
      formManager.height = 180;
      formManager.useMetric = true;

      const mockElements = {
        weightGoal: { value: '' },
        bodyFatGoal: { value: '' },
        leanMassGoal: { value: '' },
        heightInput: { value: '' },
        heightUnitToggle: { textContent: 'cm' },
        weightGoalUnit: { textContent: '' },
        leanMassGoalUnit: { textContent: '' }
      };

      global.document.getElementById.mockImplementation((id) => mockElements[id]);

      formManager.updateGoalInputs();

      expect(mockElements.weightGoal.value).toBe('75.0');
      expect(mockElements.bodyFatGoal.value).toBe('12.0');
      expect(mockElements.leanMassGoal.value).toBe('65.0');
      expect(mockElements.heightInput.value).toBe('180');
      expect(mockElements.weightGoalUnit.textContent).toBe('kg');
      expect(mockElements.leanMassGoalUnit.textContent).toBe('kg');
    });

    test('should update goal inputs with imperial values', () => {
      formManager.goals = { weight: 75, bodyFat: 12, leanMass: 65 };
      formManager.height = 180;
      formManager.useMetric = false;

      const mockElements = {
        weightGoal: { value: '' },
        bodyFatGoal: { value: '' },
        leanMassGoal: { value: '' },
        heightInput: { value: '' },
        heightUnitToggle: { textContent: 'in' },
        weightGoalUnit: { textContent: '' },
        leanMassGoalUnit: { textContent: '' }
      };

      global.document.getElementById.mockImplementation((id) => mockElements[id]);

      formManager.updateGoalInputs();

      expect(mockElements.weightGoal.value).toBe('165.3'); // 75 * 2.20462
      expect(mockElements.leanMassGoal.value).toBe('143.3'); // 65 * 2.20462
      expect(mockElements.heightInput.value).toBe('70.9'); // 180 / 2.54
      expect(mockElements.weightGoalUnit.textContent).toBe('lbs');
      expect(mockElements.leanMassGoalUnit.textContent).toBe('lbs');
    });
  });

  describe('editMeasurement', () => {
    test('should populate edit form with measurement data', () => {
      const measurement = {
        id: 'test-id',
        date: '2025-07-08',
        weight: 70,
        bodyFat: 15,
        leanMass: 60
      };
      formManager.measurements = [measurement];

      const mockElements = {
        editId: { value: '' },
        editDate: { value: '' },
        editWeight: { value: '' },
        editBodyFat: { value: '' },
        editLeanMass: { value: '' },
        editWeightUnit: { textContent: '' },
        editLeanMassUnit: { textContent: '' },
        editModal: { classList: { add: jest.fn() } }
      };

      global.document.getElementById.mockImplementation((id) => mockElements[id]);

      formManager.editMeasurement('test-id');

      expect(mockElements.editId.value).toBe('test-id');
      expect(mockElements.editDate.value).toBe('2025-07-08');
      expect(mockElements.editWeight.value).toBe(70);
      expect(mockElements.editBodyFat.value).toBe(15);
      expect(mockElements.editLeanMass.value).toBe(60);
      expect(mockElements.editWeightUnit.textContent).toBe('kg');
      expect(mockElements.editLeanMassUnit.textContent).toBe('kg');
      expect(mockElements.editModal.classList.add).toHaveBeenCalledWith('show');
    });

    test('should handle non-existent measurement', () => {
      formManager.measurements = [];

      formManager.editMeasurement('non-existent-id');

      expect(global.document.getElementById).not.toHaveBeenCalled();
    });
  });
});