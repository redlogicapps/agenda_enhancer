// @ts-nocheck
import { CategoryState } from './category-state.service';

export class AgendaState {
      categoryState: CategoryState;
      originalEvents: any[];
      simulatedEvents: any[];
      goal: { percentages: Record<string, number> };
      subscribersEvents: Array<(events: any[]) => void>;
      subscribersGoal: Array<(goal: any) => void>;
      originalEventsSubscribers?: Array<(events: any[]) => void>;

      constructor(categoryState: CategoryState) {
        this.categoryState = categoryState;
        this.originalEvents = [];
        this.simulatedEvents = [];
        this.goal = {
          percentages: {
            'focus': 40,
            'meet-int': 25,
            'meet-ext': 15,
            'admin': 10,
            'pause': 10
          }
        };
        this.subscribersEvents = [];
        this.subscribersGoal = [];
        this.loadState();
      }

      subscribeEvents(callback) {
        this.subscribersEvents.push(callback);
        callback(this.simulatedEvents);
      }

      subscribeOriginalEvents(callback) {
        // Callback helper designed for sync
        this.originalEventsSubscribers = this.originalEventsSubscribers || [];
        this.originalEventsSubscribers.push(callback);
        callback(this.originalEvents);
      }

      subscribeGoal(callback) {
        this.subscribersGoal.push(callback);
        callback(this.goal);
      }

      notify() {
        this.subscribersEvents.forEach(cb => cb(this.simulatedEvents));
        if (this.originalEventsSubscribers) {
          this.originalEventsSubscribers.forEach(cb => cb(this.originalEvents));
        }
      }

      notifyGoal() {
        this.subscribersGoal.forEach(cb => cb(this.goal));
      }

      loadState() {
        const savedOriginal = localStorage.getItem('agenda_original_events');
        const savedSimulated = localStorage.getItem('agenda_simulated_events');
        const savedGoal = localStorage.getItem('agenda_efficiency_goal');

        if (savedOriginal) {
          try { this.originalEvents = JSON.parse(savedOriginal); } catch(e) {}
        }
        if (savedSimulated) {
          try { this.simulatedEvents = JSON.parse(savedSimulated); } catch(e) {}
        }
        if (savedGoal) {
          try { this.goal = JSON.parse(savedGoal); } catch(e) {}
        }
      }

      saveState() {
        localStorage.setItem('agenda_original_events', JSON.stringify(this.originalEvents));
        localStorage.setItem('agenda_simulated_events', JSON.stringify(this.simulatedEvents));
        localStorage.setItem('agenda_efficiency_goal', JSON.stringify(this.goal));
        this.notify();
      }

      setEvents(events) {
        this.originalEvents = events;
        this.simulatedEvents = events.map(e => ({ ...e }));
        this.saveState();
      }

      setGoal(goal) {
        this.goal = goal;
        localStorage.setItem('agenda_efficiency_goal', JSON.stringify(this.goal));
        this.notifyGoal();
        this.notify(); // Recompute stats
      }

      clearAgenda() {
        this.originalEvents = [];
        this.simulatedEvents = [];
        this.saveState();
      }

      resetSimulation() {
        this.simulatedEvents = this.originalEvents.map(e => ({
          ...e,
          durationMinutes: e.originalDurationMinutes,
          categoryKey: e.originalCategoryKey,
          isDeleted: false,
          isModified: false
        }));
        this.saveState();
      }

      updateEventCategory(eventId, categoryKey) {
        this.simulatedEvents = this.simulatedEvents.map(e => {
          if (e.id === eventId) {
            const isModified = categoryKey !== e.originalCategoryKey || e.durationMinutes !== e.originalDurationMinutes;
            return {
              ...e,
              categoryKey,
              isModified
            };
          }
          return e;
        });
        this.saveState();
      }

      updateEventDuration(eventId, durationMinutes) {
        this.simulatedEvents = this.simulatedEvents.map(e => {
          if (e.id === eventId) {
            const [h, m] = e.startTime.split(':').map(Number);
            const startMinutes = h * 60 + m;
            const endMinutesTotal = startMinutes + durationMinutes;
            const endH = Math.floor(endMinutesTotal / 60) % 24;
            const endM = endMinutesTotal % 60;
            const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
            const isModified = e.categoryKey !== e.originalCategoryKey || durationMinutes !== e.originalDurationMinutes;
            return {
              ...e,
              durationMinutes,
              endTime,
              isModified
            };
          }
          return e;
        });
        this.saveState();
      }

