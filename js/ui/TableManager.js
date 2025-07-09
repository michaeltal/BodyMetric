/**
 * TableManager - Handles table display, sorting, pagination, and search
 * 
 * Responsibilities:
 * - Render measurement data in table format
 * - Handle column sorting with visual indicators
 * - Manage pagination controls and navigation
 * - Filter data based on search terms
 * - Handle table row actions (edit/delete)
 * - Display empty states appropriately
 * - Format data according to current units
 */
class TableManager {
  constructor(calculationService) {
    this.calculationService = calculationService;
    this.measurements = [];
    this.currentPage = 1;
    this.itemsPerPage = 10;
    this.sortColumn = 'date';
    this.sortDirection = 'desc';
    this.useMetric = true;
    
    // Callbacks for app updates
    this.onEdit = null;
    this.onDelete = null;
  }

  /**
   * Initialize TableManager with current data
   */
  initialize(measurements, useMetric) {
    this.measurements = measurements;
    this.useMetric = useMetric;
    this.currentPage = 1;
    this.updateTable();
  }

  /**
   * Set callbacks for table actions
   */
  setCallbacks(callbacks) {
    this.onEdit = callbacks.onEdit;
    this.onDelete = callbacks.onDelete;
  }

  /**
   * Update measurements data and refresh table
   */
  updateMeasurements(measurements) {
    this.measurements = measurements;
    this.updateTable();
  }

  /**
   * Update unit system and refresh table
   */
  updateUnits(useMetric) {
    this.useMetric = useMetric;
    this.updateTable();
  }

  /**
   * Main table update method - handles filtering, sorting, pagination, and rendering
   */
  updateTable() {
    const tbody = document.getElementById('tableBody');
    const searchTerm = document.getElementById('tableSearch').value.toLowerCase();
    
    let filteredData = this.measurements.filter(measurement => {
      return measurement.date.includes(searchTerm) ||
             measurement.weight.toString().includes(searchTerm) ||
             measurement.bodyFat.toString().includes(searchTerm) ||
             measurement.leanMass.toString().includes(searchTerm);
    });
    
    // Sort data
    filteredData = this.sortData(filteredData);
    
    // Handle pagination
    const paginationData = this.handlePagination(filteredData);
    
    // Render table rows
    this.renderTableRows(tbody, paginationData.pageData);
    
    // Update pagination controls
    this.updatePaginationControls(paginationData.totalPages, filteredData.length);
    
    // Update sort indicators
    this.updateSortIndicators();
  }

  /**
   * Sort data based on current sort column and direction
   */
  sortData(data) {
    return data.sort((a, b) => {
      let aVal = a[this.sortColumn];
      let bVal = b[this.sortColumn];
      
      if (this.sortColumn === 'date') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (this.sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }

  /**
   * Handle pagination calculations and page bounds
   */
  handlePagination(filteredData) {
    const totalPages = Math.max(1, Math.ceil(filteredData.length / this.itemsPerPage));

    if (this.currentPage > totalPages) {
      this.currentPage = totalPages;
    }

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);

    return { totalPages, pageData };
  }

  /**
   * Render table rows with measurement data
   */
  renderTableRows(tbody, pageData) {
    if (pageData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-state">
            <p>No measurements found</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = pageData.map(measurement => `
      <tr>
        <td>${new Date(measurement.date).toLocaleDateString()}</td>
        <td>${this.calculationService.formatWeight(measurement.weight, this.useMetric)} ${this.useMetric ? 'kg' : 'lbs'}</td>
        <td>${measurement.bodyFat.toFixed(1)}%</td>
        <td>${this.calculationService.formatLeanMass(measurement.leanMass, this.useMetric)} ${this.useMetric ? 'kg' : 'lbs'}</td>
        <td>
          <div class="action-buttons">
            <button class="action-btn action-btn--edit">Edit</button>
            <button class="action-btn action-btn--delete">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');

    // Add event listeners to the buttons
    tbody.querySelectorAll('.action-btn--edit').forEach((button, index) => {
      button.addEventListener('click', () => this.editMeasurement(pageData[index].id));
    });

    tbody.querySelectorAll('.action-btn--delete').forEach((button, index) => {
      button.addEventListener('click', () => this.deleteMeasurement(pageData[index].id));
    });
  }

  /**
   * Update pagination control states and labels
   */
  updatePaginationControls(totalPages, totalItems) {
    document.getElementById('pageIndicator').textContent = `Page ${this.currentPage} of ${totalPages}`;
    document.getElementById('prevPage').disabled = this.currentPage === 1;
    const disableNext = this.currentPage === totalPages || (totalPages === 1 && totalItems === 0);
    document.getElementById('nextPage').disabled = disableNext;
  }

  /**
   * Update visual sort indicators on column headers
   */
  updateSortIndicators() {
    document.querySelectorAll('[data-sort]').forEach(header => {
      header.classList.remove('sort-asc', 'sort-desc');
      if (header.getAttribute('data-sort') === this.sortColumn) {
        header.classList.add(`sort-${this.sortDirection}`);
      }
    });
  }

  /**
   * Handle column header click for sorting
   */
  handleSort(e) {
    const column = e.target.getAttribute('data-sort');
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'desc';
    }
    this.updateTable();
  }

  /**
   * Navigate to previous page
   */
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateTable();
    }
  }

  /**
   * Navigate to next page
   */
  nextPage() {
    const totalPages = Math.ceil(this.measurements.length / this.itemsPerPage);
    if (this.currentPage < totalPages) {
      this.currentPage++;
      this.updateTable();
    }
  }

  /**
   * Handle search input - reset to first page and update table
   */
  handleSearch() {
    this.currentPage = 1;
    this.updateTable();
  }

  /**
   * Handle edit button click - delegate to callback
   */
  editMeasurement(id) {
    if (this.onEdit) {
      this.onEdit(id);
    }
  }

  /**
   * Handle delete button click - delegate to callback
   */
  deleteMeasurement(id) {
    if (this.onDelete) {
      this.onDelete(id);
    }
  }

  /**
   * Get current table state for external use
   */
  getState() {
    return {
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection,
      totalMeasurements: this.measurements.length
    };
  }

  /**
   * Set table state from external source
   */
  setState(state) {
    if (state.currentPage) this.currentPage = state.currentPage;
    if (state.itemsPerPage) this.itemsPerPage = state.itemsPerPage;
    if (state.sortColumn) this.sortColumn = state.sortColumn;
    if (state.sortDirection) this.sortDirection = state.sortDirection;
    this.updateTable();
  }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TableManager;
}

// Make available in global scope for browser
if (typeof window !== 'undefined') {
  window.TableManager = TableManager;
}