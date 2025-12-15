# 🚀 Déploiement sur Vercel

## Architecture localStorage

Cette application utilise **localStorage** pour stocker les grilles et sessions de jeu. Aucune base de données n'est nécessaire !

✅ **Avantages** :

- Déploiement ultra-simple (1 clic)
- Gratuit (pas de base de données à payer)
- Pas de configuration complexe
- Parfait pour un usage personnel/événement

⚠️ **Important** : Les données sont locales à chaque navigateur

## Étapes de déploiement

### 1. Push ton code sur GitHub

```bash
cd /Users/pierrekfoury/www/bingo/bingo-app
git add .
git commit -m "Migration vers localStorage"
git push origin main
```

### 2. Déployer sur Vercel

#### Option A : Via le site web (Recommandé)

1. Va sur [vercel.com/new](https://vercel.com/new)
2. Importe ton repo `Pierre-kfoury/bingo`
3. Configure :
   - **Framework Preset** : Next.js (détecté automatiquement)
   - **Root Directory** : `bingo-app`
4. Clique sur **Deploy** ! 🚀

#### Option B : Via CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

### 3. Configurer Vercel Blob (pour les images)

Après le premier déploiement :

1. Va dans ton projet Vercel
2. Onglet **Storage** → **Create Database**
3. Sélectionne **Blob**
4. Le token `BLOB_READ_WRITE_TOKEN` sera ajouté automatiquement
5. Vercel va redéployer l'app automatiquement ✅

## Architecture

```
┌─────────────────┐
│  Vercel Blob    │  ← Images (cloud)
└─────────────────┘
         ↓
┌─────────────────┐
│   Next.js App   │  ← API upload images
└─────────────────┘
         ↓
┌─────────────────┐
│  localStorage   │  ← Grilles + Sessions (navigateur)
└─────────────────┘
```

## 📝 Variables d'environnement

Une seule variable nécessaire (ajoutée automatiquement par Vercel Blob) :

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx
```

## 🔄 Mises à jour

Après avoir configuré le projet, chaque `git push` déploie automatiquement !

```bash
git add .
git commit -m "Mes modifications"
git push
# Vercel déploie automatiquement ! 🎉
```

## ⚠️ À savoir

### Données locales

- **Grilles** et **sessions** sont stockées dans le navigateur de chaque utilisateur
- Si tu changes de navigateur/appareil, tu ne retrouveras pas tes données
- C'est parfait pour un usage personnel ou un événement ponctuel

### Images

- Les images sont stockées sur Vercel Blob (cloud)
- Elles sont accessibles de n'importe quel navigateur
- Limite gratuite : 1 GB de stockage

## 📱 Utilisation

1. **Upload** : Ajoute tes photos (elles vont sur Vercel Blob)
2. **Générer** : Crée des grilles (stockées en localStorage)
3. **Imprimer** : Imprime les grilles pour distribution
4. **Tirer** : Lance une session de tirage (stockée en localStorage)

## 💡 Conseil Pro

Pour un événement, imprime les grilles à l'avance et utilise seulement la page "Tirage" le jour J !
