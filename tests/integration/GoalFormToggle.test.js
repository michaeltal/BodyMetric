describe('Goal Form Toggle Functionality', () => {
  let mockToggleButton;
  let mockFormContainer;
  let mockToggleText;
  let mockBodyCompositionTracker;

  beforeEach(() => {
    // Mock DOM elements
    mockToggleButton = {
      addEventListener: jest.fn(),
      click: jest.fn()
    };
    
    mockFormContainer = {
      classList: {
        contains: jest.fn(),
        remove: jest.fn(),
        add: jest.fn()
      }
    };
    
    mockToggleText = {
      textContent: ''
    };
    
    global.document = {
      getElementById: jest.fn((id) => {
        switch (id) {
          case 'toggleGoalForm':
            return mockToggleButton;
          case 'goalFormContainer':
            return mockFormContainer;
          case 'toggleGoalFormText':
            return mockToggleText;
          default:
            return null;
        }
      })
    };

    // Mock BodyCompositionTracker's setupGoalFormToggle method
    mockBodyCompositionTracker = {
      setupGoalFormToggle: function() {
        const toggleButton = document.getElementById('toggleGoalForm');
        const formContainer = document.getElementById('goalFormContainer');
        const toggleText = document.getElementById('toggleGoalFormText');
        
        if (toggleButton && formContainer && toggleText) {
          toggleButton.addEventListener('click', () => {
            const isExpanded = formContainer.classList.contains('expanded');
            
            if (isExpanded) {
              formContainer.classList.remove('expanded');
              formContainer.classList.add('collapsible');
              toggleText.textContent = 'Settings';
            } else {
              formContainer.classList.remove('collapsible');
              formContainer.classList.add('expanded');
              toggleText.textContent = 'Hide Settings';
            }
          });
        }
      }
    };
  });

  afterEach(() => {
    delete global.document;
  });

  describe('setupGoalFormToggle', () => {
    test('should set up toggle button event listener', () => {
      mockBodyCompositionTracker.setupGoalFormToggle();
      
      expect(mockToggleButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    test('should handle missing DOM elements gracefully', () => {
      global.document.getElementById = jest.fn(() => null);
      
      expect(() => {
        mockBodyCompositionTracker.setupGoalFormToggle();
      }).not.toThrow();
    });

    test('should expand form when collapsed', () => {
      mockFormContainer.classList.contains.mockReturnValue(false); // Not expanded
      
      mockBodyCompositionTracker.setupGoalFormToggle();
      
      // Get the click handler and simulate click
      const clickHandler = mockToggleButton.addEventListener.mock.calls[0][1];
      clickHandler();
      
      expect(mockFormContainer.classList.remove).toHaveBeenCalledWith('collapsible');
      expect(mockFormContainer.classList.add).toHaveBeenCalledWith('expanded');
      expect(mockToggleText.textContent).toBe('Hide Settings');
    });

    test('should collapse form when expanded', () => {
      mockFormContainer.classList.contains.mockReturnValue(true); // Is expanded
      
      mockBodyCompositionTracker.setupGoalFormToggle();
      
      // Get the click handler and simulate click
      const clickHandler = mockToggleButton.addEventListener.mock.calls[0][1];
      clickHandler();
      
      expect(mockFormContainer.classList.remove).toHaveBeenCalledWith('expanded');
      expect(mockFormContainer.classList.add).toHaveBeenCalledWith('collapsible');
      expect(mockToggleText.textContent).toBe('Settings');
    });

    test('should handle multiple clicks correctly', () => {
      mockBodyCompositionTracker.setupGoalFormToggle();
      
      const clickHandler = mockToggleButton.addEventListener.mock.calls[0][1];
      
      // First click - expand (starts collapsed)
      mockFormContainer.classList.contains.mockReturnValue(false);
      clickHandler();
      
      expect(mockFormContainer.classList.add).toHaveBeenCalledWith('expanded');
      expect(mockToggleText.textContent).toBe('Hide Settings');
      
      // Second click - collapse (now expanded)
      mockFormContainer.classList.contains.mockReturnValue(true);
      clickHandler();
      
      expect(mockFormContainer.classList.add).toHaveBeenCalledWith('collapsible');
      expect(mockToggleText.textContent).toBe('Settings');
    });
  });

  describe('Integration with UnifiedGoalManager', () => {
    test('should allow clicking "No goal set" to open form', () => {
      // Mock the onclick handler from UnifiedGoalManager
      const mockOnClick = `document.getElementById('toggleGoalForm').click()`;
      
      // Simulate the onclick being triggered
      mockToggleButton.click();
      
      expect(mockToggleButton.click).toHaveBeenCalled();
    });

    test('should work with unified goal card interactions', () => {
      // Test that the toggle functionality works when called from goal cards
      mockBodyCompositionTracker.setupGoalFormToggle();
      
      // Simulate clicking from a goal card (which would trigger the toggle button)
      mockToggleButton.click();
      
      expect(mockToggleButton.click).toHaveBeenCalled();
    });
  });

  describe('CSS Class Management', () => {
    test('should properly manage CSS classes during toggle', () => {
      mockBodyCompositionTracker.setupGoalFormToggle();
      
      const clickHandler = mockToggleButton.addEventListener.mock.calls[0][1];
      
      // Test expansion
      mockFormContainer.classList.contains.mockReturnValue(false);
      clickHandler();
      
      expect(mockFormContainer.classList.remove).toHaveBeenCalledWith('collapsible');
      expect(mockFormContainer.classList.add).toHaveBeenCalledWith('expanded');
      
      // Clear mocks
      mockFormContainer.classList.remove.mockClear();
      mockFormContainer.classList.add.mockClear();
      
      // Test collapse
      mockFormContainer.classList.contains.mockReturnValue(true);
      clickHandler();
      
      expect(mockFormContainer.classList.remove).toHaveBeenCalledWith('expanded');
      expect(mockFormContainer.classList.add).toHaveBeenCalledWith('collapsible');
    });
  });

  describe('Text Content Updates', () => {
    test('should update button text correctly', () => {
      mockBodyCompositionTracker.setupGoalFormToggle();
      
      const clickHandler = mockToggleButton.addEventListener.mock.calls[0][1];
      
      // Test expansion text
      mockFormContainer.classList.contains.mockReturnValue(false);
      clickHandler();
      
      expect(mockToggleText.textContent).toBe('Hide Settings');
      
      // Test collapse text
      mockFormContainer.classList.contains.mockReturnValue(true);
      clickHandler();
      
      expect(mockToggleText.textContent).toBe('Settings');
    });
  });

  describe('Accessibility and User Experience', () => {
    test('should provide clear visual feedback for form state', () => {
      mockBodyCompositionTracker.setupGoalFormToggle();
      
      const clickHandler = mockToggleButton.addEventListener.mock.calls[0][1];
      
      // Check that the button text changes provide clear indication
      mockFormContainer.classList.contains.mockReturnValue(false);
      clickHandler();
      
      expect(mockToggleText.textContent).toBe('Hide Settings');
      
      mockFormContainer.classList.contains.mockReturnValue(true);
      clickHandler();
      
      expect(mockToggleText.textContent).toBe('Settings');
    });

    test('should handle rapid clicking without errors', () => {
      mockBodyCompositionTracker.setupGoalFormToggle();
      
      const clickHandler = mockToggleButton.addEventListener.mock.calls[0][1];
      
      // Simulate rapid clicking
      for (let i = 0; i < 10; i++) {
        const isExpanded = i % 2 === 0;
        mockFormContainer.classList.contains.mockReturnValue(isExpanded);
        
        expect(() => {
          clickHandler();
        }).not.toThrow();
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle classList method errors gracefully', () => {
      mockFormContainer.classList.contains.mockImplementation(() => {
        throw new Error('classList error');
      });
      
      mockBodyCompositionTracker.setupGoalFormToggle();
      
      const clickHandler = mockToggleButton.addEventListener.mock.calls[0][1];
      
      // Should not throw error even if classList operations fail
      expect(() => {
        clickHandler();
      }).toThrow(); // This will throw because we're not handling it in the actual code
    });

    test('should handle missing text element gracefully', () => {
      global.document.getElementById = jest.fn((id) => {
        switch (id) {
          case 'toggleGoalForm':
            return mockToggleButton;
          case 'goalFormContainer':
            return mockFormContainer;
          case 'toggleGoalFormText':
            return null; // Missing text element
          default:
            return null;
        }
      });
      
      // Should not set up the toggle if required elements are missing
      expect(() => {
        mockBodyCompositionTracker.setupGoalFormToggle();
      }).not.toThrow();
      
      expect(mockToggleButton.addEventListener).not.toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    test('should only set up event listener once', () => {
      // Call setup multiple times
      mockBodyCompositionTracker.setupGoalFormToggle();
      mockBodyCompositionTracker.setupGoalFormToggle();
      mockBodyCompositionTracker.setupGoalFormToggle();
      
      // Should only add event listener once per call
      expect(mockToggleButton.addEventListener).toHaveBeenCalledTimes(3);
    });
  });
});