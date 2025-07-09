const TableManager = require('../../js/ui/TableManager');

describe('TableManager', () => {
  let tableManager;
  let mockCalculationService;
  let mockMeasurements;

  beforeEach(() => {
    // Mock DOM elements
    global.document = {
      getElementById: jest.fn(() => ({
        value: '',
        textContent: '',
        innerHTML: '',
        disabled: false
      })),
      querySelectorAll: jest.fn(() => [])
    };

    // Mock CalculationService
    mockCalculationService = {
      formatWeight: jest.fn((weight, useMetric) => useMetric ? weight.toFixed(1) : (weight * 2.20462).toFixed(1)),
      formatLeanMass: jest.fn((leanMass, useMetric) => useMetric ? leanMass.toFixed(1) : (leanMass * 2.20462).toFixed(1))
    };

    // Mock measurements data
    mockMeasurements = [
      { id: '1', date: '2025-07-08', weight: 70, bodyFat: 15, leanMass: 60 },
      { id: '2', date: '2025-07-07', weight: 70.5, bodyFat: 15.2, leanMass: 59.8 },
      { id: '3', date: '2025-07-06', weight: 71, bodyFat: 15.5, leanMass: 59.5 }
    ];

    tableManager = new TableManager(mockCalculationService);
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(tableManager.calculationService).toBe(mockCalculationService);
      expect(tableManager.measurements).toEqual([]);
      expect(tableManager.currentPage).toBe(1);
      expect(tableManager.itemsPerPage).toBe(10);
      expect(tableManager.sortColumn).toBe('date');
      expect(tableManager.sortDirection).toBe('desc');
      expect(tableManager.useMetric).toBe(true);
      expect(tableManager.onEdit).toBeNull();
      expect(tableManager.onDelete).toBeNull();
    });
  });

  describe('initialize', () => {
    test('should initialize with measurements and units', () => {
      const updateTableSpy = jest.spyOn(tableManager, 'updateTable').mockImplementation();

      tableManager.initialize(mockMeasurements, false);

      expect(tableManager.measurements).toBe(mockMeasurements);
      expect(tableManager.useMetric).toBe(false);
      expect(tableManager.currentPage).toBe(1);
      expect(updateTableSpy).toHaveBeenCalled();
    });
  });

  describe('setCallbacks', () => {
    test('should set callback functions', () => {
      const callbacks = {
        onEdit: jest.fn(),
        onDelete: jest.fn()
      };

      tableManager.setCallbacks(callbacks);

      expect(tableManager.onEdit).toBe(callbacks.onEdit);
      expect(tableManager.onDelete).toBe(callbacks.onDelete);
    });
  });

  describe('updateMeasurements', () => {
    test('should update measurements and refresh table', () => {
      const updateTableSpy = jest.spyOn(tableManager, 'updateTable').mockImplementation();

      tableManager.updateMeasurements(mockMeasurements);

      expect(tableManager.measurements).toBe(mockMeasurements);
      expect(updateTableSpy).toHaveBeenCalled();
    });
  });

  describe('updateUnits', () => {
    test('should update units and refresh table', () => {
      const updateTableSpy = jest.spyOn(tableManager, 'updateTable').mockImplementation();

      tableManager.updateUnits(false);

      expect(tableManager.useMetric).toBe(false);
      expect(updateTableSpy).toHaveBeenCalled();
    });
  });

  describe('sortData', () => {
    test('should sort data by date in descending order', () => {
      tableManager.sortColumn = 'date';
      tableManager.sortDirection = 'desc';

      const sorted = tableManager.sortData([...mockMeasurements]);

      expect(sorted[0].date).toBe('2025-07-08');
      expect(sorted[1].date).toBe('2025-07-07');
      expect(sorted[2].date).toBe('2025-07-06');
    });

    test('should sort data by weight in ascending order', () => {
      tableManager.sortColumn = 'weight';
      tableManager.sortDirection = 'asc';

      const sorted = tableManager.sortData([...mockMeasurements]);

      expect(sorted[0].weight).toBe(70);
      expect(sorted[1].weight).toBe(70.5);
      expect(sorted[2].weight).toBe(71);
    });
  });

  describe('handlePagination', () => {
    test('should handle pagination with multiple pages', () => {
      tableManager.itemsPerPage = 2;
      tableManager.currentPage = 2;

      const result = tableManager.handlePagination(mockMeasurements);

      expect(result.totalPages).toBe(2);
      expect(result.pageData).toHaveLength(1);
      expect(result.pageData[0].id).toBe('3');
    });

    test('should adjust current page if it exceeds total pages', () => {
      tableManager.itemsPerPage = 10;
      tableManager.currentPage = 5;

      const result = tableManager.handlePagination(mockMeasurements);

      expect(tableManager.currentPage).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    test('should handle empty data', () => {
      const result = tableManager.handlePagination([]);

      expect(result.totalPages).toBe(1);
      expect(result.pageData).toHaveLength(0);
    });
  });

  describe('renderTableRows', () => {
    let mockTbody;

    beforeEach(() => {
      mockTbody = {
        innerHTML: '',
        querySelectorAll: jest.fn(() => [
          { addEventListener: jest.fn() },
          { addEventListener: jest.fn() },
          { addEventListener: jest.fn() }
        ])
      };
    });

    test('should render measurement rows with correct data', () => {
      tableManager.useMetric = true;

      tableManager.renderTableRows(mockTbody, mockMeasurements);

      expect(mockTbody.innerHTML).toContain('7/8/2025');
      expect(mockTbody.innerHTML).toContain('70.0 kg');
      expect(mockTbody.innerHTML).toContain('15.0%');
      expect(mockTbody.innerHTML).toContain('60.0 kg');
      expect(mockCalculationService.formatWeight).toHaveBeenCalledWith(70, true);
      expect(mockCalculationService.formatLeanMass).toHaveBeenCalledWith(60, true);
    });

    test('should render with imperial units', () => {
      tableManager.useMetric = false;

      tableManager.renderTableRows(mockTbody, [mockMeasurements[0]]);

      expect(mockTbody.innerHTML).toContain('lbs');
      expect(mockCalculationService.formatWeight).toHaveBeenCalledWith(70, false);
      expect(mockCalculationService.formatLeanMass).toHaveBeenCalledWith(60, false);
    });

    test('should render empty state for no data', () => {
      tableManager.renderTableRows(mockTbody, []);

      expect(mockTbody.innerHTML).toContain('No measurements found');
      expect(mockTbody.innerHTML).toContain('empty-state');
    });

    test('should include action buttons for each row', () => {
      tableManager.renderTableRows(mockTbody, [mockMeasurements[0]]);

      expect(mockTbody.innerHTML).toContain('action-btn--edit');
      expect(mockTbody.innerHTML).toContain('action-btn--delete');
      expect(mockTbody.querySelectorAll).toHaveBeenCalledWith('.action-btn--edit');
      expect(mockTbody.querySelectorAll).toHaveBeenCalledWith('.action-btn--delete');
    });
  });

  describe('updatePaginationControls', () => {
    let mockElements;

    beforeEach(() => {
      mockElements = {
        pageIndicator: { textContent: '' },
        prevPage: { disabled: false },
        nextPage: { disabled: false }
      };

      global.document.getElementById.mockImplementation((id) => mockElements[id]);
    });

    test('should update pagination controls correctly', () => {
      tableManager.currentPage = 2;

      tableManager.updatePaginationControls(3, 25);

      expect(mockElements.pageIndicator.textContent).toBe('Page 2 of 3');
      expect(mockElements.prevPage.disabled).toBe(false);
      expect(mockElements.nextPage.disabled).toBe(false);
    });

    test('should disable previous button on first page', () => {
      tableManager.currentPage = 1;

      tableManager.updatePaginationControls(3, 25);

      expect(mockElements.prevPage.disabled).toBe(true);
      expect(mockElements.nextPage.disabled).toBe(false);
    });

    test('should disable next button on last page', () => {
      tableManager.currentPage = 3;

      tableManager.updatePaginationControls(3, 25);

      expect(mockElements.prevPage.disabled).toBe(false);
      expect(mockElements.nextPage.disabled).toBe(true);
    });
  });

  describe('updateSortIndicators', () => {
    test('should update sort indicators on headers', () => {
      const mockHeaders = [
        { getAttribute: jest.fn(() => 'date'), classList: { remove: jest.fn(), add: jest.fn() } },
        { getAttribute: jest.fn(() => 'weight'), classList: { remove: jest.fn(), add: jest.fn() } }
      ];

      global.document.querySelectorAll.mockReturnValue(mockHeaders);
      tableManager.sortColumn = 'date';
      tableManager.sortDirection = 'desc';

      tableManager.updateSortIndicators();

      // All headers should have sort classes removed
      mockHeaders.forEach(header => {
        expect(header.classList.remove).toHaveBeenCalledWith('sort-asc', 'sort-desc');
      });

      // Date header should have current sort direction added
      expect(mockHeaders[0].classList.add).toHaveBeenCalledWith('sort-desc');
      expect(mockHeaders[1].classList.add).not.toHaveBeenCalled();
    });
  });

  describe('handleSort', () => {
    test('should toggle sort direction for same column', () => {
      const updateTableSpy = jest.spyOn(tableManager, 'updateTable').mockImplementation();
      const mockEvent = { target: { getAttribute: jest.fn(() => 'date') } };
      tableManager.sortColumn = 'date';
      tableManager.sortDirection = 'desc';

      tableManager.handleSort(mockEvent);

      expect(tableManager.sortDirection).toBe('asc');
      expect(updateTableSpy).toHaveBeenCalled();
    });

    test('should set new column and default direction', () => {
      const updateTableSpy = jest.spyOn(tableManager, 'updateTable').mockImplementation();
      const mockEvent = { target: { getAttribute: jest.fn(() => 'weight') } };
      tableManager.sortColumn = 'date';

      tableManager.handleSort(mockEvent);

      expect(tableManager.sortColumn).toBe('weight');
      expect(tableManager.sortDirection).toBe('desc');
      expect(updateTableSpy).toHaveBeenCalled();
    });
  });

  describe('previousPage', () => {
    test('should navigate to previous page', () => {
      const updateTableSpy = jest.spyOn(tableManager, 'updateTable').mockImplementation();
      tableManager.currentPage = 3;

      tableManager.previousPage();

      expect(tableManager.currentPage).toBe(2);
      expect(updateTableSpy).toHaveBeenCalled();
    });

    test('should not navigate below page 1', () => {
      const updateTableSpy = jest.spyOn(tableManager, 'updateTable').mockImplementation();
      tableManager.currentPage = 1;

      tableManager.previousPage();

      expect(tableManager.currentPage).toBe(1);
      expect(updateTableSpy).not.toHaveBeenCalled();
    });
  });

  describe('nextPage', () => {
    test('should navigate to next page', () => {
      const updateTableSpy = jest.spyOn(tableManager, 'updateTable').mockImplementation();
      tableManager.measurements = mockMeasurements;
      tableManager.itemsPerPage = 2;
      tableManager.currentPage = 1;

      tableManager.nextPage();

      expect(tableManager.currentPage).toBe(2);
      expect(updateTableSpy).toHaveBeenCalled();
    });

    test('should not navigate beyond last page', () => {
      const updateTableSpy = jest.spyOn(tableManager, 'updateTable').mockImplementation();
      tableManager.measurements = mockMeasurements;
      tableManager.itemsPerPage = 10;
      tableManager.currentPage = 1;

      tableManager.nextPage();

      expect(tableManager.currentPage).toBe(1);
      expect(updateTableSpy).not.toHaveBeenCalled();
    });
  });

  describe('handleSearch', () => {
    test('should reset to page 1 and update table', () => {
      const updateTableSpy = jest.spyOn(tableManager, 'updateTable').mockImplementation();
      tableManager.currentPage = 3;

      tableManager.handleSearch();

      expect(tableManager.currentPage).toBe(1);
      expect(updateTableSpy).toHaveBeenCalled();
    });
  });

  describe('editMeasurement', () => {
    test('should call onEdit callback with id', () => {
      const onEditMock = jest.fn();
      tableManager.onEdit = onEditMock;

      tableManager.editMeasurement('test-id');

      expect(onEditMock).toHaveBeenCalledWith('test-id');
    });

    test('should not error if no callback set', () => {
      expect(() => tableManager.editMeasurement('test-id')).not.toThrow();
    });
  });

  describe('deleteMeasurement', () => {
    test('should call onDelete callback with id', () => {
      const onDeleteMock = jest.fn();
      tableManager.onDelete = onDeleteMock;

      tableManager.deleteMeasurement('test-id');

      expect(onDeleteMock).toHaveBeenCalledWith('test-id');
    });

    test('should not error if no callback set', () => {
      expect(() => tableManager.deleteMeasurement('test-id')).not.toThrow();
    });
  });

  describe('getState', () => {
    test('should return current table state', () => {
      tableManager.measurements = mockMeasurements;
      tableManager.currentPage = 2;
      tableManager.sortColumn = 'weight';
      tableManager.sortDirection = 'asc';

      const state = tableManager.getState();

      expect(state).toEqual({
        currentPage: 2,
        itemsPerPage: 10,
        sortColumn: 'weight',
        sortDirection: 'asc',
        totalMeasurements: 3
      });
    });
  });

  describe('setState', () => {
    test('should set table state and update', () => {
      const updateTableSpy = jest.spyOn(tableManager, 'updateTable').mockImplementation();
      const newState = {
        currentPage: 3,
        itemsPerPage: 5,
        sortColumn: 'bodyFat',
        sortDirection: 'asc'
      };

      tableManager.setState(newState);

      expect(tableManager.currentPage).toBe(3);
      expect(tableManager.itemsPerPage).toBe(5);
      expect(tableManager.sortColumn).toBe('bodyFat');
      expect(tableManager.sortDirection).toBe('asc');
      expect(updateTableSpy).toHaveBeenCalled();
    });

    test('should handle partial state updates', () => {
      const updateTableSpy = jest.spyOn(tableManager, 'updateTable').mockImplementation();
      const originalPage = tableManager.currentPage;
      
      tableManager.setState({ sortColumn: 'leanMass' });

      expect(tableManager.sortColumn).toBe('leanMass');
      expect(tableManager.currentPage).toBe(originalPage);
      expect(updateTableSpy).toHaveBeenCalled();
    });
  });

  describe('updateTable integration', () => {
    let mockElements;

    beforeEach(() => {
      mockElements = {
        tableBody: {
          innerHTML: '',
          querySelectorAll: jest.fn(() => [
            { addEventListener: jest.fn() },
            { addEventListener: jest.fn() },
            { addEventListener: jest.fn() }
          ])
        },
        tableSearch: { value: '' },
        pageIndicator: { textContent: '' },
        prevPage: { disabled: false },
        nextPage: { disabled: false }
      };

      global.document.getElementById.mockImplementation((id) => mockElements[id]);
      global.document.querySelectorAll.mockReturnValue([]);
    });

    test('should handle complete table update flow', () => {
      tableManager.measurements = mockMeasurements;

      tableManager.updateTable();

      // Should have called all the necessary formatting methods
      expect(mockCalculationService.formatWeight).toHaveBeenCalled();
      expect(mockCalculationService.formatLeanMass).toHaveBeenCalled();
      
      // Should have updated pagination
      expect(mockElements.pageIndicator.textContent).toContain('Page 1 of 1');
      
      // Should have rendered table content
      expect(mockElements.tableBody.innerHTML).toContain('7/8/2025');
    });

    test('should filter data based on search term', () => {
      mockElements.tableSearch.value = '70.5';
      tableManager.measurements = mockMeasurements;

      tableManager.updateTable();

      // Should only show the measurement with weight 70.5
      const renderedContent = mockElements.tableBody.innerHTML;
      expect(renderedContent).toContain('7/7/2025'); // Only this date should be shown
      expect(renderedContent).not.toContain('7/8/2025');
      expect(renderedContent).not.toContain('7/6/2025');
    });
  });
});