      toggleEventDeleted(eventId) {
        this.simulatedEvents = this.simulatedEvents.map(e => {
          if (e.id === eventId) {
            const isDeleted = !e.isDeleted;
            return {
              ...e,
              isDeleted,
              isModified: isDeleted || e.categoryKey !== e.originalCategoryKey || e.durationMinutes !== e.originalDurationMinutes
            };
          }
          return e;
        });
        this.saveState();
      }

      addManualEvent(eventData) {
        const id = 'manual-' + Date.now();
        const newEvent = {
          ...eventData,
          id,
          originalDurationMinutes: eventData.durationMinutes,
          originalCategoryKey: eventData.categoryKey,
          isDeleted: false,
          isModified: false
        };
        this.originalEvents.push(newEvent);
        this.simulatedEvents.push({ ...newEvent });
        this.saveState();
      }

      deleteEventPermanently(eventId) {
        this.originalEvents = this.originalEvents.filter(e => e.id !== eventId);
        this.simulatedEvents = this.simulatedEvents.filter(e => e.id !== eventId);
        this.saveState();
      }

      calculateStats(events) {
        const activeEvents = events.filter(e => !e.isDeleted);
        const categories = this.categoryState.getCategories();
        
        const hoursByCategory = {};
        categories.forEach(c => hoursByCategory[c.key] = 0);
        
        let totalMinutes = 0;
        let meetingMinutes = 0;
        let focusMinutes = 0;

        activeEvents.forEach(e => {
          const mins = e.durationMinutes;
          totalMinutes += mins;
          
          const key = e.categoryKey || 'uncategorized';
          if (hoursByCategory[key] !== undefined) {
            hoursByCategory[key] += mins;
          } else {
            hoursByCategory[key] = mins;
          }

          if (key !== 'focus' && key !== 'pause' && key !== 'uncategorized') {
            meetingMinutes += mins;
          } else if (key === 'focus') {
            focusMinutes += mins;
          }
        });

        const totalHours = totalMinutes / 60;
        const hoursReport = {};
        const percentagesByCategory = {};

        categories.forEach(c => {
          const mins = hoursByCategory[c.key] || 0;
          hoursReport[c.key] = parseFloat((mins / 60).toFixed(2));
          percentagesByCategory[c.key] = totalMinutes > 0 ? Math.round((mins / totalMinutes) * 100) : 0;
        });

        if (totalMinutes > 0) {
          const sum = Object.values(percentagesByCategory).reduce((a, b) => a + b, 0);
          if (sum !== 100 && sum > 0) {
            const keys = Object.keys(percentagesByCategory);
            const maxKey = keys.reduce((a, b) => percentagesByCategory[a] > percentagesByCategory[b] ? a : b);
            percentagesByCategory[maxKey] += (100 - sum);
          }
        }

        const focusBlocksCount = this.calculateFocusBlocks(activeEvents);
        const efficiencyScore = this.calculateEfficiencyScore(totalMinutes, focusMinutes, meetingMinutes, focusBlocksCount);

        return {
          totalHours: parseFloat(totalHours.toFixed(1)),
          hoursByCategory: hoursReport,
          percentagesByCategory,
          meetingHours: parseFloat((meetingMinutes / 60).toFixed(1)),
          focusHours: parseFloat((focusMinutes / 60).toFixed(1)),
          focusBlocksCount,
          efficiencyScore
        };
      }

      calculateFocusBlocks(events) {
        const focusEvents = events.filter(e => e.categoryKey === 'focus');
        if (focusEvents.length === 0) return 0;

        const sorted = [...focusEvents].sort((a, b) => {
          const dateTimeA = new Date(`${a.startDate}T${a.startTime}`).getTime();
          const dateTimeB = new Date(`${b.startDate}T${b.startTime}`).getTime();
          return dateTimeA - dateTimeB;
        });

        let blocksCount = 0;
        let currentBlockDuration = 0;
        let lastEventEnd = null;

        sorted.forEach(e => {
          const startMs = new Date(`${e.startDate}T${e.startTime}`).getTime();
          const durationMs = e.durationMinutes * 60 * 1000;
          const endMs = startMs + durationMs;

          if (lastEventEnd === null) {
            currentBlockDuration = e.durationMinutes;
          } else {
            const gapMins = (startMs - lastEventEnd) / (1000 * 60);
            if (gapMins <= 15) {
              currentBlockDuration += e.durationMinutes;
            } else {
              if (currentBlockDuration >= 90) {
                blocksCount++;
              }
              currentBlockDuration = e.durationMinutes;
            }
          }
          lastEventEnd = endMs;
        });

        if (currentBlockDuration >= 90) {
          blocksCount++;
        }

        return blocksCount;
      }

