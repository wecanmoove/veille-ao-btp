# Configuration GitHub Pages

## 1. Créer le repo GitHub

```bash
# Option A : via GitHub web interface
# 1. Aller sur https://github.com/new
# 2. Repository name: "veille-ao-btp"
# 3. Owner: wecanmoove
# 4. Public (pour GitHub Pages)
# 5. Créer

# Option B : via GitHub CLI
gh repo create veille-ao-btp --public --source=. --remote=origin --push
```

## 2. Ajouter le remote et pousser

```bash
# Si créé via web interface
git remote add origin https://github.com/wecanmoove/veille-ao-btp.git
git branch -M main
git push -u origin main

# Pousser la landing page
git push origin main
```

## 3. Configurer GitHub Pages

1. Aller sur **Settings** → **Pages** (ou https://github.com/wecanmoove/veille-ao-btp/settings/pages)
2. **Source** : Deploy from a branch
3. **Branch** : `main`
4. **Folder** : `/docs`
5. Sauvegarder

La landing page sera accessible à : **https://wecanmoove.github.io/veille-ao-btp/**

## 4. Ajouter un badge au README

```markdown
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://wecanmoove.github.io/veille-ao-btp/)
```

## Vérification

- [ ] Repo créé sur GitHub
- [ ] Remote configuré localement
- [ ] Code poussé (branche main)
- [ ] GitHub Pages activé (section Settings)
- [ ] Landing page accessible à `https://wecanmoove.github.io/veille-ao-btp/`

---

**État actuel du repo local :**

```bash
git log --oneline
# a2a5d43 Add GitHub Pages landing page
# 62e082c Initial commit: Veille AO BTP MVP

git remote -v
# (empty pour le moment — à configurer)
```

**Arborescence du projet :**

```
veille-ao-btp/
├── docs/
│   └── index.html                 ← Landing page GitHub Pages
├── src/
│   ├── app/                       ← Next.js app router (pages + API)
│   ├── components/                ← Composants React (badges)
│   └── server/                    ← Backend (connectors, pipeline, scheduler, notifications)
├── prisma/
│   ├── schema.prisma              ← Schéma de base de données
│   └── seed.ts                    ← Données de démonstration
├── scripts/
│   └── sync.ts                    ← Commande sync manuelle CLI
├── instrumentation.ts             ← Point d'entrée scheduler (node-cron)
├── .env.example                   ← Template variables d'environnement
├── README.md                       ← Documentation complète
└── GITHUB_SETUP.md                ← Ce fichier

```

**Prochaines étapes :**

1. Créer le repo GitHub public
2. Pousser le code
3. Activer GitHub Pages (branche main, dossier /docs)
4. Tester la landing page en direct
5. Partager le lien https://wecanmoove.github.io/veille-ao-btp/ 🚀
