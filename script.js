// ParkSahay - Parking Management System

// DOM Elements
const addZoneBtn = document.getElementById('add-zone-btn');
const zoneCreationArea = document.getElementById('zone-creation-area');
const zonesDisplay = document.getElementById('zones-display');
const parkingContainer = document.getElementById('parking-container');
const previewOverlay = document.getElementById('preview-overlay');
const previewNumbers = document.getElementById('preview-numbers');
const previewGridView = document.getElementById('preview-grid-view');
const previewTitle = document.getElementById('preview-title');
const previewToggle = document.getElementById('preview-toggle');
const gridRows = document.getElementById('grid-rows');
const gridCols = document.getElementById('grid-cols');
const zoneName = document.getElementById('zone-name');
const createZoneBtn = document.getElementById('create-zone-btn');
const cancelCreateBtn = document.getElementById('cancel-create');
const themeToggle = document.getElementById('theme-toggle');

// State variables
let currentPreviewMode = 'numbers'; // 'numbers' or 'grid'
let currentTheme = localStorage.getItem('theme') || 'light';

// Event Listeners
addZoneBtn.addEventListener('click', showZoneCreationArea);
cancelCreateBtn.addEventListener('click', hideZoneCreationArea);
createZoneBtn.addEventListener('click', handleCreateZone);
document.querySelector('.close-btn').addEventListener('click', hidePreviewOverlay);
previewToggle.addEventListener('click', togglePreviewMode);
themeToggle.addEventListener('click', toggleTheme);

// Initialize on page load
document.addEventListener('DOMContentLoaded', initialize);

/**
 * Initialize the application
 */
function initialize() {
  // Apply saved theme
  applyTheme(currentTheme);

  // Hide creation area initially
  hideZoneCreationArea();

  // Hide preview overlay
  hidePreviewOverlay();

  // Load saved zones
  loadFromLocalStorage();
}

/**
 * Toggle between light and dark themes
 */
function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(currentTheme);
  localStorage.setItem('theme', currentTheme);
}

/**
 * Apply the specified theme to the document
 * @param {string} theme - The theme to apply ('light' or 'dark')
 */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);

  // Update theme toggle icon
  const themeIcon = themeToggle.querySelector('.material-symbols-rounded');
  if (theme === 'dark') {
    themeIcon.textContent = 'light_mode';
    themeToggle.title = 'Switch to Light Mode';
  } else {
    themeIcon.textContent = 'dark_mode';
    themeToggle.title = 'Switch to Dark Mode';
  }
}

/**
 * Toggle between preview modes (numbers or grid)
 */
function togglePreviewMode() {
  currentPreviewMode = currentPreviewMode === 'numbers' ? 'grid' : 'numbers';

  if (currentPreviewMode === 'numbers') {
    previewNumbers.classList.remove('hidden');
    previewGridView.classList.add('hidden');
    previewToggle.querySelector('.material-symbols-rounded').textContent = 'grid_view';
    previewToggle.title = 'Switch to Grid View';
  } else {
    previewNumbers.classList.add('hidden');
    previewGridView.classList.remove('hidden');
    previewToggle.querySelector('.material-symbols-rounded').textContent = 'format_list_numbered';
    previewToggle.title = 'Switch to Numbers View';
  }
}

/**
 * Show the zone creation area
 */
function showZoneCreationArea() {
  zoneCreationArea.classList.remove('hidden');
  zonesDisplay.style.opacity = '0.5';
  zoneName.focus();
}

/**
 * Hide the zone creation area
 */
function hideZoneCreationArea() {
  zoneCreationArea.classList.add('hidden');
  zonesDisplay.style.opacity = '1';

  // Reset form
  zoneName.value = '';
  gridRows.value = '3';
  gridCols.value = '3';
}

/**
 * Handle the create zone button click
 */
function handleCreateZone() {
  const name = zoneName.value.trim();
  const rows = parseInt(gridRows.value) || 3;
  const cols = parseInt(gridCols.value) || 3;

  if (!name) {
    alert('Please enter a zone name');
    zoneName.focus();
    return;
  }

  if (rows < 1 || cols < 1 || rows > 20 || cols > 20) {
    alert('Grid dimensions must be between 1 and 20');
    return;
  }

  createZone(name, rows, cols);
  hideZoneCreationArea();
}

/**
 * Create a new parking zone
 * @param {string} name - Zone name
 * @param {number} rows - Number of rows
 * @param {number} cols - Number of columns
 */