      calculateEfficiencyScore(totalMins, focusMins, meetMins, focusBlocks) {
        if (totalMins === 0) return 0;

        const focusPct = (focusMins / totalMins) * 100;
        const meetPct = (meetMins / totalMins) * 100;
        const goal = this.goal.percentages;

        let score = 75;

        const targetFocus = goal['focus'] || 40;
        const focusDiff = focusPct - targetFocus;
        if (focusDiff >= 0) {
          score += Math.min(15, focusDiff * 0.5);
        } else {
          score -= Math.abs(focusDiff) * 1.0;
        }

        let targetMeetings = 0;
        Object.keys(goal).forEach(k => {
          if (k !== 'focus' && k !== 'pause' && k !== 'uncategorized') {
            targetMeetings += goal[k] || 0;
          }
        });
        const meetDiff = meetPct - targetMeetings;
        if (meetDiff > 0) {
          score -= meetDiff * 0.8;
        } else {
          score += Math.min(10, Math.abs(meetDiff) * 0.3);
        }

        if (focusBlocks === 0 && focusPct > 10) {
          score -= 15;
        } else if (focusBlocks >= 3) {
          score += 10;
        } else if (focusBlocks >= 1) {
          score += 5;
        }

        return Math.max(0, Math.min(100, Math.round(score)));
      }

      getOptimizationActions() {
        const original = this.originalEvents;
        const simulated = this.simulatedEvents;
        const actions = [];

        simulated.forEach(simEvent => {
          const origEvent = original.find(o => o.id === simEvent.id);
          if (!origEvent) return;

          if (simEvent.isDeleted) {
            actions.push({
              eventId: simEvent.id,
              subject: simEvent.subject,
              type: 'suppression',
              description: `Supprimer la réunion « ${simEvent.subject} » (${origEvent.durationMinutes} min libérées)`
            });
          } else {
            if (simEvent.durationMinutes < origEvent.durationMinutes) {
              const delta = origEvent.durationMinutes - simEvent.durationMinutes;
              actions.push({
                eventId: simEvent.id,
                subject: simEvent.subject,
                type: 'raccourcissement',
                description: `Raccourcir la réunion « ${simEvent.subject} » de ${origEvent.durationMinutes} min à ${simEvent.durationMinutes} min (gain de ${delta} min)`
              });
            }
            if (simEvent.categoryKey !== origEvent.categoryKey) {
              const oldLabel = this.categoryState.getCategories().find(c => c.key === origEvent.categoryKey)?.label || 'Non classé';
              const newLabel = this.categoryState.getCategories().find(c => c.key === simEvent.categoryKey)?.label || 'Non classé';
              actions.push({
                eventId: simEvent.id,
                subject: simEvent.subject,
                type: 'recategorisation',
                description: `Reclasser « ${simEvent.subject} » de "${oldLabel}" à "${newLabel}"`
              });
            }
          }
        });

        return actions;
      }

