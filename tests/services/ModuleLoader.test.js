const ModuleLoader = require('../../js/ModuleLoader');

describe('ModuleLoader', () => {
  let moduleLoader;
  let mockScript;

  beforeEach(() => {
    moduleLoader = new ModuleLoader();
    
    // Mock DOM elements
    mockScript = {
      src: '',
      onload: null,
      onerror: null
    };
    
    global.document = {
      createElement: jest.fn(() => mockScript),
      head: {
        appendChild: jest.fn()
      },
      querySelector: jest.fn(() => null)
    };
    
    global.window = {};
  });

  afterEach(() => {
    delete global.document;
    delete global.window;
  });

  describe('Constructor', () => {
    test('should initialize with empty maps', () => {
      expect(moduleLoader.modules).toBeInstanceOf(Map);
      expect(moduleLoader.loading).toBeInstanceOf(Map);
      expect(moduleLoader.modules.size).toBe(0);
      expect(moduleLoader.loading.size).toBe(0);
    });
  });

  describe('loadModule', () => {
    test('should load a module and add it to global scope', async () => {
      const className = 'TestModule';
      const mockClass = jest.fn();
      
      // Mock the module being available in global scope after loading
      global.window[className] = mockClass;
      
      const promise = moduleLoader.loadModule('test/path.js', className);
      
      // Simulate successful script loading
      mockScript.onload();
      
      const result = await promise;
      
      expect(result).toBe(mockClass);
      expect(moduleLoader.modules.get(className)).toBe(mockClass);
      expect(moduleLoader.loading.has(className)).toBe(false);
    });

    test('should return cached module if already loaded', async () => {
      const className = 'TestModule';
      const mockClass = jest.fn();
      
      // Pre-load the module
      moduleLoader.modules.set(className, mockClass);
      
      const result = await moduleLoader.loadModule('test/path.js', className);
      
      expect(result).toBe(mockClass);
      expect(global.document.createElement).not.toHaveBeenCalled();
    });

    test('should return loading promise if module is currently loading', async () => {
      const className = 'TestModule';
      const mockClass = jest.fn();
      
      // Mock the module being available in global scope
      global.window[className] = mockClass;
      
      // Start loading
      const promise1 = moduleLoader.loadModule('test/path.js', className);
      const promise2 = moduleLoader.loadModule('test/path.js', className);
      
      // Simulate successful script loading
      mockScript.onload();
      
      const [result1, result2] = await Promise.all([promise1, promise2]);
      
      expect(result1).toBe(mockClass);
      expect(result2).toBe(mockClass);
      expect(global.document.createElement).toHaveBeenCalledTimes(1);
    });

    test('should handle module not found in global scope', async () => {
      const className = 'NonExistentModule';
      
      const promise = moduleLoader.loadModule('test/path.js', className);
      
      // Simulate successful script loading but module not in global scope
      mockScript.onload();
      
      await expect(promise).rejects.toThrow(`Module ${className} not found in global scope after loading test/path.js`);
      expect(moduleLoader.loading.has(className)).toBe(false);
    });

    test('should handle script loading error', async () => {
      const className = 'TestModule';
      
      const promise = moduleLoader.loadModule('test/path.js', className);
      
      // Simulate script loading error
      mockScript.onerror();
      
      await expect(promise).rejects.toThrow('Failed to load script: test/path.js');
      expect(moduleLoader.loading.has(className)).toBe(false);
    });

    test('should not create duplicate script tags', async () => {
      const className = 'TestModule';
      const mockClass = jest.fn();
      
      // Mock existing script
      global.document.querySelector = jest.fn(() => ({ src: 'test/path.js' }));
      global.window[className] = mockClass;
      
      const result = await moduleLoader.loadModule('test/path.js', className);
      
      expect(result).toBe(mockClass);
      expect(global.document.createElement).not.toHaveBeenCalled();
    });
  });

  describe('isLoaded', () => {
    test('should return true for loaded modules', () => {
      const className = 'TestModule';
      const mockClass = jest.fn();
      
      moduleLoader.modules.set(className, mockClass);
      
      expect(moduleLoader.isLoaded(className)).toBe(true);
    });

    test('should return false for unloaded modules', () => {
      expect(moduleLoader.isLoaded('NonExistentModule')).toBe(false);
    });
  });

  describe('getModule', () => {
    test('should return module if loaded', () => {
      const className = 'TestModule';
      const mockClass = jest.fn();
      
      moduleLoader.modules.set(className, mockClass);
      
      expect(moduleLoader.getModule(className)).toBe(mockClass);
    });

    test('should return undefined for unloaded modules', () => {
      expect(moduleLoader.getModule('NonExistentModule')).toBeUndefined();
    });
  });

  describe('loadServices', () => {
    test('should load all required services including UnifiedGoalManager', async () => {
      const services = [
        'NotificationService',
        'CalculationService',
        'DataManager',
        'UIManager',
        'FormManager',
        'TableManager',
        'ChartManager',
        'GoalManager',
        'ImportExportManager',
        'InsightsManager',
        'UnifiedGoalManager'
      ];
      
      // Mock all services in global scope
      services.forEach(service => {
        global.window[service] = jest.fn();
      });
      
      // Mock loadModule to resolve immediately
      jest.spyOn(moduleLoader, 'loadModule').mockImplementation(async (path, className) => {
        moduleLoader.modules.set(className, global.window[className]);
        return global.window[className];
      });
      
      const result = await moduleLoader.loadServices();
      
      // Verify all services are loaded
      services.forEach(service => {
        expect(result).toHaveProperty(service);
        expect(result[service]).toBe(global.window[service]);
      });
      
      // Verify UnifiedGoalManager is specifically included
      expect(result.UnifiedGoalManager).toBeDefined();
      expect(moduleLoader.loadModule).toHaveBeenCalledWith(
        'js/features/UnifiedGoalManager.js',
        'UnifiedGoalManager'
      );
    });

    test('should handle service loading errors', async () => {
      jest.spyOn(moduleLoader, 'loadModule').mockImplementation(async () => {
        throw new Error('Service loading failed');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      await expect(moduleLoader.loadServices()).rejects.toThrow('Service loading failed');
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load services:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    test('should load services in parallel', async () => {
      const loadModuleSpy = jest.spyOn(moduleLoader, 'loadModule').mockImplementation(async (path, className) => {
        // Simulate async loading
        await new Promise(resolve => setTimeout(resolve, 10));
        global.window[className] = jest.fn();
        moduleLoader.modules.set(className, global.window[className]);
        return global.window[className];
      });
      
      const startTime = Date.now();
      await moduleLoader.loadServices();
      const endTime = Date.now();
      
      // Should complete faster than sequential loading (11 services * 10ms = 110ms)
      expect(endTime - startTime).toBeLessThan(50);
      expect(loadModuleSpy).toHaveBeenCalledTimes(11);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      const className = 'TestModule';
      
      const promise = moduleLoader.loadModule('test/path.js', className);
      
      // Simulate network error
      mockScript.onerror();
      
      await expect(promise).rejects.toThrow('Failed to load script: test/path.js');
    });

    test('should clean up loading state on error', async () => {
      const className = 'TestModule';
      
      const promise = moduleLoader.loadModule('test/path.js', className);
      
      expect(moduleLoader.loading.has(className)).toBe(true);
      
      // Simulate error
      mockScript.onerror();
      
      await expect(promise).rejects.toThrow();
      expect(moduleLoader.loading.has(className)).toBe(false);
    });
  });

  describe('Browser Compatibility', () => {
    test('should work with different script implementations', async () => {
      const className = 'TestModule';
      const mockClass = jest.fn();
      
      // Mock alternative script element
      const alternativeScript = {
        src: '',
        addEventListener: jest.fn(),
        setAttribute: jest.fn(),
        onload: null,
        onerror: null
      };
      
      global.document.createElement = jest.fn(() => alternativeScript);
      global.window[className] = mockClass;
      
      const promise = moduleLoader.loadModule('test/path.js', className);
      
      // Simulate successful loading
      alternativeScript.onload();
      
      const result = await promise;
      expect(result).toBe(mockClass);
    });
  });
});