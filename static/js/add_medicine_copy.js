document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ add_medicine.js loaded");

  const container = document.getElementById("medicineCards");
  const addBtn = document.getElementById("addAnotherBtn");
  const nextBtn = document.getElementById("nextBtn");
  const autoSaveToggle = document.getElementById("autoSaveToggle");
  const autoSaveStatus = document.getElementById("autoSaveStatus");
  
  let autoSaveEnabled = true;
  let saveTimeout = null;

  // ----------------------------
  // Load existing draft on page load
  // ----------------------------
  await loadDraft();

  // ----------------------------
  // Collect ALL medicines
  // ----------------------------
  function collectMedicines() {
    return Array.from(document.querySelectorAll(".medicine-card")).map(card => {
      const q = sel => card.querySelector(sel);

      return {
        medicine: {
          name: q('[name$="[name]"]')?.value || "",
          dosage: q('[name$="[dosage]"]')?.value || "",
          quantity: Number(q('[name$="[quantity]"]')?.value || 0),
          medium: q('[name$="[medium]"]:checked')?.value || "",
          food: q('[name$="[food]"]:checked')?.value || "",
          notes: q('[name$="[notes]"]')?.value || ""
        },
        schedule: {
          start_date: q('[name$="[schedule][start_date]"]')?.value || null,
          duration_days: Number(q('[name$="[schedule][duration]"]')?.value || 0),
          days: JSON.parse(q('[name$="[schedule][days]"]')?.value || "[]"),
          time: q('[name$="[schedule][time]"]')?.value || null,
          quantity_per_dose: Number(q('[name$="[schedule][quantity_per_dose]"]')?.value || 1),
          reminder_enabled: q('[name$="[schedule][reminder]"]')?.checked ?? true,
          snooze_minutes: 10
        }
      };
    });
  }

  // ----------------------------
  // Save draft to backend
  // ----------------------------
  async function saveDraft() {
    const medicines = collectMedicines();

    try {
      const response = await fetch("/api/draft/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicines })
      });

      if (response.ok) {
        console.log("💾 Draft saved:", medicines);
        if (autoSaveStatus) {
          autoSaveStatus.textContent = "Saved ✓";
          setTimeout(() => {
            autoSaveStatus.textContent = "Saving automatically";
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Save failed:", error);
    }
  }

  // ----------------------------
  // Load draft from backend
  // ----------------------------
  async function loadDraft() {
    try {
      const res = await fetch("/api/draft/load");
      const data = await res.json();

      if (data.draft && data.draft.medicines && data.draft.medicines.length > 0) {
        console.log("📥 Loading draft:", data.draft);
        
        // Clear existing cards
        container.innerHTML = "";

        // Render each medicine from draft
        data.draft.medicines.forEach((item, index) => {
          renderMedicineCard(item, index);
        });
      }
    } catch (error) {
      console.error("Load draft failed:", error);
    }
  }

  // ----------------------------
  // Render a medicine card with data
  // ----------------------------
  function renderMedicineCard(data, index) {
    const template = document.querySelector(".medicine-card");
    const clone = template ? template.cloneNode(true) : createEmptyCard();
    
    clone.dataset.index = index;
    
    const titleEl = clone.querySelector("h3");
    if (titleEl) titleEl.innerText = `Medicine ${index + 1}`;
    
    clone.classList.remove("collapsed");
    const cloneBody = clone.querySelector(".card-body");
    if (cloneBody) cloneBody.style.display = "block";

    // Update all input names
    clone.querySelectorAll("input, textarea").forEach(el => {
      el.name = el.name.replace(/\[(\d+)\]/, `[${index}]`);
      if (el.id) {
        el.id = el.id.replace(/-(\d+)-/, `-${index}-`);
      }
    });

    // Update labels
    clone.querySelectorAll("label[for]").forEach(label => {
      const forAttr = label.getAttribute("for");
      if (forAttr) {
        label.setAttribute("for", forAttr.replace(/-(\d+)-/, `-${index}-`));
      }
    });

    // Populate with data
    if (data) {
      const q = sel => clone.querySelector(sel);
      
      // Medicine fields
      if (q('[name$="[name]"]')) q('[name$="[name]"]').value = data.medicine.name || "";
      if (q('[name$="[dosage]"]')) q('[name$="[dosage]"]').value = data.medicine.dosage || "";
      if (q('[name$="[quantity]"]')) q('[name$="[quantity]"]').value = data.medicine.quantity || "";
      if (q('[name$="[notes]"]')) q('[name$="[notes]"]').value = data.medicine.notes || "";
      
      // Medium radio
      if (data.medicine.medium) {
        const mediumRadio = q(`[name$="[medium]"][value="${data.medicine.medium}"]`);
        if (mediumRadio) mediumRadio.checked = true;
      }
      
      // Food radio
      if (data.medicine.food) {
        const foodRadio = q(`[name$="[food]"][value="${data.medicine.food}"]`);
        if (foodRadio) foodRadio.checked = true;
      }

      // Schedule fields
      if (q('[name$="[schedule][start_date]"]')) q('[name$="[schedule][start_date]"]').value = data.schedule.start_date || "";
      if (q('[name$="[schedule][duration]"]')) q('[name$="[schedule][duration]"]').value = data.schedule.duration_days || "";
      if (q('[name$="[schedule][time]"]')) q('[name$="[schedule][time]"]').value = data.schedule.time || "";
      if (q('[name$="[schedule][quantity_per_dose]"]')) q('[name$="[schedule][quantity_per_dose]"]').value = data.schedule.quantity_per_dose || 1;
      if (q('[name$="[schedule][reminder]"]')) q('[name$="[schedule][reminder]"]').checked = data.schedule.reminder_enabled ?? true;

      // Days selection
      if (data.schedule.days && data.schedule.days.length > 0) {
        data.schedule.days.forEach(day => {
          const dayBtn = q(`.day[data-day="${day}"]`);
          if (dayBtn) dayBtn.classList.add("selected");
        });
        const daysInput = q('[name$="[schedule][days]"]');
        if (daysInput) daysInput.value = JSON.stringify(data.schedule.days);
      }
    }

    container.appendChild(clone);
  }

  // ----------------------------
  // Auto-save functionality
  // ----------------------------
  if (autoSaveToggle) {
    autoSaveToggle.checked = true; // Start enabled
    
    autoSaveToggle.addEventListener("change", () => {
      autoSaveEnabled = autoSaveToggle.checked;
      if (autoSaveStatus) {
        autoSaveStatus.textContent = autoSaveEnabled ? "Saving automatically" : "Auto-save off";
        autoSaveStatus.className = autoSaveEnabled ? "autosave-status autosave-on" : "autosave-status autosave-off";
      }
    });
  }

  // Trigger auto-save on input changes
  container.addEventListener("input", () => {
    if (!autoSaveEnabled) return;
    
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveDraft();
    }, 1500); // Save 1.5 seconds after user stops typing
  });

  container.addEventListener("change", () => {
    if (!autoSaveEnabled) return;
    saveDraft();
  });

  // ----------------------------
  // Manual save buttons
  // ----------------------------
  container.addEventListener("click", (e) => {
    if (e.target.classList.contains("manual-save-btn")) {
      saveDraft();
    }
  });

  // ----------------------------
  // Add new medicine card
  // ----------------------------
  addBtn.addEventListener("click", () => {
    // Collapse all existing cards
    document.querySelectorAll(".medicine-card").forEach(card => {
      card.classList.add("collapsed");
      const body = card.querySelector(".card-body");
      if (body) body.style.display = "none";
    });

    const index = document.querySelectorAll(".medicine-card").length;
    renderMedicineCard(null, index);
  });

  // ----------------------------
  // Remove medicine card
  // ----------------------------
  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".action-box--remove");
    if (!btn) return;

    const cards = document.querySelectorAll(".medicine-card");
    if (cards.length === 1) {
      alert("At least one medicine required");
      return;
    }

    btn.closest(".medicine-card").remove();
    if (autoSaveEnabled) saveDraft();
  });

  // ----------------------------
  // Toggle card collapse/expand
  // ----------------------------
  container.addEventListener("click", e => {
    const toggle = e.target.closest(".action-box--toggle");
    if (!toggle) return;

    const card = toggle.closest(".medicine-card");
    const body = card.querySelector(".card-body");

    if (!body) return;

    const isOpen = body.style.display !== "none";
    body.style.display = isOpen ? "none" : "block";
    card.classList.toggle("collapsed", isOpen);
    toggle.setAttribute("aria-expanded", !isOpen);
  });

  // ----------------------------
  // Day selection handler
  // ----------------------------
  container.addEventListener("click", e => {
    if (!e.target.classList.contains("day")) return;

    const card = e.target.closest(".medicine-card");
    e.target.classList.toggle("selected");

    const days = Array.from(card.querySelectorAll(".day.selected")).map(d => d.dataset.day);

    const daysInput = card.querySelector('input[name*="[schedule][days]"]');
    if (daysInput) {
      daysInput.value = JSON.stringify(days);
    }
    
    if (autoSaveEnabled) saveDraft();
  });

  // ----------------------------
  // NEXT → Confirmation
  // ----------------------------
  nextBtn?.addEventListener("click", async () => {
    await saveDraft();
    window.location.href = "/confirmation";
  });
});