      parseOutlookCSV(csvText) {
        if (!csvText || csvText.trim() === '') return [];

        const firstLine = csvText.split('\n')[0];
        const delimiter = firstLine.split(';').length > firstLine.split(',').length ? ';' : ',';

        const lines = [];
        let currentLine = [];
        let currentField = '';
        let inQuotes = false;

        for (let i = 0; i < csvText.length; i++) {
          const char = csvText[i];
          const nextChar = csvText[i + 1];

          if (inQuotes) {
            if (char === '"') {
              if (nextChar === '"') {
                currentField += '"';
                i++;
              } else {
                inQuotes = false;
              }
            } else {
              currentField += char;
            }
          } else {
            if (char === '"') {
              inQuotes = true;
            } else if (char === delimiter) {
              currentLine.push(currentField.trim());
              currentField = '';
            } else if (char === '\r' || char === '\n') {
              if (char === '\r' && nextChar === '\n') {
                i++;
              }
              currentLine.push(currentField.trim());
              lines.push(currentLine);
              currentLine = [];
              currentField = '';
            } else {
              currentField += char;
            }
          }
        }
        
        if (currentField !== '' || currentLine.length > 0) {
          currentLine.push(currentField.trim());
          lines.push(currentLine);
        }

        if (lines.length <= 1) return [];

        const headers = lines[0].map(h => h.toLowerCase().trim());
        const rawData = lines.slice(1).filter(l => l.length >= Math.min(3, headers.length));

        const findHeaderIndex = (keys) => {
          return headers.findIndex(h => keys.some(key => h.includes(key)));
        };

        const idxSubject = findHeaderIndex(['sujet', 'subject', 'objet', 'title', 'titre']);
        const idxStartDate = findHeaderIndex(['date de début', 'date de debut', 'start date', 'début', 'debut', 'start']);
        const idxStartTime = findHeaderIndex(['heure de début', 'heure de debut', 'start time']);
        const idxEndDate = findHeaderIndex(['date de fin', 'end date', 'fin', 'end']);
        const idxEndTime = findHeaderIndex(['heure de fin', 'end time']);
        const idxDuration = findHeaderIndex(['durée', 'duree', 'duration']);

        const events = [];

        rawData.forEach((row, rowIndex) => {
          if (row.length === 0 || (row.length === 1 && row[0] === '')) return;

          const subject = idxSubject !== -1 && row[idxSubject] ? row[idxSubject] : 'Sans titre';
          
          let rawStartDate = idxStartDate !== -1 ? row[idxStartDate] : '';
          let startTime = idxStartTime !== -1 ? row[idxStartTime] : '09:00';
          
          if (!rawStartDate) return;

          if (rawStartDate.includes(' ') && (startTime === '09:00' || idxStartTime === -1)) {
            const parts = rawStartDate.split(' ');
            rawStartDate = parts[0];
            startTime = parts[1] ? parts[1].substring(0, 5) : '09:00';
          }

          const startDate = this.standardizeDate(rawStartDate);
          startTime = this.standardizeTime(startTime);

          let rawEndDate = idxEndDate !== -1 ? row[idxEndDate] : rawStartDate;
          if (rawEndDate.includes(' ')) {
            rawEndDate = rawEndDate.split(' ')[0];
          }
          const endDate = this.standardizeDate(rawEndDate || rawStartDate);
          let endTime = idxEndTime !== -1 ? row[idxEndTime] : '';
          if (endTime.includes(' ')) {
            endTime = endTime.split(' ')[1];
          }
          endTime = this.standardizeTime(endTime || this.addMinutesToTime(startTime, 60));

          let durationMinutes = 60;
          if (idxDuration !== -1 && row[idxDuration]) {
            const durVal = row[idxDuration].replace(/[^\d:]/g, '');
            if (durVal.includes(':')) {
              const [h, m] = durVal.split(':').map(Number);
              durationMinutes = h * 60 + m;
            } else {
              durationMinutes = parseInt(durVal, 10) || 60;
            }
          } else {
            try {
              const startDT = new Date(`${startDate}T${startTime}`);
              const endDT = new Date(`${endDate}T${endTime}`);
              const diffMs = endDT.getTime() - startDT.getTime();
              if (diffMs > 0) {
                durationMinutes = Math.round(diffMs / (1000 * 60));
              }
            } catch (e) {
              durationMinutes = 60;
            }
          }

          const categoryKey = 'uncategorized';

          events.push({
            id: `csv-${rowIndex}-${Date.now()}`,
            subject,
            startDate,
            startTime,
            endDate,
            endTime,
            durationMinutes,
            categoryKey,
            originalDurationMinutes: durationMinutes,
            originalCategoryKey: categoryKey,
            isDeleted: false,
            isModified: false
          });
        });

        return events;
      }

      standardizeDate(dateStr) {
        if (!dateStr) return new Date().toISOString().split('T')[0];
        const cleaned = dateStr.trim().replace(/[^\d\/\-]/g, '');
        const parts = cleaned.split(/[\/\-]/);
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          } else {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
            return `${year}-${month}-${day}`;
          }
        }
        return new Date().toISOString().split('T')[0];
      }

      standardizeTime(timeStr) {
        if (!timeStr) return '09:00';
        let cleaned = timeStr.trim();
        const isPM = cleaned.toLowerCase().includes('pm');
        const isAM = cleaned.toLowerCase().includes('am');
        cleaned = cleaned.replace(/[^\d:]/g, '');
        const parts = cleaned.split(':');
        if (parts.length >= 2) {
          let h = parseInt(parts[0], 10);
          const m = parts[1].substring(0, 2).padStart(2, '0');
          if (isPM && h < 12) h += 12;
          if (isAM && h === 12) h = 0;
          return `${String(h).padStart(2, '0')}:${m}`;
        } else if (parts.length === 1 && parts[0] !== '') {
          const h = parseInt(parts[0], 10);
          return `${String(h).padStart(2, '0')}:00`;
        }
        return '09:00';
      }

      addMinutesToTime(timeStr, minutes) {
        const [h, m] = timeStr.split(':').map(Number);
        const totalMins = h * 60 + m + minutes;
        const nextH = Math.floor(totalMins / 60) % 24;
        const nextM = totalMins % 60;
        return `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`;
      }
    }

    // --- APPLICATION MAIN CONTROLLER ---