// @ts-nocheck
export class CategoryState {
      constructor() {
        this.defaultCategories = [
          {
            key: 'focus',
            label: 'Focus / Concentration',
            color: 'focus',
            colorHex: '#10b981',
            isDefault: true,
            keywords: [
              'focus', 'concentration', 'deep work', 'développement', 'developpement', 'code', 'dev', 'code review',
              'rédaction', 'redaction', 'analyse', 'conception', 'création', 'creation', 'écriture', 'ecriture',
              'étude', 'etude', 'recherche', 'prod', 'production', 'travail individuel', 'concocter', 'réfléchir',
              'design', 'maquette', 'architecture'
            ]
          },
          {
            key: 'meet-int',
            label: 'Réunion Interne',
            color: 'meet-int',
            colorHex: '#6366f1',
            isDefault: true,
            keywords: [
              'sync', 'hebdo', 'équipe', 'equipe', 'point', 'cadrage', 'crd', 'comité', 'comite', 'one-on-one', '1-on-1',
              '1to1', '1-1', 'daily', 'standup', 'sprint', 'rétrospective', 'retrospective', 'revue', 'alignement',
              'synchro', 'bureau', 'réunion interne', 'reunion interne'
            ]
          },
          {
            key: 'meet-ext',
            label: 'Réunion Externe',
            color: 'meet-ext',
            colorHex: '#a855f7',
            isDefault: true,
            keywords: [
              'client', 'partenaire', 'externe', 'démo', 'demo', 'pitch', 'vente', 'négociation', 'negociation',
              'prestataire', 'fournisseur', 'soutenance', 'kickoff', 'lancement', 'atelier client', 'rendez-vous', 'rdv'
            ]
          },
          {
            key: 'admin',
            label: 'Administratif / E-mails',
            color: 'admin',
            colorHex: '#3b82f6',
            isDefault: true,
            keywords: [
              'admin', 'administratif', 'e-mail', 'email', 'emails', 'courrier', 'facture', 'note de frais', 'saisie',
              'compte rendu', 'planning', 'organisation', 'rh', 'formation', 'reporting', 'rapport'
            ]
          },
          {
            key: 'pause',
            label: 'Pause / Temps Perso',
            color: 'pause',
            colorHex: '#f59e0b',
            isDefault: true,
            keywords: [
              'pause', 'déjeuner', 'dejeuner', 'lunch', 'café', 'cafe', 'perso', 'personnel', 'dentiste', 'médecin',
              'medecin', 'sport', 'gym', 'break', 'repos', 'sieste', 'trajet', 'déplacement', 'deplacement'
            ]
          },
          {
            key: 'uncategorized',
            label: 'Non catégorisé',
            color: 'uncategorized',
            colorHex: '#6b7280',
            isDefault: true,
            keywords: []
          }
        ];
        this.categories = [];
        this.subscribers = [];
        this.loadCategories();
      }

      subscribe(callback) {
        this.subscribers.push(callback);
        callback(this.categories);
      }

      notify() {
        this.subscribers.forEach(cb => cb(this.categories));
      }

      loadCategories() {
        const saved = localStorage.getItem('agenda_categories');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            const merged = this.defaultCategories.map(def => {
              const found = parsed.find(p => p.key === def.key);
              return found ? { ...def, ...found } : def;
            });
            const custom = parsed.filter(p => !p.isDefault);
            this.categories = [...merged, ...custom];
          } catch (e) {
            this.categories = [...this.defaultCategories];
          }
        } else {
          this.categories = [...this.defaultCategories];
        }
      }

      saveCategories() {
        localStorage.setItem('agenda_categories', JSON.stringify(this.categories));
        this.notify();
      }

      getCategories() {
        return this.categories;
      }

      addCustomCategory(label, colorHex) {
        const key = 'custom-' + Date.now();
        const newCat = {
          key,
          label,
          color: 'custom',
          colorHex,
          isDefault: false,
          keywords: label.toLowerCase().split(/\s+/)
        };
        const uncategorizedIdx = this.categories.findIndex(c => c.key === 'uncategorized');
        if (uncategorizedIdx !== -1) {
          this.categories.splice(uncategorizedIdx, 0, newCat);
        } else {
          this.categories.push(newCat);
        }
        this.saveCategories();
        return newCat;
      }

      removeCustomCategory(key) {
        if (key.startsWith('custom-')) {
          this.categories = this.categories.filter(c => c.key !== key);
          this.saveCategories();
        }
      }

      suggestCategory(subject) {
        if (!subject) return 'uncategorized';
        const lowerSubject = subject.toLowerCase();
        for (const cat of this.categories) {
          if (cat.key === 'uncategorized') continue;
          for (const keyword of cat.keywords) {
            const escapedKeyword = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const regex = new RegExp(`\\b${escapedKeyword}\\b|${escapedKeyword}`, 'i');
            if (regex.test(lowerSubject)) {
              return cat.key;
            }
          }
        }
        return 'uncategorized';
      }
    }

    // --- STATE 2: AGENDA / SIMULATIONS ---