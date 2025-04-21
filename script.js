
document.getElementById("add-zone-btn").addEventListener("click", addZone);

function addSlotToZone(zone) {
  let emptyCell = zone.querySelector(".cell:not(:has(.slot))");

  if (!emptyCell) {
    const newCell = document.createElement("div");
    newCell.className = "cell";
    setupCellDropzone(newCell);
    zone.querySelector(".grid").appendChild(newCell);
    emptyCell = newCell;
  }

  // 🔢 Get the next number based on how many slots are already in this zone
  const existingSlots = zone.querySelectorAll(".slot");
  const nextSlotNumber = existingSlots.length + 1;

  const slot = document.createElement("div");
  slot.className = "slot available";
  slot.setAttribute("draggable", "true");
  slot.textContent = nextSlotNumber;

  emptyCell.appendChild(slot);
  attachSlotEvents(slot);
  updateZoneCounts();
  saveToLocalStorage();
}
function addZone() {
  const zoneName = prompt("Enter Zone Name:");
  if (!zoneName) return;
  
  const layout = prompt("Enter grid layout (e.g., 5x5 or 10x4):");
  const [rows, cols] = layout.split("x").map(Number);
  if (!rows || !cols || rows < 1 || cols < 1) {
    alert("Invalid layout. Use format like 5x5 or 10x4.");
    return;
  }

  const gridSize = rows * cols;
  const zone = document.createElement("div");
  zone.className = "zone";

  zone.innerHTML = `
  <div class="zone-header">
    <h2>${zoneName}</h2>
    <span class="count">0 / ${gridSize}</span>
    <button class="delete-zone-btn" style="margin-left: 10px;">❌</button>
  </div>
  <button class="add-slot-btn">Add Slot</button>
  <button class="preview-zone-btn">👁️ Preview</button>
  <div class="grid"></div>
`;

  const grid = zone.querySelector(".grid");
  for (let i = 0; i < gridSize; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    setupCellDropzone(cell);
    grid.appendChild(cell);
  }

  // ➕ Add slot functionality
  zone.querySelector(".add-slot-btn").addEventListener("click", () => {
    addSlotToZone(zone);
  });

  // ❌ Delete zone functionality
  zone.querySelector(".delete-zone-btn").addEventListener("click", () => {
    if (confirm("Are you sure you want to delete this zone?")) {
      zone.remove();
      saveToLocalStorage();
      updateZoneCounts();
    }
  });

  document.getElementById("parking-container").appendChild(zone);

  updateZoneCounts();
  saveToLocalStorage();
}


        function attachSlotEvents(slot) {
          // Toggle color on click
          slot.addEventListener("click", () => {
            slot.classList.toggle("occupied");
            slot.classList.toggle("available");
            updateZoneCounts();
            saveToLocalStorage();
          });
        
          // Remove on right click
          slot.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            if (confirm("Remove this slot?")) {
              slot.remove();
              updateZoneCounts();
              saveToLocalStorage();
            }
          });
        
          // Drag functionality
          slot.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", slot.outerHTML);
            setTimeout(() => slot.remove(), 0);
          });
        }
        
        // Drag and drop setup
        function setupCellDropzones() {
            document.querySelectorAll(".cell").forEach(setupCellDropzone);
        }

        function setupCellDropzone(cell) {
          cell.addEventListener("dragover", e => e.preventDefault());
          cell.addEventListener("drop", e => {
            e.preventDefault();
            if (!cell.querySelector(".slot")) {
              const data = e.dataTransfer.getData("text/plain");
              cell.innerHTML = data;
              const droppedSlot = cell.querySelector(".slot");
              attachSlotEvents(droppedSlot);
              updateZoneCounts();
              saveToLocalStorage();
            }
          });
        }

        
        // Count updates
        function updateZoneCounts() {
          document.querySelectorAll(".zone").forEach(zone => {
            const total = zone.querySelectorAll(".cell").length;
            const available = zone.querySelectorAll(".slot.available").length;
            const countSpan = zone.querySelector(".count");
            countSpan.textContent = `${available} / ${total}`;
          });
        }
        
        // Save layout to localStorage
        function saveToLocalStorage() {
          const zoneData = [];
        
          document.querySelectorAll(".zone").forEach(zone => {
            const zoneName = zone.querySelector("h2").textContent.trim();
            const cells = Array.from(zone.querySelectorAll(".cell")).map(cell => {
              const slot = cell.querySelector(".slot");
              if (slot) {
                return {
                  number: slot.textContent.trim(),
                  type: slot.classList.contains("occupied") ? "occupied" : "available"
                };
              } else {
                return null;
              }
            });
        
            zoneData.push({ name: zoneName, cells });
          });
        
          localStorage.setItem("zones", JSON.stringify(zoneData));
        }
        
        // Load from localStorage
        function loadFromLocalStorage() {
          const saved = JSON.parse(localStorage.getItem("zones"));
          if (!saved) return;
                
          const container = document.getElementById("parking-container");
          container.innerHTML = "";
                
          saved.forEach(zone => {
            const zoneEl = document.createElement("div");
            zoneEl.className = "zone";
        
            zoneEl.innerHTML = `
              <div class="zone-header">
                <h2>${zone.name}</h2>
                <span class="count"></span>
                <button class="delete-zone-btn" style="margin-left: 10px;">❌</button>
              </div>
              <button class="add-slot-btn">Add Slot</button>
              <button class="preview-zone-btn">👁️ Preview</button>
              <div class="grid"></div>
            `;

            // Add delete button functionality
            zoneEl.querySelector(".delete-zone-btn").addEventListener("click", () => {
              if (confirm("Are you sure you want to delete this zone?")) {
                zoneEl.remove();
                saveToLocalStorage();
                updateZoneCounts();
              }
            });


          
            const grid = zoneEl.querySelector(".grid");
            zone.cells.forEach(cellData => {
              const cell = document.createElement("div");
              cell.className = "cell";
            
              if (cellData) {
                const slot = document.createElement("div");
                slot.className = `slot ${cellData.type}`;
                slot.setAttribute("draggable", "true");
                slot.textContent = cellData.number;
                cell.appendChild(slot);
                attachSlotEvents(slot);
              }
          
              // 👉 Setup each cell to accept drops
              setupCellDropzone(cell);
          
              grid.appendChild(cell);
            });
        
            // 👉 Add event listener for Add Slot button for each loaded zone
            zoneEl.querySelector(".add-slot-btn").addEventListener("click", () => {
              addSlotToZone(zoneEl);
            });
        
            container.appendChild(zoneEl);
          });
      
          updateZoneCounts();
        }

        document.addEventListener("click", function(e) {
          if (e.target.classList.contains("preview-zone-btn")) {
            const zone = e.target.closest(".zone");
            const zoneName = zone.querySelector("h2").textContent;
            const availableSlots = zone.querySelectorAll(".slot.available");
          
            document.getElementById("preview-title").textContent = `${zoneName} – ${availableSlots.length} Available`;
            document.getElementById("preview-overlay").style.display = "flex";
          
            const previewGrid = document.getElementById("preview-grid");
            previewGrid.innerHTML = ""; // clear old
          
            availableSlots.forEach(slot => {
              const div = document.createElement("div");
              div.textContent = slot.textContent;
              div.style.fontSize = "24px";
              div.style.textAlign = "center";
              div.style.padding = "20px";
              div.style.border = "1px solid white";
              previewGrid.appendChild(div);
            });
          
            document.getElementById("preview-overlay").style.display = "flex";
          }
        
          if (e.target.classList.contains("close-btn")) {
            document.getElementById("preview-overlay").style.display = "none";
          }
        });

        
        // Helper: to setup drag drop for individual cell
        function setupCellDropzone(cell) {
          cell.addEventListener("dragover", e => e.preventDefault());
          cell.addEventListener("drop", e => {
            e.preventDefault();
            if (!cell.querySelector(".slot")) {
              const data = e.dataTransfer.getData("text/plain");
              cell.innerHTML = data;
              const droppedSlot = cell.querySelector(".slot");
              attachSlotEvents(droppedSlot);
              updateZoneCounts();
              saveToLocalStorage();
            }
          });
        }
        
        // Init on load
        document.addEventListener("DOMContentLoaded", () => {
  // Make sure preview is hidden on load
  document.getElementById("preview-overlay").style.display = "none";
  
  loadFromLocalStorage();

  if (!localStorage.getItem("zones")) {
    document.querySelectorAll(".slot").forEach(attachSlotEvents);
    document.querySelectorAll(".cell").forEach(setupCellDropzone);
    document.querySelectorAll(".add-slot-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const zone = btn.closest(".zone");
        addSlotToZone(zone);
      });
    });
    updateZoneCounts();
  }
});