function createZone(name, rows, cols) {
  const gridSize = rows * cols;
  const zone = document.createElement('div');
  zone.className = 'zone';

  // Create zone structure
  zone.innerHTML = `
    <div class="zone-header">
      <h2>${name}</h2>
      <div class="zone-actions">
        <span class="count">0 / ${gridSize}</span>
        <button class="zone-btn preview-zone-btn" title="Preview Available Slots">
          <span class="material-symbols-rounded">visibility</span>
        </button>
        <button class="zone-btn delete-zone-btn" title="Delete Zone">
          <span class="material-symbols-rounded">delete</span>
        </button>
      </div>
    </div>
    <div class="grid"></div>
    <div class="zone-controls">
      <button class="zone-control-btn add-slot-btn">
        <span class="material-symbols-rounded">add_circle</span>
        Add Slot
      </button>
    </div>
  `;

  // Set up grid
  const grid = zone.querySelector('.grid');
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  // Create empty cells
  for (let i = 0; i < gridSize; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    setupCellDropzone(cell);
    grid.appendChild(cell);
  }

  // Add event listeners
  zone.querySelector('.add-slot-btn').addEventListener('click', () => {
    addSlotToZone(zone);
  });

  zone.querySelector('.delete-zone-btn').addEventListener('click', () => {
    if (confirm(`Are you sure you want to delete the "${name}" zone?`)) {
      zone.remove();
      saveToLocalStorage();
    }
  });

  zone.querySelector('.preview-zone-btn').addEventListener('click', () => {
    showZonePreview(zone);
  });

  // Add to container
  parkingContainer.appendChild(zone);
  updateZoneCounts();
  saveToLocalStorage();
}

/**
 * Add a parking slot to a zone
 * @param {HTMLElement} zone - The zone element
 */
function addSlotToZone(zone) {
  // Find an empty cell
  let emptyCell = Array.from(zone.querySelectorAll('.cell')).find(cell => !cell.querySelector('.slot'));

  if (!emptyCell) {
    alert('No empty cells available. All parking slots are filled.');
    return;
  }

  // Get the next slot number
  const existingSlots = zone.querySelectorAll('.slot');
  const nextSlotNumber = existingSlots.length + 1;

  // Create the slot
  const slot = document.createElement('div');
  slot.className = 'slot available';
  slot.setAttribute('draggable', 'true');
  slot.textContent = nextSlotNumber;

  // Add to cell
  emptyCell.appendChild(slot);
  attachSlotEvents(slot);

  // Update UI
  updateZoneCounts();
  saveToLocalStorage();
}

/**
 * Attach events to a slot element
 * @param {HTMLElement} slot - The slot element
 */
function attachSlotEvents(slot) {
  // Toggle availability on click
  slot.addEventListener('click', () => {
    slot.classList.toggle('occupied');
    slot.classList.toggle('available');
    updateZoneCounts();
    saveToLocalStorage();
  });

  // Remove on right-click
  slot.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (confirm('Remove this parking slot?')) {
      slot.remove();
      updateZoneCounts();
      saveToLocalStorage();
    }
  });

  // Drag functionality
  slot.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', slot.outerHTML);
    slot.classList.add('dragging');
    setTimeout(() => {
      slot.remove();
      updateZoneCounts();
      saveToLocalStorage();
    }, 0);
  });
}

/**
 * Set up a cell as a drop zone for slots
 * @param {HTMLElement} cell - The cell element
 */
function setupCellDropzone(cell) {
  cell.addEventListener('dragover', (e) => {
    e.preventDefault();
    cell.classList.add('drag-over');
  });

  cell.addEventListener('dragleave', () => {
    cell.classList.remove('drag-over');
  });

  cell.addEventListener('drop', (e) => {
    e.preventDefault();
    cell.classList.remove('drag-over');

    if (!cell.querySelector('.slot')) {
      const data = e.dataTransfer.getData('text/plain');
      cell.innerHTML = data;
      const droppedSlot = cell.querySelector('.slot');
      droppedSlot.classList.remove('dragging');
      attachSlotEvents(droppedSlot);
      updateZoneCounts();
      saveToLocalStorage();
    }
  });
}

/**
 * Update the count displays for all zones
 */
function updateZoneCounts() {
  document.querySelectorAll('.zone').forEach(zone => {
    const total = zone.querySelectorAll('.cell').length;
    const available = zone.querySelectorAll('.slot.available').length;
    const countSpan = zone.querySelector('.count');
    countSpan.textContent = `${available} / ${total}`;
  });
}

