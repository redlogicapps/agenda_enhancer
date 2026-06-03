// @ts-nocheck
import { CategoryState } from './services/category-state.service';
import { AgendaState } from './services/agenda-state.service';

export class AppController {
      constructor() {
        this.categoryState = new CategoryState();
        this.agendaState = new AgendaState(this.categoryState);
        
        this.currentTab = 'import';
        this.calendarDate = new Date();
        this.dragActive = false;
        
        // Temp imports csv store
        this.parsedEvents = [];

        // Color palette for custom category creation
        this.colorPalette = [
          '#10b981', // Émeraude (Focus)
          '#6366f1', // Indigo (Interne)
          '#a855f7', // Violet (Externe)
          '#3b82f6', // Bleu (Admin)
          '#f59e0b', // Ambre (Pause)
          '#ec4899', // Rose
          '#f43f5e', // Corail
          '#06b6d4'  // Cyan
        ];
        this.selectedColor = '#ec4899';

        // Categorize tab states
        this.searchQuery = '';
        this.filterCategory = 'all';

        // Modals state
        this.selectedEventForCat = null;
        this.selectedEventForSim = null;
        
        this.initDomReferences();
        this.initEventBindings();
        
        // Dynamic subscriber bindings
        this.categoryState.subscribe(cats => {
          this.renderCategoryLists();
          this.renderCalendars();
        });
        
        this.agendaState.subscribeEvents(events => {
          this.updateGlobalStateViews(events);
        });

        this.agendaState.subscribeOriginalEvents(events => {
          this.renderCalendars();
        });

        this.agendaState.subscribeGoal(goal => {
          this.renderGoalsAndSliders();
        });

        // Initialize theme
        const savedTheme = localStorage.getItem('theme_preference') || 'dark';
        if (savedTheme === 'light') {
          document.body.classList.remove('dark-theme');
          document.body.classList.add('light-theme');
          this.themeIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
        }
      }

      initDomReferences() {
        // Layout Elements
        this.themeToggleBtn = document.getElementById('theme-toggle-btn');
        this.themeIcon = document.getElementById('theme-icon');
        this.headerClearBtn = document.getElementById('header-clear-btn');
        this.tabButtons = document.querySelectorAll('.tab-button');
        this.tabPanels = document.querySelectorAll('.tab-panel');

        // Tab 1 Elements
        this.dropzone = document.getElementById('dropzone');
        this.dropzoneLabel = document.getElementById('dropzone-label');
        this.fileInput = document.getElementById('file-input');
        this.loadDemoBtn = document.getElementById('load-demo-btn');
        this.confirmImportBtn = document.getElementById('confirm-import-btn');
        this.importCountBadge = document.getElementById('import-count-badge');
        
        // Tab 2 Elements
        this.categorizeSearch = document.getElementById('categorize-search');
        this.categorizeFiltersRow = document.getElementById('categorize-filters-row');
        this.customCatsListContainer = document.getElementById('custom-cats-list-container');
        this.categorizeProgressText = document.getElementById('categorize-progress-text');
        this.categorizeProgressFill = document.getElementById('categorize-progress-fill');

        // Tab 3 Elements
        this.dashboardScoreVal = document.getElementById('dashboard-score-val');
        this.dashboardScoreFeedback = document.getElementById('dashboard-score-feedback');
        this.dashboardFocusVal = document.getElementById('dashboard-focus-val');
        this.dashboardFocusSub = document.getElementById('dashboard-focus-sub');
        this.dashboardMeetingsVal = document.getElementById('dashboard-meetings-val');
        this.dashboardMeetingsSub = document.getElementById('dashboard-meetings-sub');
        this.donutChartTargetContainer = document.getElementById('donut-chart-target-container');

        // Tab 4 Elements
        this.simulatorGoalsFormContainer = document.getElementById('simulator-goals-form-container');
        this.simulatorActionsPlanContainer = document.getElementById('simulator-actions-plan-container');
        this.simulatorResetBtn = document.getElementById('simulator-reset-btn');
        this.simulatorEmptyState = document.getElementById('simulator-empty-state');

        // Calendar views wrappers
        this.calWrappers = {
          import: {
            daysHeader: document.getElementById('import-cal-days-header'),
            hoursCol: document.getElementById('import-cal-hours-col'),
            gridLines: document.getElementById('import-cal-grid-lines'),
            daysCols: document.getElementById('import-cal-days-cols'),
            weekLabel: document.getElementById('import-cal-week-label'),
            prevBtn: document.getElementById('import-cal-prev'),
            nextBtn: document.getElementById('import-cal-next')
          },
          categorize: {
            daysHeader: document.getElementById('categorize-cal-days-header'),
            hoursCol: document.getElementById('categorize-cal-hours-col'),
            gridLines: document.getElementById('categorize-cal-grid-lines'),
            daysCols: document.getElementById('categorize-cal-days-cols'),
            weekLabel: document.getElementById('categorize-cal-week-label'),
            prevBtn: document.getElementById('categorize-cal-prev'),
            nextBtn: document.getElementById('categorize-cal-next')
          },
          simulator: {
            daysHeader: document.getElementById('simulator-cal-days-header'),
            hoursCol: document.getElementById('simulator-cal-hours-col'),
            gridLines: document.getElementById('simulator-cal-grid-lines'),
            daysCols: document.getElementById('simulator-cal-days-cols'),
            weekLabel: document.getElementById('simulator-cal-week-label'),
            prevBtn: document.getElementById('simulator-cal-prev'),
            nextBtn: document.getElementById('simulator-cal-next')
          }
        };

        // Modals Elements
        this.addEventModal = document.getElementById('add-event-modal');
        this.addEventForm = document.getElementById('add-event-form');
        this.modalSubject = document.getElementById('modal-subject');
        this.modalStartDate = document.getElementById('modal-start-date');
        this.modalStartTime = document.getElementById('modal-start-time');
        this.modalDuration = document.getElementById('modal-duration');
        this.closeAddModalBtn = document.getElementById('close-add-modal-btn');
        this.cancelAddModalBtn = document.getElementById('cancel-add-modal-btn');

        this.categorizeEventModal = document.getElementById('categorize-event-modal');
        this.catPreviewSubject = document.getElementById('cat-preview-subject');
        this.catPreviewDate = document.getElementById('cat-preview-date');
        this.catPreviewTime = document.getElementById('cat-preview-time');
        this.catSelectionGrid = document.getElementById('cat-selection-grid');
        this.customCatAccordionToggle = document.getElementById('custom-cat-accordion-toggle');
        this.customCatAccordionContent = document.getElementById('custom-cat-accordion-content');
        this.newCatName = document.getElementById('new-cat-name');
        this.newCatColorPicker = document.getElementById('new-cat-color-picker');
        this.createCustomCatBtn = document.getElementById('create-custom-cat-btn');
        this.closeCatModalBtn = document.getElementById('close-cat-modal-btn');
        this.cancelCatModalBtn = document.getElementById('cancel-cat-modal-btn');

        this.simulatorAdjustmentsModal = document.getElementById('simulator-adjustments-modal');
        this.simModalPreviewCard = document.getElementById('sim-modal-preview-card');
        this.simPreviewSubject = document.getElementById('sim-preview-subject');
        this.simPreviewDate = document.getElementById('sim-preview-date');
        this.simPreviewTime = document.getElementById('sim-preview-time');
        this.simPreviewBadgeDeleted = document.getElementById('sim-preview-badge-deleted');
        this.simPreviewBadgeModified = document.getElementById('sim-preview-badge-modified');
        this.simCatSelectionGrid = document.getElementById('sim-cat-selection-grid');
        this.simDurationMinus = document.getElementById('sim-duration-minus');
        this.simDurationPlus = document.getElementById('sim-duration-plus');
        this.simDurationText = document.getElementById('sim-duration-text');
        this.simDurationSlider = document.getElementById('sim-duration-slider');
        this.simOriginalDurationText = document.getElementById('sim-original-duration-text');
        this.simCancelPresenceBtn = document.getElementById('sim-cancel-presence-btn');
        this.closeSimModalBtn = document.getElementById('close-sim-modal-btn');
        this.closeSimModalBtnFooter = document.getElementById('close-sim-modal-btn-footer');
      }

