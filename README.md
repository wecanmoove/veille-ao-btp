# Veille AO BTP — Système de surveillance automatisée des appels d'offres

Plateforme web de veille automatisée sur les appels d'offres du secteur du bâtiment, réhabilitation et travaux, avec scoring IA, alertes multi-canal et dédoublonnage inter-sources.

## 🎯 Objectif

Détecter, qualifier et alerter automatiquement sur les **appels d'offres pertinents** dans les domaines :
- Réhabilitation / rénovation énergétique
- Gros œuvre et second œuvre
- Travaux tous corps d'état (TCE)
- Maintenance / entretien de bâtiments

## ✨ Fonctionnalités

- **Collecte multi-sources** : BOAMP (API réelle) + PLACE, France Marchés (connecteurs mockés prêts à brancher)
- **Filtrage métier BTP** : Préfiltrage déterministe (mots-clés, CPV) + scoring IA (OpenAI) avec fallback règles
- **Dédoublonnage** : Intra et inter-sources via hash normalisé
- **Scheduler autonome** : node-cron avec cron configurable par source, verrou anti-chevauchement
- **Alertes multi-canal** : Email (Resend), Slack (webhook), anti-doublon d'alertes
- **Dashboard intuitif** : Filtrage multicritères, fiche détail, historique syncs & notifications
- **Configuration UI** : Sources, fréquences cron, seuils alertes, destinataires
- **Journal d'erreurs** minimal pour la troubleshooting

## 🏗️ Architecture

```
Frontend (Next.js App Router)
  ├─ /ao          — Dashboard & fiche détail
  ├─ /config      — Configuration sources, alertes, scheduler
  ├─ /historique  — Historique des synchronisations
  ├─ /notifications-log — Historique des alertes
  └─ /erreurs     — Journal d'erreurs

Backend (Node.js)
  ├─ /api/tenders         — CRUD + filtres
  ├─ /api/sources         — Gestion sources
  ├─ /api/sync/[slug]     — Sync manuelle
  ├─ /api/sync-runs       — Historique syncs
  ├─ /api/notifications   — Historique alertes
  ├─ /api/errors          — Journal d'erreurs
  └─ /api/settings/alerts — Configuration alertes

Pipeline
  1. Collecte (connecteurs)
  2. Normalisation
  3. Dédoublonnage (dedupKey hash)
  4. Filtrage métier BTP (règles + CPV)
  5. Scoring (IA avec fallback)
  6. Stockage (Prisma + SQLite/PostgreSQL)
  7. Alertes (Email + Slack)

Scheduler
  └─ node-cron : exécution par source, verrou mémoire, retry simple
```

## 🚀 Démarrage rapide

### Prérequis
- Node.js 24+
- npm
- (Optionnel) PostgreSQL pour la production ; SQLite par défaut en dev

### Installation

```bash
# Cloner et installer
git clone https://github.com/wecanmoove/veille-ao-btp.git
cd veille-ao-btp
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env si besoin (clés API, destinataires email, webhook Slack)

# Initialiser la DB
npm run db:push
npm run db:seed  # Données de démonstration

# Développement
npm run dev
# Ouvrir http://localhost:3000/ao
```

### Commandes disponibles

```bash
npm run dev              # Serveur dev (avec hot reload)
npm run build            # Build production
npm start                # Serveur production
npm run typecheck        # Vérifier les types TypeScript
npm run lint             # ESLint

npm run db:push          # Appliquer le schéma Prisma
npm run db:seed          # Charger données de démonstration
npm run db:studio        # UI Prisma Studio

npm run sync             # Synchronisation manuelle (toutes sources)
npm run sync boamp       # Synchronisation manuelle d'une source
```

## 🔧 Configuration

### Variables d'environnement (`.env`)

```env
# Base de données
DATABASE_URL="file:./dev.db"  # SQLite (dev) ou PostgreSQL (prod)

# IA & scoring
OPENAI_API_KEY=               # Optionnelle ; fallback sur règles si absente
OPENAI_MODEL=gpt-4o-mini

# Notifications email
EMAIL_PROVIDER=console        # "resend" pour la vraie API, "console" pour logs
RESEND_API_KEY=
EMAIL_FROM=veille@example.com
ALERT_EMAIL_TO=contact@example.com

# Notifications Slack
SLACK_WEBHOOK_URL=

# Seuils alertes
ALERT_MIN_SCORE=60            # 0-100
ALERT_MODE=instant            # "instant" ou "digest"
ALERT_DIGEST_CRON="0 7,13,18 * * *"
ALERT_INCLUDE_A_VERIFIER=false

# Application
APP_BASE_URL=http://localhost:3000
SYNC_LOOKBACK_DAYS=3
AI_MAX_PER_RUN=40
```

