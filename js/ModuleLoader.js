class ModuleLoader {
  constructor() {
    this.modules = new Map();
    this.loading = new Map();
  }

  async loadModule(path, className) {
    if (this.modules.has(className)) {
      return this.modules.get(className);
    }

    if (this.loading.has(className)) {
      return this.loading.get(className);
    }

    const promise = this._loadScript(path).then(() => {
      const ModuleClass = window[className];
      if (!ModuleClass) {
        throw new Error(`Module ${className} not found in global scope after loading ${path}`);
      }
      this.modules.set(className, ModuleClass);
      return ModuleClass;
    });

    this.loading.set(className, promise);
    
    try {
      const result = await promise;
      this.loading.delete(className);
      return result;
    } catch (error) {
      this.loading.delete(className);
      throw error;
    }
  }

  _loadScript(src) {
    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  }

  isLoaded(className) {
    return this.modules.has(className);
  }

  getModule(className) {
    return this.modules.get(className);
  }

  async loadServices() {
    try {
      await Promise.all([
        this.loadModule('js/services/NotificationService.js', 'NotificationService'),
        this.loadModule('js/services/CalculationService.js', 'CalculationService'),
        this.loadModule('js/services/DataManager.js', 'DataManager'),
        this.loadModule('js/ui/UIManager.js', 'UIManager'),
        this.loadModule('js/ui/FormManager.js', 'FormManager'),
        this.loadModule('js/ui/TableManager.js', 'TableManager'),
        this.loadModule('js/ui/ChartManager.js', 'ChartManager'),
        this.loadModule('js/features/GoalManager.js', 'GoalManager'),
        this.loadModule('js/features/ImportExportManager.js', 'ImportExportManager'),
        this.loadModule('js/features/InsightsManager.js', 'InsightsManager'),
        this.loadModule('js/features/UnifiedGoalManager.js', 'UnifiedGoalManager')
      ]);
      return {
        NotificationService: this.getModule('NotificationService'),
        CalculationService: this.getModule('CalculationService'),
        DataManager: this.getModule('DataManager'),
        UIManager: this.getModule('UIManager'),
        FormManager: this.getModule('FormManager'),
        TableManager: this.getModule('TableManager'),
        ChartManager: this.getModule('ChartManager'),
        GoalManager: this.getModule('GoalManager'),
        ImportExportManager: this.getModule('ImportExportManager'),
        InsightsManager: this.getModule('InsightsManager'),
        UnifiedGoalManager: this.getModule('UnifiedGoalManager')
      };
    } catch (error) {
      console.error('Failed to load services:', error);
      throw error;
    }
  }
}

if (typeof window !== 'undefined') {
  window.ModuleLoader = ModuleLoader;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModuleLoader;
}