      initEventBindings() {
        // Theme Switcher
        this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());

        // Header Clear button
        this.headerClearBtn.addEventListener('click', () => {
          if (confirm('Êtes-vous sûr de vouloir vider l\'agenda actuel ? Toutes vos simulations seront effacées.')) {
            this.agendaState.clearAgenda();
          }
        });

        // Navigation Tabs Bindings
        this.tabButtons.forEach(btn => {
          btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            this.switchTab(tabId);
          });
        });

        // Tab 1 File Upload Bindings
        this.dropzone.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileInput(e));
        this.dropzone.addEventListener('dragover', (e) => {
          e.preventDefault();
          this.dropzone.classList.add('active');
        });
        this.dropzone.addEventListener('dragleave', () => this.dropzone.classList.remove('active'));
        this.dropzone.addEventListener('drop', (e) => {
          e.preventDefault();
          this.dropzone.classList.remove('active');
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            this.handleFile(e.dataTransfer.files[0]);
          }
        });

        // Load Demo and Confirm Import
        this.loadDemoBtn.addEventListener('click', () => this.loadDemoData());
        this.confirmImportBtn.addEventListener('click', () => this.confirmImport());

        // Tab 2 categorization Search Input
        this.categorizeSearch.addEventListener('input', (e) => {
          this.searchQuery = e.target.value;
          this.renderCalendars();
        });

        // Tab 4 reset simulator
        this.simulatorResetBtn.addEventListener('click', () => {
          if (confirm('Voulez-vous réinitialiser toutes vos modifications de simulation ?')) {
            this.agendaState.resetSimulation();
          }
        });

        // Week navigations listeners
        ['import', 'categorize', 'simulator'].forEach(tab => {
          this.calWrappers[tab].prevBtn.addEventListener('click', () => {
            this.calendarDate.setDate(this.calendarDate.getDate() - 7);
            this.renderCalendars();
          });
          this.calWrappers[tab].nextBtn.addEventListener('click', () => {
            this.calendarDate.setDate(this.calendarDate.getDate() + 7);
            this.renderCalendars();
          });
        });

        // Modal 1 (Add manual event) bindings
        const closeAddModal = () => this.addEventModal.style.display = 'none';
        this.closeAddModalBtn.addEventListener('click', closeAddModal);
        this.cancelAddModalBtn.addEventListener('click', closeAddModal);
        this.addEventForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.saveManualEvent();
        });

        // Modal 2 (Categorization choice) bindings
        const closeCatModal = () => this.categorizeEventModal.style.display = 'none';
        this.closeCatModalBtn.addEventListener('click', closeCatModal);
        this.cancelCatModalBtn.addEventListener('click', closeCatModal);
        
        // Custom Category Accordion
        this.customCatAccordionToggle.addEventListener('click', () => {
          const isHidden = this.customCatAccordionContent.style.display === 'none';
          this.customCatAccordionContent.style.display = isHidden ? 'flex' : 'none';
          document.getElementById('accordion-arrow').textContent = isHidden ? '▲' : '▼';
        });

        // Form bindings for custom category
        this.newCatName.addEventListener('input', (e) => {
          this.createCustomCatBtn.disabled = !e.target.value.trim();
        });
        
        // Create custom category button click
        this.createCustomCatBtn.addEventListener('click', () => {
          const label = this.newCatName.value.trim();
          if (label && this.selectedEventForCat) {
            const newCat = this.categoryState.addCustomCategory(label, this.selectedColor);
            this.changeCategory(this.selectedEventForCat.id, newCat.key);
            
            // Clean up
            this.newCatName.value = '';
            this.createCustomCatBtn.disabled = true;
            this.customCatAccordionContent.style.display = 'none';
            document.getElementById('accordion-arrow').textContent = '▼';
            closeCatModal();
          }
        });

        // Modal 3 (Simulator details slider) bindings
        const closeSimModal = () => {
          this.simulatorAdjustmentsModal.style.display = 'none';
          this.selectedEventForSim = null;
        };
        this.closeSimModalBtn.addEventListener('click', closeSimModal);
        this.closeSimModalBtnFooter.addEventListener('click', closeSimModal);

        // Adjust durations minus/plus
        this.simDurationMinus.addEventListener('click', () => {
          if (this.selectedEventForSim && this.selectedEventForSim.durationMinutes > 15) {
            const next = this.selectedEventForSim.durationMinutes - 15;
            this.agendaState.updateEventDuration(this.selectedEventForSim.id, next);
            this.selectedEventForSim.durationMinutes = next;
            this.syncSimModalDurationControls();
          }
        });
        this.simDurationPlus.addEventListener('click', () => {
          if (this.selectedEventForSim && this.selectedEventForSim.durationMinutes < 480) {
            const next = this.selectedEventForSim.durationMinutes + 15;
            this.agendaState.updateEventDuration(this.selectedEventForSim.id, next);
            this.selectedEventForSim.durationMinutes = next;
            this.syncSimModalDurationControls();
          }
        });
        
        // Slider value input listener
        this.simDurationSlider.addEventListener('input', (e) => {
          if (this.selectedEventForSim) {
            const val = Number(e.target.value);
            this.agendaState.updateEventDuration(this.selectedEventForSim.id, val);
            this.selectedEventForSim.durationMinutes = val;
            this.syncSimModalDurationControls();
          }
        });

        // Virtual cancel presence listener
        this.simCancelPresenceBtn.addEventListener('click', () => {
          if (this.selectedEventForSim) {
            this.agendaState.toggleEventDeleted(this.selectedEventForSim.id);
            this.selectedEventForSim.isDeleted = !this.selectedEventForSim.isDeleted;
            this.syncSimModalPresenceControls();
          }
        });
      }

      toggleTheme() {
        const body = document.body;
        const isDark = body.classList.contains('dark-theme');
        if (isDark) {
          body.classList.remove('dark-theme');
          body.classList.add('light-theme');
          localStorage.setItem('theme_preference', 'light');
          this.themeIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
        } else {
          body.classList.remove('light-theme');
          body.classList.add('dark-theme');
          localStorage.setItem('theme_preference', 'dark');
          this.themeIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
        }
        // Force refresh SVG Donut as HSL variables changed
        this.renderStats();
      }

      switchTab(tabId) {
        // Safety guard: block clicks if no events loaded
        const events = this.agendaState.originalEvents;
        if (events.length === 0 && tabId !== 'import') {
          alert('Veuillez d\'abord charger un agenda ou utiliser les données de démonstration dans l\'onglet "Charger l\'agenda".');
          return;
        }

        this.currentTab = tabId;
        
        // Toggles classes
        this.tabButtons.forEach(btn => {
          if (btn.getAttribute('data-tab') === tabId) {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        });

        this.tabPanels.forEach(panel => {
          if (panel.id === `panel-${tabId}`) {
            panel.classList.add('active');
          } else {
            panel.classList.remove('active');
          }
        });

        // Trigger redrawing actions
        this.renderCalendars();
        if (tabId === 'dashboard') {
          this.renderStats();
        }
      }

      updateGlobalStateViews(events) {
        const hasEvents = events.length > 0;
        
        // Toggle tab navigation lock badges
        const lockTabs = ['categorize', 'dashboard', 'simulator'];
        lockTabs.forEach(tid => {
          const tabButton = document.getElementById(`nav-tab-${tid}`);
          if (hasEvents) {
            tabButton.classList.remove('disabled');
            const lockIcon = tabButton.querySelector('.lock-icon');
            if (lockIcon) lockIcon.style.display = 'none';
          } else {
            tabButton.classList.add('disabled');
            const lockIcon = tabButton.querySelector('.lock-icon');
            if (lockIcon) lockIcon.style.display = 'inline';
          }
        });

        // Header clear button show/hide
        this.headerClearBtn.style.display = hasEvents ? 'inline-flex' : 'none';

        // Redirect back to import if clear happened
        if (!hasEvents && this.currentTab !== 'import') {
          this.switchTab('import');
        }

        // Automatic center on first loaded event week
        if (hasEvents && this.isFirstLoadDone !== true) {
          const firstEventDate = new Date(events[0].startDate);
          if (!isNaN(firstEventDate.getTime())) {
            this.calendarDate = firstEventDate;
            this.isFirstLoadDone = true;
          }
        }

        // Recompute views
        this.renderCalendars();
        this.renderStats();
        this.renderGoalsAndSliders();
        this.renderCategorizeProgress(events);
      }

      renderCategorizeProgress(events) {
        const total = events.length;
        const categorized = events.filter(e => e.categoryKey !== 'uncategorized').length;
        this.categorizeProgressText.textContent = `${categorized} / ${total}`;
        
        const pct = total > 0 ? Math.round((categorized / total) * 100) : 0;
        this.categorizeProgressFill.style.width = `${pct}%`;
      }

      // --- PARSING FILES STAGE ---
      handleFileInput(event) {
        const input = event.target;
        if (input.files && input.files.length > 0) {
          this.handleFile(input.files[0]);
        }
      }

      handleFile(file) {
        if (!file.name.endsWith('.csv')) {
          alert('Veuillez sélectionner un fichier CSV.');
          return;
        }

        this.dropzoneLabel.innerHTML = `<span class="file-loaded"><strong>${file.name}</strong> chargé !</span>`;
        
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target.result;
          this.parsedEvents = this.agendaState.parseOutlookCSV(text);
          if (this.parsedEvents.length === 0) {
            alert('Aucun événement n\'a pu être extrait. Vérifiez le format de votre CSV.');
            this.dropzoneLabel.innerHTML = `<strong>Glissez votre CSV Outlook</strong> ici ou <span class="browse-link">parcourez</span>`;
            this.confirmImportBtn.disabled = true;
          } else {
            this.confirmImportBtn.disabled = false;
            this.importCountBadge.textContent = this.parsedEvents.length;
          }
        };
        reader.readAsText(file);
      }

      confirmImport() {
        if (this.parsedEvents.length > 0) {
          this.agendaState.setEvents(this.parsedEvents);
          this.parsedEvents = [];
          this.confirmImportBtn.disabled = true;
          this.importCountBadge.textContent = '0';
          this.dropzoneLabel.innerHTML = `<strong>Glissez votre CSV Outlook</strong> ici ou <span class="browse-link">parcourez</span>`;
          
          // Smooth redirections
          setTimeout(() => {
            this.switchTab('categorize');
          }, 300);
        }
      }

      loadDemoData() {
        const today = new Date();
        const formatDate = (offsetDays) => {
          const d = new Date(today);
          d.setDate(today.getDate() + offsetDays);
          return d.toISOString().split('T')[0];
        };

        const demoEvents = [
          // Lundi
          {
            id: 'demo-1',
            subject: 'Hebdo d\'alignement équipe (Sync)',
            startDate: formatDate(0),
            startTime: '09:00',
            endDate: formatDate(0),
            endTime: '10:00',
            durationMinutes: 60,
            categoryKey: 'meet-int',
            originalDurationMinutes: 60,
            originalCategoryKey: 'meet-int',
            isDeleted: false,
            isModified: false
          },
          {
            id: 'demo-2',
            subject: 'Traitement des e-mails & admin',
            startDate: formatDate(0),
            startTime: '10:00',
            endDate: formatDate(0),
            endTime: '11:00',
            durationMinutes: 60,
            categoryKey: 'admin',
            originalDurationMinutes: 60,
            originalCategoryKey: 'admin',
            isDeleted: false,
            isModified: false
          },
          {
            id: 'demo-3',
            subject: 'Point projet Alpha avec client',
            startDate: formatDate(0),
            startTime: '11:00',
            endDate: formatDate(0),
            endTime: '12:30',
            durationMinutes: 90,
            categoryKey: 'meet-ext',
            originalDurationMinutes: 90,
            originalCategoryKey: 'meet-ext',
            isDeleted: false,
            isModified: false
          },
          {
            id: 'demo-4',
            subject: 'Pause Déjeuner & Marche',
            startDate: formatDate(0),
            startTime: '12:30',
            endDate: formatDate(0),
            endTime: '14:00',
            durationMinutes: 90,
            categoryKey: 'pause',
            originalDurationMinutes: 90,
            originalCategoryKey: 'pause',
            isDeleted: false,
            isModified: false
          },
          {
            id: 'demo-5',
            subject: 'Travail individuel : Rédaction architecture',
            startDate: formatDate(0),
            startTime: '14:00',
            endDate: formatDate(0),
            endTime: '17:00',
            durationMinutes: 180,
            categoryKey: 'focus',
            originalDurationMinutes: 180,
            originalCategoryKey: 'focus',
            isDeleted: false,
            isModified: false
          },
          {
            id: 'demo-6',
            subject: 'Synchro One-on-One avec Julien',
            startDate: formatDate(0),
            startTime: '17:00',
            endDate: formatDate(0),
            endTime: '18:00',
            durationMinutes: 60,
            categoryKey: 'meet-int',
            originalDurationMinutes: 60,
            originalCategoryKey: 'meet-int',
            isDeleted: false,
            isModified: false
          },

          // Mardi
          {
            id: 'demo-7',
            subject: 'Daily Standup',
            startDate: formatDate(1),
            startTime: '09:15',
            endDate: formatDate(1),
            endTime: '09:45',
            durationMinutes: 30,
            categoryKey: 'meet-int',
            originalDurationMinutes: 30,
            originalCategoryKey: 'meet-int',
            isDeleted: false,
            isModified: false
          },
          {
            id: 'demo-8',
            subject: 'Revue de Sprint & Rétrospective',
            startDate: formatDate(1),
            startTime: '10:00',
            endDate: formatDate(1),
            endTime: '12:00',
            durationMinutes: 120,
            categoryKey: 'meet-int',
            originalDurationMinutes: 120,
            originalCategoryKey: 'meet-int',
            isDeleted: false,
            isModified: false
          },
          {
            id: 'demo-9',
            subject: 'Lunch avec l\'équipe',
            startDate: formatDate(1),
            startTime: '12:00',
            endDate: formatDate(1),
            endTime: '13:30',
            durationMinutes: 90,
            categoryKey: 'pause',
            originalDurationMinutes: 90,
            originalCategoryKey: 'pause',
            isDeleted: false,
            isModified: false
          },
          {
            id: 'demo-10',
            subject: 'Focus : Codage & Revue de code',
            startDate: formatDate(1),
            startTime: '13:30',
            endDate: formatDate(1),
            endTime: '15:30',
            durationMinutes: 120,
            categoryKey: 'focus',
            originalDurationMinutes: 120,
            originalCategoryKey: 'focus',
            isDeleted: false,
            isModified: false
          },
          {
            id: 'demo-11',
            subject: 'Réunion de cadrage design system',
            startDate: formatDate(1),
            startTime: '15:30',
            endDate: formatDate(1),
            endTime: '17:00',
            durationMinutes: 90,
            categoryKey: 'meet-int',
            originalDurationMinutes: 90,
            originalCategoryKey: 'meet-int',
            isDeleted: false,
            isModified: false
          },
          {
            id: 'demo-12',
            subject: 'Factures et tâches administratives',
            startDate: formatDate(1),
            startTime: '17:00',
            endDate: formatDate(1),
            endTime: '18:00',
            durationMinutes: 60,
            categoryKey: 'admin',
            originalDurationMinutes: 60,
            originalCategoryKey: 'admin',
            isDeleted: false,
            isModified: false
          },

          // Mercredi
          {
            id: 'demo-13',
            subject: 'Démo Produit - Client Beta',
            startDate: formatDate(2),
            startTime: '09:30',
            endDate: formatDate(2),
            endTime: '11:00',
            durationMinutes: 90,
            categoryKey: 'meet-ext',
            originalDurationMinutes: 90,
            originalCategoryKey: 'meet-ext',
            isDeleted: false,
            isModified: false
          },
          {
            id: 'demo-14',
            subject: 'Saisie des temps & Comptes rendus',
            startDate: formatDate(2),
            startTime: '11:00',
            endDate: formatDate(2),
            endTime: '12:00',
            durationMinutes: 60,
            categoryKey: 'admin',
            originalDurationMinutes: 60,
            originalCategoryKey: 'admin',
            isDeleted: false,
            isModified: false
          },
          {
            id: 'demo-15',
            subject: 'Déjeuner rapide',
            startDate: formatDate(2),
            startTime: '12:00',
            endDate: formatDate(2),
            endTime: '13:00',
            durationMinutes: 60,
            categoryKey: 'pause',
            originalDurationMinutes: 60,
            originalCategoryKey: 'pause',
            isDeleted: false,
            isModified: false
          },
          {
            id: 'demo-16',
            subject: 'Deep Work : Conception de l\'API',
            startDate: formatDate(2),
            startTime: '13:00',
            endDate: formatDate(2),
            endTime: '16:00',
            durationMinutes: 180,
            categoryKey: 'focus',
            originalDurationMinutes: 180,
            originalCategoryKey: 'focus',
            isDeleted: false,
            isModified: false
          },
          {
            id: 'demo-17',
            subject: 'Alignement marketing & commercial',
            startDate: formatDate(2),
            startTime: '16:00',
            endDate: formatDate(2),
            endTime: '17:30',
            durationMinutes: 90,
            categoryKey: 'meet-int',
            originalDurationMinutes: 90,
            originalCategoryKey: 'meet-int',
            isDeleted: false,
            isModified: false
          }
        ];

        const uncategorizedDemo = demoEvents.map(e => ({
          ...e,
          categoryKey: 'uncategorized',
          originalCategoryKey: 'uncategorized'
        }));

        this.agendaState.setEvents(uncategorizedDemo);
        alert('Agenda de démonstration chargé dans le calendrier !');
        
        // Auto redirection
        setTimeout(() => {
          this.switchTab('categorize');
        }, 300);
      }

      // --- RENDERING CALENDAR STAGES ---
      calculateWeekDays() {
        const startOfWeek = new Date(this.calendarDate);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0,0,0,0);

        const days = [];
        const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
        
        for (let i = 0; i < 7; i++) {
          const d = new Date(startOfWeek);
          d.setDate(startOfWeek.getDate() + i);
          const dateStr = d.toISOString().split('T')[0];
          const isToday = new Date().toISOString().split('T')[0] === dateStr;
          const dateLabel = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
          
          days.push({
            name: dayNames[i],
            dateStr,
            dateLabel,
            isToday
          });
        }
        return days;
      }

      renderCalendars() {
        const weekDays = this.calculateWeekDays();
        const calendarHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

        // Format dates label
        const weekLabelText = `Semaine du ${weekDays[0].dateLabel} au ${weekDays[6].dateLabel}`;

        // Redraw only for visible tab or redraw all safely
        const activeTabsList = ['import', 'categorize', 'simulator'];
        
        activeTabsList.forEach(tab => {
          const targets = this.calWrappers[tab];
          if (!targets.weekLabel) return;
          
          // Set week label
          targets.weekLabel.textContent = weekLabelText;

          // Render Headers
          let headersHtml = '<div class="time-col-header"></div>';
          weekDays.forEach(day => {
            headersHtml += `
              <div class="day-col-header ${day.isToday ? 'today' : ''}">
                <span class="day-name">${day.name}</span>
                <span class="day-date">${day.dateLabel}</span>
              </div>
            `;
          });
          targets.daysHeader.innerHTML = headersHtml;

          // Render hours
          let hoursHtml = '';
          calendarHours.forEach(hour => {
            hoursHtml += `<div class="hour-cell-label">${hour}:00</div>`;
          });
          targets.hoursCol.innerHTML = hoursHtml;

          // Render grid lines
          let linesHtml = '';
          calendarHours.forEach(() => {
            linesHtml += `<div class="grid-hour-line"></div>`;
          });
          targets.gridLines.innerHTML = linesHtml;

          // Render columns with absolute positioning
          let colsHtml = '';
          weekDays.forEach(day => {
            colsHtml += `<div class="day-column" data-date="${day.dateStr}">`;
            
            // If tab is 'import', inject click handlers
            if (tab === 'import') {
              colsHtml += `<div class="click-slots-container">`;
              calendarHours.forEach(hour => {
                colsHtml += `<div class="click-hour-slot" data-date="${day.dateStr}" data-hour="${hour}" title="Créer un événement à ${hour}:00"></div>`;
              });
              colsHtml += `</div>`;
            }

            // Fetch events
            const eventsList = this.agendaState.simulatedEvents.filter(e => e.startDate === day.dateStr);
            
            eventsList.forEach(event => {
              // Hide deleted events from Tab 1 and 2
              if (event.isDeleted && tab !== 'simulator') return;

              // Filter out in Tab 2 if categorization search matches
              if (tab === 'categorize') {
                const isFaded = this.isCategorizationFaded(event);
                if (isFaded) return;
              }

              const pos = this.getEventPosition(event);
              const colorHex = this.getCategoryColorHex(event.categoryKey);
              const label = this.getCategoryLabel(event.categoryKey);

              let eventClass = 'event-block clickable-block';
              let borderStyle = `border-left: 4px solid ${colorHex};`;
              let bgStyle = `background-color: ${colorHex}dd;`;

              if (tab === 'categorize') {
                if (event.categoryKey === 'uncategorized') {
                  eventClass += ' uncategorized-block';
                  borderStyle = 'border-left: 3px dashed #6b7280; border-right: 1px solid rgba(255,255,255,0.08); border-top: 1px solid rgba(255,255,255,0.08); border-bottom: 1px solid rgba(255,255,255,0.08);';
                  bgStyle = 'background-color: rgba(255,255,255,0.03);';
                } else {
                  borderStyle = `border-left: 4px solid ${colorHex}; border-right: 1px solid ${colorHex}44; border-top: 1px solid ${colorHex}44; border-bottom: 1px solid ${colorHex}44;`;
                  bgStyle = `background-color: ${colorHex}22;`;
                }
              }

              if (tab === 'simulator') {
                if (event.isDeleted) {
                  eventClass += ' deleted-block';
                  borderStyle = 'border-left: 4px solid var(--color-danger) !important; border-right: 1px dashed rgba(239, 68, 68, 0.2) !important; border-top: 1px dashed rgba(239, 68, 68, 0.2) !important; border-bottom: 1px dashed rgba(239, 68, 68, 0.2) !important;';
                  bgStyle = 'background-color: rgba(239, 68, 68, 0.04) !important;';
                } else if (event.isModified) {
                  eventClass += ' modified-block';
                  borderStyle = `border-left: 4px solid ${colorHex}; border-right: 2px dashed var(--color-warning) !important; border-top: 1px solid var(--color-warning) !important; border-bottom: 1px solid var(--color-warning) !important;`;
                  bgStyle = 'background-color: rgba(245, 158, 11, 0.05) !important;';
                } else if (event.categoryKey === 'uncategorized') {
                  eventClass += ' uncategorized-block';
                  borderStyle = 'border-left: 3px dashed #6b7280; border-right: 1px solid rgba(255,255,255,0.08); border-top: 1px solid rgba(255,255,255,0.08); border-bottom: 1px solid rgba(255,255,255,0.08);';
                  bgStyle = 'background-color: rgba(255,255,255,0.03);';
                } else {
                  borderStyle = `border-left: 4px solid ${colorHex}; border-right: 1px solid ${colorHex}44; border-top: 1px solid ${colorHex}44; border-bottom: 1px solid ${colorHex}44;`;
                  bgStyle = `background-color: ${colorHex}22;`;
                }
              }

              colsHtml += `
                <div class="${eventClass}" 
                     data-id="${event.id}" 
                     style="top: ${pos.top}px; height: ${pos.height}px; ${bgStyle} ${borderStyle}"
                     title="${event.subject} (${event.durationMinutes} min)">
                  <div class="event-block-content">
                    <span class="event-block-time">${event.startTime} - ${event.endTime}</span>
                    <h5 class="event-block-title">${event.subject}</h5>
                    <span class="event-block-cat" style="color: ${event.categoryKey === 'uncategorized' && tab !== 'import' ? '#9ca3af' : (tab === 'import' ? 'rgba(255,255,255,0.8)' : colorHex)}">
                      ${label.split(' / ')[0]} ${event.isDeleted && tab === 'simulator' ? '(Annulé)' : ''}
                    </span>
                  </div>
                  ${tab === 'import' ? `<button class="delete-block-btn" data-delete-id="${event.id}" title="Supprimer cet événement">✕</button>` : ''}
                </div>
              `;
            });

            colsHtml += `</div>`;
          });
          targets.daysCols.innerHTML = colsHtml;

          // Attach manual event creation handlers on cells in Tab 1
          if (tab === 'import') {
            targets.daysCols.querySelectorAll('.click-hour-slot').forEach(slot => {
              slot.addEventListener('click', (e) => {
                const dateStr = slot.getAttribute('data-date');
                const hour = Number(slot.getAttribute('data-hour'));
                this.openAddEventModal(dateStr, hour);
              });
            });
            
            // Delete buttons listeners
            targets.daysCols.querySelectorAll('.delete-block-btn').forEach(btn => {
              btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const devtId = btn.getAttribute('data-delete-id');
                if (confirm('Voulez-vous supprimer cet événement de votre agenda ?')) {
                  this.agendaState.deleteEventPermanently(devtId);
                }
              });
            });
          }

          // Category clicks triggers in Tab 2
          if (tab === 'categorize') {
            targets.daysCols.querySelectorAll('.event-block').forEach(block => {
              block.addEventListener('click', () => {
                const devtId = block.getAttribute('data-id');
                const ev = this.agendaState.simulatedEvents.find(e => e.id === devtId);
                if (ev) this.openCategorizeEventModal(ev);
              });
            });
          }

          // Simulation sliders triggers in Tab 4
          if (tab === 'simulator') {
            targets.daysCols.querySelectorAll('.event-block').forEach(block => {
              block.addEventListener('click', () => {
                const devtId = block.getAttribute('data-id');
                const ev = this.agendaState.simulatedEvents.find(e => e.id === devtId);
                if (ev) this.openSimulatorEventModal(ev);
              });
            });
          }
        });
        
        // Simulator empty state toggle
        if (this.agendaState.originalEvents.length === 0) {
          this.simulatorEmptyState.style.display = 'block';
        } else {
          this.simulatorEmptyState.style.display = 'none';
        }
      }

      isCategorizationFaded(event) {
        if (this.searchQuery && !event.subject.toLowerCase().includes(this.searchQuery.toLowerCase())) {
          return true;
        }
        if (this.filterCategory === 'uncategorized') {
          return event.categoryKey !== 'uncategorized';
        } else if (this.filterCategory !== 'all') {
          return event.categoryKey !== this.filterCategory;
        }
        return false;
      }

      getEventPosition(event) {
        const [h, m] = event.startTime.split(':').map(Number);
        const startMins = h * 60 + m;
        const gridStartMins = 8 * 60; // 08:00
        
        const diffMins = Math.max(0, startMins - gridStartMins);
        const pxPerMin = 50 / 60;
        
        const top = diffMins * pxPerMin;
        const height = event.durationMinutes * pxPerMin;

        return { top, height };
      }

      getCategoryColorHex(key) {
        const found = this.categoryState.getCategories().find(c => c.key === key);
        return found ? found.colorHex : '#6b7280';
      }

      getCategoryLabel(key) {
        const found = this.categoryState.getCategories().find(c => c.key === key);
        return found ? found.label : 'Non classé';
      }

      // --- RENDERING CATEGORIES LISTS AND MANAGER ---
      renderCategoryLists() {
        const categories = this.categoryState.getCategories();
        const custom = categories.filter(c => !c.isDefault);

        // Tab 2 Categories Filters
        let filtersHtml = `
          <button class="btn btn-secondary btn-sm ${this.filterCategory === 'all' ? 'active' : ''}" id="filter-all-btn">
            Tout voir
          </button>
          <button class="btn btn-secondary btn-sm ${this.filterCategory === 'uncategorized' ? 'active' : ''}" id="filter-uncat-btn">
            Non classés (${this.agendaState.simulatedEvents.filter(e => e.categoryKey === 'uncategorized').length})
          </button>
        `;

        categories.filter(c => c.key !== 'uncategorized').forEach(cat => {
          filtersHtml += `
            <button class="btn btn-secondary btn-sm ${this.filterCategory === cat.key ? 'active' : ''}" data-filter-key="${cat.key}">
              <span class="color-dot" style="background-color: ${cat.colorHex}"></span>
              ${cat.label.split(' / ')[0]}
            </button>
          `;
        });
        this.categorizeFiltersRow.innerHTML = filtersHtml;

        // Rebind click listeners on filters
        this.categorizeFiltersRow.querySelector('#filter-all-btn').addEventListener('click', () => {
          this.filterCategory = 'all';
          this.renderCategoryLists();
          this.renderCalendars();
        });
        this.categorizeFiltersRow.querySelector('#filter-uncat-btn').addEventListener('click', () => {
          this.filterCategory = 'uncategorized';
          this.renderCategoryLists();
          this.renderCalendars();
        });
        this.categorizeFiltersRow.querySelectorAll('[data-filter-key]').forEach(btn => {
          btn.addEventListener('click', () => {
            this.filterCategory = btn.getAttribute('data-filter-key');
            this.renderCategoryLists();
            this.renderCalendars();
          });
        });

        // Tab 2 Custom categories list manager
        let customListHtml = '';
        if (custom.length > 0) {
          custom.forEach(cat => {
            customListHtml += `
              <div class="custom-cat-pill" style="border-color: ${cat.colorHex}">
                <span class="color-dot" style="background-color: ${cat.colorHex}"></span>
                <span class="cat-pill-label">${cat.label}</span>
                <button class="remove-cat-btn" data-delete-key="${cat.key}" title="Supprimer la catégorie">✕</button>
              </div>
            `;
          });
        } else {
          customListHtml = `<div class="no-custom-cats">Aucune catégorie personnalisée. Créez-en une directement depuis la modale de classement d'un événement !</div>`;
        }
        this.customCatsListContainer.innerHTML = customListHtml;

        // Rebind delete key listeners
        this.customCatsListContainer.querySelectorAll('[data-delete-key]').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const key = btn.getAttribute('data-delete-key');
            if (confirm('Voulez-vous supprimer cette catégorie personnalisée ? Tous les événements associés redeviendront non classés.')) {
              this.categoryState.removeCustomCategory(key);
              
              // Cascade clean up
              const updatedOrig = this.agendaState.originalEvents.map(ev => {
                if (ev.categoryKey === key) {
                  return { ...ev, categoryKey: 'uncategorized', originalCategoryKey: 'uncategorized' };
                }
                return ev;
              });
              this.agendaState.setEvents(updatedOrig);
            }
          });
        });
      }

      // --- RENDERING TAB 3: STATS AND KPI ---
      renderStats() {
        const stats = this.agendaState.calculateStats(this.agendaState.simulatedEvents);
        
        // 1. KPI cards rendering
        this.dashboardScoreVal.textContent = `${stats.efficiencyScore} / 100`;
        this.dashboardScoreVal.className = `kpi-value ${this.getScoreColorClass(stats.efficiencyScore)}`;
        this.dashboardScoreFeedback.textContent = this.getScoreFeedback(stats.efficiencyScore);
        
        this.dashboardFocusVal.textContent = `${stats.focusHours} heures`;
        this.dashboardFocusSub.textContent = `${stats.focusBlocksCount} grand${stats.focusBlocksCount > 1 ? 's' : ''} bloc${stats.focusBlocksCount > 1 ? 's' : ''} de focus (>= 90m)`;

        // Fetch meetings stats percentage
        let meetingPct = 0;
        Object.keys(stats.percentagesByCategory).forEach(key => {
          if (key !== 'focus' && key !== 'pause' && key !== 'uncategorized') {
            meetingPct += stats.percentagesByCategory[key] || 0;
          }
        });
        this.dashboardMeetingsVal.textContent = `${stats.meetingHours} heures`;
        this.dashboardMeetingsSub.textContent = `${meetingPct}% de votre temps total d'agenda`;

        // 2. Interactive SVG Donut chart injection
        const categories = this.categoryState.getCategories();
        const activeCategories = categories.filter(c => {
          const hours = stats.hoursByCategory[c.key] || 0;
          return hours > 0;
        });

        const circumference = 2 * Math.PI * 70; // 439.82
        let currentOffset = 0;
        
        let segmentsHtml = '';
        let legendHtml = '';
        
        activeCategories.forEach((cat, index) => {
          const percentage = stats.percentagesByCategory[cat.key] || 0;
          const hours = stats.hoursByCategory[cat.key] || 0;
          
          const strokeLength = (percentage / 100) * circumference;
          const strokeDashArray = `${strokeLength} ${circumference - strokeLength}`;
          const strokeDashOffset = -currentOffset;
          currentOffset += strokeLength;

          // Generate segments SVG path
          segmentsHtml += `
            <circle class="donut-segment" 
                    cx="100" cy="100" r="70" 
                    fill="none" 
                    stroke="${cat.colorHex}" 
                    stroke-width="16" 
                    stroke-dasharray="${strokeDashArray}" 
                    stroke-dashoffset="${strokeDashOffset}" 
                    stroke-linecap="round" 
                    transform="rotate(-90 100 100)" 
                    data-segment-key="${cat.key}">
            </circle>
          `;

          // Generate legend card row
          legendHtml += `
            <div class="legend-item" data-legend-key="${cat.key}">
              <div class="legend-color-box" style="background-color: ${cat.colorHex}"></div>
              <div class="legend-details">
                <span class="legend-label">${cat.label}</span>
                <span class="legend-values">
                  <strong>${hours}h</strong> (${percentage}%)
                </span>
              </div>
            </div>
          `;
        });

        const donutSvgTemplate = `
          <div class="donut-chart-container">
            <div class="chart-wrapper">
              <svg viewBox="0 0 200 200" class="donut-svg">
                <!-- Background track -->
                <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="16"></circle>
                <!-- Dynamic active slices -->
                ${segmentsHtml}
                <!-- Center details -->
                <g class="center-text">
                  <text x="100" y="92" class="score-value">${stats.efficiencyScore}</text>
                  <text x="100" y="112" class="score-label">SCORE</text>
                  <text x="100" y="128" class="score-sub">d'efficacité</text>
                </g>
              </svg>
            </div>
            
            <div class="legend-container">
              ${legendHtml}
            </div>
          </div>
        `;
        this.donutChartTargetContainer.innerHTML = donutSvgTemplate;

        // Bind interactive SVG events (segments <-> legends sync)
        const segments = this.donutChartTargetContainer.querySelectorAll('.donut-segment');
        const legends = this.donutChartTargetContainer.querySelectorAll('.legend-item');

        segments.forEach(seg => {
          const key = seg.getAttribute('data-segment-key');
          const matchingLegend = this.donutChartTargetContainer.querySelector(`[data-legend-key="${key}"]`);
          
          seg.addEventListener('mouseenter', () => {
            seg.classList.add('active');
            if (matchingLegend) matchingLegend.classList.add('hovered');
          });
          seg.addEventListener('mouseleave', () => {
            seg.classList.remove('active');
            if (matchingLegend) matchingLegend.classList.remove('hovered');
          });
        });

        legends.forEach(leg => {
          const key = leg.getAttribute('data-legend-key');
          const matchingSeg = this.donutChartTargetContainer.querySelector(`[data-segment-key="${key}"]`);
          
          leg.addEventListener('mouseenter', () => {
            leg.classList.add('hovered');
            if (matchingSeg) matchingSeg.classList.add('active');
          });
          leg.addEventListener('mouseleave', () => {
            leg.classList.remove('hovered');
            if (matchingSeg) matchingSeg.classList.remove('active');
          });
        });
      }

      getScoreColorClass(score) {
        if (score >= 80) return 'text-focus';
        if (score >= 50) return 'text-warning';
        return 'text-danger';
      }

      getScoreFeedback(score) {
        if (score >= 80) return 'Excellent équilibre de temps !';
        if (score >= 60) return 'Bonne organisation générale.';
        if (score >= 40) return 'Attention à l\'encombrement.';
        return 'Agenda critique, surcharge !';
      }

      // --- RENDERING TAB 4: SIMULATOR GOALS & ACTION PLAN ---
      renderGoalsAndSliders() {
        const categories = this.categoryState.getCategories().filter(c => c.key !== 'uncategorized');
        const stats = this.agendaState.calculateStats(this.agendaState.simulatedEvents);
        
        let goalsHtml = '';
        
        categories.forEach(cat => {
          const actualPct = stats.percentagesByCategory[cat.key] || 0;
          const targetPct = this.agendaState.goal.percentages[cat.key] || 0;
          const cmpState = this.getGoalComparisonState(cat.key, actualPct, targetPct);
          const cmpLabel = this.getGoalComparisonLabel(cat.key, actualPct, targetPct);

          goalsHtml += `
            <div class="goal-input-group" data-goal-key="${cat.key}">
              <div class="goal-input-row">
                <div class="goal-label-group">
                  <span class="color-dot" style="background-color: ${cat.colorHex}"></span>
                  <span class="goal-cat-name">${cat.label.split(' / ')[0]}</span>
                </div>
                
                <div class="goal-value-control">
                  <button type="button" class="btn-adjust-qty" data-adjust-delta="-5" data-adjust-key="${cat.key}">-</button>
                  <span class="goal-qty-display">${targetPct}%</span>
                  <button type="button" class="btn-adjust-qty" data-adjust-delta="5" data-adjust-key="${cat.key}">+</button>
                </div>
              </div>

              <!-- Comparison details -->
              <div class="comparison-bar-wrapper">
                <div class="bar-labels">
                  <span class="lbl-actual">Actuel : <strong>${actualPct}%</strong></span>
                  <span class="lbl-target">Cible : ${targetPct}%</span>
                </div>
                
                <div class="dual-progress-bar">
                  <div class="progress-fill actual-fill" style="width: ${actualPct}%; background-color: ${cat.colorHex};"></div>
                  <div class="target-marker" style="left: ${targetPct}%;" title="Objectif : ${targetPct}%"></div>
                </div>
                
                <div class="comparison-badge ${cmpState}">
                  ${cmpLabel}
                </div>
              </div>
            </div>
          `;
        });

        // Compute goals percentages sum
        const goalSum = Object.values(this.agendaState.goal.percentages).reduce((a, b) => a + b, 0);
        const isValid = goalSum === 100;

        goalsHtml += `
          <div class="goal-sum-row ${isValid ? 'success' : 'error'}">
            <span>Somme des objectifs :</span>
            <strong>${goalSum}%</strong>
          </div>
          <button class="btn btn-primary w-full" id="simulator-save-goal-btn" ${isValid ? '' : 'disabled'}>
            Enregistrer l'objectif
          </button>
        `;

        this.simulatorGoalsFormContainer.innerHTML = goalsHtml;

        // Rebind adjustments delta click listener
        this.simulatorGoalsFormContainer.querySelectorAll('[data-adjust-delta]').forEach(btn => {
          btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-adjust-key');
            const delta = Number(btn.getAttribute('data-adjust-delta'));
            
            const current = this.agendaState.goal.percentages[key] || 0;
            const next = current + delta;
            
            if (next >= 0 && next <= 100) {
              const updatedGoal = {
                percentages: {
                  ...this.agendaState.goal.percentages,
                  [key]: next
                }
              };
              this.agendaState.setGoal(updatedGoal);
            }
          });
        });

        // Save target goal btn
        this.simulatorGoalsFormContainer.querySelector('#simulator-save-goal-btn').addEventListener('click', () => {
          alert('Objectif de répartition enregistré avec succès !');
        });

        // Draw optimization action plan
        this.renderOptimizationPlan();
      }

      getGoalComparisonState(key, actual, target) {
        if (key === 'focus') {
          if (actual >= target) return 'status-success';
          if (actual >= target - 10) return 'status-warning';
          return 'status-danger';
        }
        if (key === 'pause') {
          if (Math.abs(actual - target) <= 2) return 'status-success';
          if (actual < target) return 'status-info';
          return 'status-warning';
        }
        // Meetings
        if (actual <= target) return 'status-success';
        if (actual <= target + 10) return 'status-warning';
        return 'status-danger';
      }

      getGoalComparisonLabel(key, actual, target) {
        if (key === 'focus') {
          if (actual >= target) return '🎯 Objectif Atteint';
          return `⚠️ Manque ${target - actual}%`;
        }
        if (key === 'pause') {
          if (Math.abs(actual - target) <= 2) return '⚖️ Équilibre Atteint';
          if (actual < target) return `💤 À augmenter de ${target - actual}%`;
          return `☕ Excès de ${actual - target}%`;
        }
        if (actual <= target) return '✅ Réduit / Sous contrôle';
        return `🚨 Excès de ${actual - target}%`;
      }

      renderOptimizationPlan() {
        const actions = this.agendaState.getOptimizationActions();
        
        let planHtml = '';
        if (actions.length === 0) {
          planHtml = `
            <div class="empty-actions">
              <p>Cliquez sur les réunions dans l'agenda hebdomadaire pour les raccourcir ou les supprimer afin de voir s'afficher votre plan d'action ici.</p>
            </div>
          `;
        } else {
          // Optimization Plan Checklist
          let listHtml = '';
          actions.forEach(a => {
            let icon = '🔄';
            if (a.type === 'suppression') icon = '❌';
            if (a.type === 'raccourcissement') icon = '⏱️';
            listHtml += `
              <div class="action-item">
                <span class="action-icon">${icon}</span>
                <span class="action-desc">${a.description}</span>
              </div>
            `;
          });

          planHtml = `
            <p class="card-desc">Voici les modifications à appliquer dans Outlook pour atteindre vos objectifs :</p>
            <div class="actions-list">
              ${listHtml}
            </div>

            <!-- Gains summary boxes -->
            <div class="action-gains">
              <strong>🎉 Gains estimés :</strong>
              <span>${this.getSimulatorGainsText()}</span>
            </div>

            <div class="action-buttons-row">
              <button class="btn btn-secondary w-full" id="sim-copy-plan-btn">
                📋 Copier le plan d'action
              </button>
            </div>
          `;
        }

        this.simulatorActionsPlanContainer.innerHTML = planHtml;

        // Rebind copy to clipboard listener
        const copyBtn = this.simulatorActionsPlanContainer.querySelector('#sim-copy-plan-btn');
        if (copyBtn) {
          copyBtn.addEventListener('click', () => {
            this.copyActionPlanToClipboard(actions);
          });
        }
      }

      getSimulatorGainsText() {
        const origEvents = this.agendaState.originalEvents;
        const simEvents = this.agendaState.simulatedEvents;
        
        let origMins = 0;
        let simMins = 0;
        let origFocus = 0;
        let simFocus = 0;

        origEvents.forEach(e => {
          origMins += e.durationMinutes;
          if (e.categoryKey === 'focus') origFocus += e.durationMinutes;
        });

        simEvents.forEach(e => {
          if (e.isDeleted) return;
          simMins += e.durationMinutes;
          if (e.categoryKey === 'focus') simFocus += e.durationMinutes;
        });

        const focusGainMins = simFocus - origFocus;
        const timeSavedMins = origMins - simMins;

        const formatMins = (m) => {
          if (m < 60) return `${m} min`;
          const hrs = Math.floor(m / 60);
          const mins = m % 60;
          return mins > 0 ? `${hrs}h ${mins}m` : `${hrs} heures`;
        };

        let text = '';
        if (timeSavedMins > 0) {
          text += `⏱️ ${formatMins(timeSavedMins)} de réunion libéré`;
        }
        if (focusGainMins > 0) {
          text += text ? ` et 🎯 ${formatMins(focusGainMins)} de concentration supplémentaire !` : `🎯 ${formatMins(focusGainMins)} de concentration supplémentaire !`;
        }

        return text || "Aucun changement pour le moment.";
      }

      copyActionPlanToClipboard(actions) {
        if (actions.length === 0) return;
        
        let copyText = "PLAN D'OPTIMISATION DE MON AGENDA OUTLOOK\n";
        copyText += "========================================\n\n";
        
        actions.forEach((a, idx) => {
          copyText += `${idx + 1}. [ ] ${a.description}\n`;
        });
        
        copyText += `\n🎯 Objectif estimé : ${this.getSimulatorGainsText()}\n`;
        copyText += "\nPlanifié sur l'application Agenda Efficacité.";

        navigator.clipboard.writeText(copyText).then(() => {
          alert('Plan d\'action copié dans votre presse-papiers ! Vous pouvez le coller dans vos notes ou OneNote.');
        }).catch(err => {
          console.error('Erreur de copie dans le presse-papiers', err);
        });
      }

      // --- MODALS TRIGGER FLOW ---
      openAddEventModal(dateStr, hour) {
        this.modalStartDate.value = dateStr;
        this.modalStartTime.value = `${String(hour).padStart(2, '0')}:00`;
        this.modalSubject.value = '';
        this.modalDuration.value = 60;

        this.addEventModal.style.display = 'flex';
        this.modalSubject.focus();
      }

      saveManualEvent() {
        const subject = this.modalSubject.value.trim();
        const startDate = this.modalStartDate.value;
        const startTime = this.modalStartTime.value;
        const durationMinutes = Number(this.modalDuration.value);

        if (!subject || !startDate || !startTime || isNaN(durationMinutes)) return;

        // Auto calculate end times
        const [h, m] = startTime.split(':').map(Number);
        const totalMins = h * 60 + m + durationMinutes;
        const endH = Math.floor(totalMins / 60) % 24;
        const endM = totalMins % 60;
        const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

        // Predict categories
        const categoryKey = this.categoryState.suggestCategory(subject);

        this.agendaState.addManualEvent({
          subject,
          categoryKey,
          startDate,
          startTime,
          endDate: startDate,
          endTime,
          durationMinutes
        });

        this.addEventModal.style.display = 'none';
        
        // Auto navigate forward
        setTimeout(() => {
          this.switchTab('categorize');
        }, 300);
      }

      openCategorizeEventModal(event) {
        this.selectedEventForCat = event;
        
        this.catPreviewSubject.textContent = event.subject;
        this.catPreviewDate.textContent = `📅 ${this.formatDateFrench(event.startDate)}`;
        this.catPreviewTime.textContent = `⏰ ${event.startTime} - ${event.endTime} (${event.durationMinutes} min)`;
        
        // Clean accordion inputs
        this.newCatName.value = '';
        this.createCustomCatBtn.disabled = true;
        this.customCatAccordionContent.style.display = 'none';
        document.getElementById('accordion-arrow').textContent = '▼';

        // Render color picker dots
        let colorsHtml = '';
        this.colorPalette.forEach(col => {
          colorsHtml += `
            <button type="button" class="color-picker-dot ${this.selectedColor === col ? 'selected' : ''}" 
                    style="background-color: ${col}" data-color-dot-val="${col}">
            </button>
          `;
        });
        this.newCatColorPicker.innerHTML = colorsHtml;

        // Color dot listeners
        this.newCatColorPicker.querySelectorAll('[data-color-dot-val]').forEach(dot => {
          dot.addEventListener('click', () => {
            this.selectedColor = dot.getAttribute('data-color-dot-val');
            this.newCatColorPicker.querySelectorAll('.color-picker-dot').forEach(d => d.classList.remove('selected'));
            dot.classList.add('selected');
          });
        });

        // Render categorization selection items grid
        const categories = this.categoryState.getCategories();
        let gridHtml = '';
        
        categories.forEach(cat => {
          const isActive = event.categoryKey === cat.key;
          gridHtml += `
            <button type="button" class="category-select-btn-item ${isActive ? 'active' : ''}" 
                    style="border-color: ${cat.colorHex}aa; background-color: ${isActive ? cat.colorHex + '25' : 'rgba(255,255,255,0.02)'}"
                    data-cat-assign-key="${cat.key}">
              <span class="color-dot" style="background-color: ${cat.colorHex}"></span>
              <span class="cat-btn-label">${cat.label.split(' / ')[0]}</span>
              ${isActive ? '<span class="active-indicator">✓</span>' : ''}
            </button>
          `;
        });
        this.catSelectionGrid.innerHTML = gridHtml;

        // Assign button binding
        this.catSelectionGrid.querySelectorAll('[data-cat-assign-key]').forEach(btn => {
          btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-cat-assign-key');
            this.changeCategory(event.id, key);
            this.categorizeEventModal.style.display = 'none';
            this.selectedEventForCat = null;
          });
        });

        this.categorizeEventModal.style.display = 'flex';
      }

      changeCategory(eventId, categoryKey) {
        this.agendaState.updateEventCategory(eventId, categoryKey);
        
        // Cascades apply change back to core Original as well (Tab 2 spec)
        const updatedOrig = this.agendaState.originalEvents.map(e => {
          if (e.id === eventId) {
            return {
              ...e,
              categoryKey,
              originalCategoryKey: categoryKey
            };
          }
          return e;
        });
        this.agendaState.setEvents(updatedOrig);
      }

      openSimulatorEventModal(event) {
        this.selectedEventForSim = event;

        this.simPreviewSubject.textContent = event.subject;
        this.simPreviewDate.textContent = `📅 ${this.formatDateFrench(event.startDate)}`;
        this.simPreviewTime.textContent = `⏰ ${event.startTime} - ${event.endTime} (${event.durationMinutes} min)`;
        
        this.syncSimModalPresenceControls();
        this.syncSimModalDurationControls();

        // Render categorization selection items grid
        const categories = this.categoryState.getCategories().filter(c => c.key !== 'uncategorized');
        let gridHtml = '';
        
        categories.forEach(cat => {
          const isActive = event.categoryKey === cat.key;
          gridHtml += `
            <button type="button" class="category-select-btn-item ${isActive ? 'active' : ''}" 
                    style="border-color: ${cat.colorHex}aa; background-color: ${isActive ? cat.colorHex + '25' : 'rgba(255,255,255,0.02)'}"
                    data-sim-assign-key="${cat.key}" 
                    ${event.isDeleted ? 'disabled' : ''}>
              <span class="color-dot" style="background-color: ${cat.colorHex}"></span>
              <span class="cat-btn-label">${cat.label.split(' / ')[0]}</span>
              ${isActive ? '<span class="active-indicator">✓</span>' : ''}
            </button>
          `;
        });
        this.simCatSelectionGrid.innerHTML = gridHtml;

        // Assign button binding
        this.simCatSelectionGrid.querySelectorAll('[data-sim-assign-key]').forEach(btn => {
          btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-sim-assign-key');
            this.agendaState.updateEventCategory(event.id, key);
            this.selectedEventForSim.categoryKey = key;
            this.openSimulatorEventModal(this.selectedEventForSim); // re-draw
          });
        });

        this.simulatorAdjustmentsModal.style.display = 'flex';
      }

      syncSimModalPresenceControls() {
        const ev = this.selectedEventForSim;
        if (!ev) return;

        const catColorHex = this.getCategoryColorHex(ev.categoryKey);
        this.simModalPreviewCard.style.borderLeft = `4px solid ${ev.isDeleted ? 'var(--color-danger)' : catColorHex}`;
        this.simPreviewSubject.style.textDecoration = ev.isDeleted ? 'line-through' : 'none';

        if (ev.isDeleted) {
          this.simPreviewBadgeDeleted.style.display = 'inline-flex';
          this.simPreviewBadgeModified.style.display = 'none';
          this.simCancelPresenceBtn.className = 'btn w-full btn-success';
          this.simCancelPresenceBtn.textContent = "🔄 Restaurer l'événement dans l'agenda";
          
          this.simDurationMinus.disabled = true;
          this.simDurationPlus.disabled = true;
          this.simDurationSlider.disabled = true;
        } else {
          this.simPreviewBadgeDeleted.style.display = 'none';
          this.simPreviewBadgeModified.style.display = ev.isModified ? 'inline-flex' : 'none';
          this.simCancelPresenceBtn.className = 'btn w-full btn-danger';
          this.simCancelPresenceBtn.textContent = "❌ Annuler / Supprimer de l'agenda";
          
          this.simDurationMinus.disabled = ev.durationMinutes <= 15;
          this.simDurationPlus.disabled = ev.durationMinutes >= 480;
          this.simDurationSlider.disabled = false;
        }
      }

      syncSimModalDurationControls() {
        const ev = this.selectedEventForSim;
        if (!ev) return;

        this.simDurationText.textContent = ev.durationMinutes;
        this.simDurationSlider.value = ev.durationMinutes;

        // Recompute end times label dynamically
        const [h, m] = ev.startTime.split(':').map(Number);
        const totalMins = h * 60 + m + ev.durationMinutes;
        const endH = Math.floor(totalMins / 60) % 24;
        const endM = totalMins % 60;
        const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
        this.simPreviewTime.textContent = `⏰ ${ev.startTime} - ${endTime} (${ev.durationMinutes} min)`;

        if (ev.isModified && !ev.isDeleted) {
          this.simOriginalDurationText.style.display = 'block';
          this.simOriginalDurationText.textContent = `Durée initiale : ${ev.originalDurationMinutes} min`;
          this.simPreviewBadgeModified.style.display = 'inline-flex';
        } else {
          this.simOriginalDurationText.style.display = 'none';
          if (!ev.isDeleted) this.simPreviewBadgeModified.style.display = 'none';
        }
      }

      formatDateFrench(dateStr) {
        if (!dateStr) return '';
        try {
          const parts = dateStr.split('-');
          if (parts.length === 3) {
            const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
          }
          return dateStr;
        } catch (e) {
          return dateStr;
        }
      }
    }

    // --- LAUNCH APPLICATION RUNTIME ---

export function bootstrapAppController(): AppController {
  return new AppController();
}