/**
 * Show the preview overlay for a zone
 * @param {HTMLElement} zone - The zone element
 */
function showZonePreview(zone) {
  const zoneName = zone.querySelector('h2').textContent;
  const availableSlots = zone.querySelectorAll('.slot.available');
  // We need both available and occupied slots for the grid view
  const grid = zone.querySelector('.grid');

  // Set title
  previewTitle.textContent = `${zoneName} - ${availableSlots.length} Available Slots`;

  // Clear previous previews
  previewNumbers.innerHTML = '';
  previewGridView.innerHTML = '';

  // Create numbers preview (just a big number showing available slots count)
  const bigNumber = document.createElement('div');
  bigNumber.className = 'big-number';
  bigNumber.textContent = availableSlots.length;
  previewNumbers.appendChild(bigNumber);

  // Create grid preview (full grid structure with both available and occupied slots)
  // Get the number of columns from the original grid
  const colsMatch = grid.style.gridTemplateColumns.match(/repeat\((\d+)/);
  const cols = colsMatch ? colsMatch[1] : 3; // Default to 3 if parsing fails
  previewGridView.style.gridTemplateColumns = `repeat(${cols}, 120px)`;

  // Get all cells from the original grid
  const cells = Array.from(grid.querySelectorAll('.cell'));

  cells.forEach(cell => {
    const cellClone = document.createElement('div');
    cellClone.className = 'cell';

    const slot = cell.querySelector('.slot');
    if (slot) {
      const slotClone = document.createElement('div');
      slotClone.className = slot.className; // Copy all classes including available/occupied
      slotClone.textContent = slot.textContent;
      cellClone.appendChild(slotClone);
    }

    previewGridView.appendChild(cellClone);
  });

  // Show the appropriate preview based on current mode
  if (currentPreviewMode === 'numbers') {
    previewNumbers.classList.remove('hidden');
    previewGridView.classList.add('hidden');
  } else {
    previewNumbers.classList.add('hidden');
    previewGridView.classList.remove('hidden');
  }

  // Show the overlay
  previewOverlay.classList.remove('hidden');
}

/**
 * Hide the preview overlay
 */
function hidePreviewOverlay() {
  previewOverlay.classList.add('hidden');
}

/**
 * Save all zones to localStorage
 */
function saveToLocalStorage() {
  const zoneData = [];

  document.querySelectorAll('.zone').forEach(zone => {
    const zoneName = zone.querySelector('h2').textContent.trim();
    const grid = zone.querySelector('.grid');

    // Get grid dimensions
    let cols = 3; // Default
    const gridStyle = grid.style.gridTemplateColumns;
    if (gridStyle) {
      const match = gridStyle.match(/repeat\((\d+)/i);
      if (match && match[1]) {
        cols = parseInt(match[1]);
      }
    }

    // Get cell data
    const cells = Array.from(zone.querySelectorAll('.cell')).map(cell => {
      const slot = cell.querySelector('.slot');
      if (slot) {
        return {
          number: slot.textContent.trim(),
          type: slot.classList.contains('occupied') ? 'occupied' : 'available'
        };
      } else {
        return null;
      }
    });

    // Calculate rows
    const rows = Math.ceil(cells.length / cols);

    zoneData.push({
      name: zoneName,
      cells,
      cols,
      rows
    });
  });

  localStorage.setItem('zones', JSON.stringify(zoneData));
}

/**
 * Load zones from localStorage
 */
function loadFromLocalStorage() {
  const saved = JSON.parse(localStorage.getItem('zones'));
  if (!saved || !saved.length) return;

  parkingContainer.innerHTML = '';

  saved.forEach(zone => {
    // Get dimensions
    const cols = zone.cols || 3;
    const rows = zone.rows || Math.ceil((zone.cells?.length || 0) / cols);

    // Create zone
    createZone(zone.name, rows, cols);

    // Get the created zone
    const zoneEl = parkingContainer.lastElementChild;
    const cells = zoneEl.querySelectorAll('.cell');

    // Populate cells with saved data
    if (zone.cells && zone.cells.length > 0) {
      zone.cells.forEach((cellData, index) => {
        if (index < cells.length && cellData) {
          const cell = cells[index];
          const slot = document.createElement('div');
          slot.className = `slot ${cellData.type}`;
          slot.setAttribute('draggable', 'true');
          slot.textContent = cellData.number;
          cell.appendChild(slot);
          attachSlotEvents(slot);
        }
      });
    }

    // Update counts
    updateZoneCounts();
  });
}