### Page Configuration (UI)

1. **Sources** : Activer/désactiver, modifier cron et timezone par source
2. **Alertes** : Email, Slack, score minimal, mode instant/digest
3. **Synchronisation** : Lancer un run manuel depuis l'UI
4. **Mots-clés métier** : Liste des mots-clés BTP utilisés par le filtrage (lecture seule MVP)

## 📊 Pipeline de filtrage métier BTP

### 1. Préfiltrage déterministe
- Mots-clés métier (réhabilitation, gros œuvre, isolation, etc.)
- Pondération CPV division 45 (travaux de construction)
- Détection mots-clés d'exclusion (fournitures, services généraux, nettoyage)

### 2. Scoring IA (avec fallback)
- Analyse titre, description, CPV, localisation
- Classification : score (0-100), niveau (très_pertinent | pertinent | à_verifier | non_pertinent)
- Catégorie travaux : réhabilitation, rénovation, gros_oeuvre, second_oeuvre, TCE, maintenance, hors_cible
- Justification courte + raison d'exclusion

### 3. Résultat final
Annonce stockée avec scoring et historique de filtrage visible en UI.

## 🔗 Sources de données

### Phase 1 (MVP) — Implémenté

| Source | État | Type | Fréquence par défaut |
|--------|------|------|----------------------|
| **BOAMP** | ✅ Réel (API Opendatasoft) | API | Toutes les 4h |
| **PLACE / Chorus Pro** | ⚠️ Mocké (structure prête) | Mock | 2x par jour |
| **France Marchés** | ⚠️ Mocké (structure prête) | Mock | 1x par jour |

### Phase 2 (TODO)
- Profils d'acheteurs du 13 (hétérogènes, scraping si nécessaire)
- Presse spécialisée BTP (RSS + extraction)
- Dédoublonnage inter-sources avancé
- Scoring IA plus fin

## 💡 Points clés d'architecture

### Anti-chevauchement
Verrou par source en mémoire (`Set<sourceSlug>`) pour éviter les exécutions simultanées.

### Dédoublonnage
```
dedupKey = sha256(normalize(titre) + "|" + normalize(acheteur))
```
Une même annonce sur plusieurs sources = un seul enregistrement Tender avec historique.

### Scoring
```
scoreWithRules()          // Déterministe (mots-clés + CPV)
  ↓
scoreNotice() [IA]        // Si clé OpenAI + quota disponible
  ↓
Fallback auto sur rules   // En cas d'erreur IA
```

### Notifications
- Unique(tenderId, channel) : une seule alerte par annonce/canal
- Retry simple (3 tentatives avec backoff)
- Statuts : pending, sent, failed, skipped
- Mode instant : alerte immédiate si pertinente
- Mode digest : regroupement planifié

## 🔐 Sécurité

- Validation entrées (Zod)
- HTTPS recommandé en production
- Variables d'environnement pour clés API
- Pas de secrets en git (`.env` ignored)
- Logs centralisés en DB (ErrorLog)

## 📈 Observabilité

- **SyncRun** : Historique exécutions (dates, statistiques, erreurs)
- **Notification** : État envois (attempted, success, failure)
- **ErrorLog** : Journal centralisé (scope, message, detail)
- **Dashboard** : Vue temps réel de l'état des sources

## 🧪 Test & Validation

```bash
# Typecheck
npm run typecheck

# Lint
npm run lint

# Build complet
npm run build

# Démonstration locale
npm run dev
# → Visiter http://localhost:3000/ao (dashboard avec données seed)
# → /config pour tester la synchronisation manuelle
```

## 📚 Documentation supplémentaire

- **Architecture détaillée** : `docs/ARCHITECTURE.md` (todo)
- **Guide d'exploitation** : `docs/OPERATIONS.md` (todo)
- **Intégration IA** : Voir `src/server/pipeline/ai-scoring.ts`
- **Connecteurs** : Voir `src/server/connectors/`

## 🤝 Contribution

Structure modulaire prête pour :
- Ajouter une nouvelle source : créer `src/server/connectors/[source].ts` implémentant `SourceConnector`
- Intégrer un nouveau canal d'alerte : créer un `Provider` dans `src/server/notifications/`
- Étendre le scoring : modifier `src/server/pipeline/btp-keywords.ts` ou prompts IA

## 📝 Licence

À spécifier.

## 📧 Contact

- Repo : https://github.com/wecanmoove/veille-ao-btp
- Issues : GitHub Issues
- Feedback : Ouvert aux contributions

---

**État du MVP** : Fonctionnel, prêt pour intégration BOAMP réelle et tests en conditions réelles.  
**Dernière mise à jour** : Juillet 2026
