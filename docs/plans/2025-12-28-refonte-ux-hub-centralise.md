# Refonte UX : Hub centralisé pour simplifier l'expérience utilisateur

**Date :** 2025-12-28
**Objectif :** Simplifier l'expérience utilisateur en résolvant la confusion entre "bingo/grille" et en centralisant la navigation fragmentée

---

## Problèmes identifiés

### 1. Confusion terminologique
- **Bingo** vs **Grille** : Vocabulaire technique peu intuitif
- Les utilisateurs ne comprennent pas que le "bingo" est la configuration et les "grilles" sont les cartes générées

### 2. Navigation fragmentée
- 5 pages séparées (Home, Create, Grilles, Images, Tirage) fragmentent l'expérience
- Perte de contexte entre les pages
- Difficile de comprendre le flux global

### 3. Point positif à conserver
- Le workflow de création (3 étapes) est bien conçu et apprécié

---

## Solution adoptée : Hub centralisé

### Vue d'ensemble

**Approche :** Après création, rediriger vers une page "Mon jeu" qui centralise toutes les fonctionnalités dans une interface tout-en-un.

### Nouveau vocabulaire

| Ancien terme | Nouveau terme | Contexte |
|--------------|---------------|----------|
| Bingo | Jeu | Configuration d'un jeu de bingo |
| Grille / Grid | Carte | Carte de bingo individuelle |
| Tirage | Tirage | Mode de jeu (conservé) |
| Grid Group | Groupe de cartes | Container batch (ou supprimé) |

---

## Architecture de navigation

### Nouvelle structure des routes

```
app/
├── page.tsx                    # Liste de tous les jeux
├── creer/page.tsx             # Workflow création (3 étapes)
├── jeu/[id]/page.tsx          # 🆕 Hub tout-en-un
├── cartes/
│   ├── [id]/page.tsx          # Impression 1 carte
│   └── print/page.tsx         # Impression multi-cartes
└── api/images/route.ts        # Inchangé

🗑️ SUPPRIMÉS :
- grilles/ (tout le dossier)
- images/page.tsx
- tirage/page.tsx
- create/ (renommé creer/)
```

### Navigation simplifiée

**Avant :**
```
[Home] [Create] [Grilles] [Images] [Tirage] [Print]
+ Indicateur de jeu actif
```

**Après :**
```
[Mes jeux] [+ Créer un jeu]
```

### Parcours utilisateur

```
1. HOME (/)
   ↓ Clic "Créer un nouveau jeu"

2. CRÉATION (/creer)
   Step 1 → Step 2 → Step 3
   ↓ Confirmer

3. HUB DU JEU (/jeu/[id])  🆕
   └─ Toutes les actions disponibles ici

4. IMPRESSION (/cartes/[id] ou /cartes/print)
   └─ Depuis section "Mes cartes" du Hub
```

---

## Structure de la page Hub

### Layout Desktop (>768px)

```
┌──────────────────────────────────────────────────┐
│  Header du jeu                                   │
│  ┌────────────────────────────────────────────┐ │
│  │ 🎮 Bingo de Noël                           │ │
│  │ 5×5 • 24 joueurs • 1 carte/page            │ │
│  │ [✏️ Modifier] [🗑️ Supprimer] [⚙️ Params]   │ │
│  └────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────┤
│  📄 Mes cartes (24 cartes générées)             │
│  ┌────────────────────────────────────────────┐ │
│  │ [✓ Tout sélectionner] [🖨️ Imprimer (0)]   │ │
│  │                                             │ │
│  │ Grid des cartes (miniatures 4 colonnes)    │ │
│  │ [Carte 1□] [Carte 2□] [Carte 3□]...        │ │
│  │ Checkbox pour sélection multi              │ │
│  │                                             │ │
│  │ Clic sur carte → ouvre /cartes/[id]        │ │
│  └────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────┤
│  🖼️ Mes images (18 images)                      │
│  ┌────────────────────────────────────────────┐ │
│  │ [+ Ajouter images] [🗑️ Tout supprimer]    │ │
│  │                                             │ │
│  │ Grid des images (miniatures 6 colonnes)    │ │
│  │ [img] [img] [img]... (hover → delete)      │ │
│  │                                             │ │
│  │ Minimum requis : 8/18 ✓                    │ │
│  └────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────┤
│  🎲 Tirage                                       │
│  ┌────────────────────────────────────────────┐ │
│  │ [+ Nouvelle session]                        │ │
│  │                                             │ │
│  │ Session 1 : 12/18 images tirées            │ │
│  │ [▶️ Continuer] [🔄 Réinitialiser] [🗑️]     │ │
│  │                                             │ │
│  │ Session 2 : 5/18 images tirées             │ │
│  │ [▶️ Continuer] [🔄 Réinitialiser] [🗑️]     │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### Layout Mobile (<768px)

```
┌──────────────────┐
│  Header (stack)  │
│  Titre           │
│  Stats           │
│  [Actions]       │
├──────────────────┤
│  Tabs sticky     │
│ [Cartes|Img|🎲] │
├──────────────────┤
│  Contenu onglet  │
│  actif           │
│                  │
└──────────────────┘
```

**Adaptations mobile :**
- Tabs au lieu de scroll pour naviguer entre sections
- Grid adaptatif : Cartes 2 col, Images 3 col
- Actions en floating action buttons
- Mode sélection avec toggle button

---

## Architecture des composants

### Structure finale

```
src/
├── app/
│   ├── page.tsx                    # Home - Liste des jeux
│   ├── creer/page.tsx             # Création (3 étapes)
│   ├── jeu/[id]/page.tsx          # 🆕 Page Hub principale
│   ├── cartes/
│   │   ├── [id]/page.tsx          # Print individuel
│   │   └── print/page.tsx         # Print multi-cartes
│   └── api/images/route.ts         # Inchangé
│
├── components/
│   ├── Navigation.tsx              # Simplifié (2 items)
│   │
│   ├── jeu/                        # 🆕 Composants du Hub
│   │   ├── JeuHeader.tsx          # Header avec nom, stats, actions
│   │   ├── SectionCartes.tsx      # Section cartes avec sélection
│   │   ├── SectionImages.tsx      # Section images avec upload
│   │   ├── SectionTirage.tsx      # Section sessions de tirage
│   │   ├── CarteMiniature.tsx     # Miniature carte avec checkbox
│   │   └── TabNavigation.tsx      # Navigation par onglets (mobile)
│   │
│   ├── create/                     # Inchangé
│   │   ├── StepParameters.tsx
│   │   ├── StepUpload.tsx
│   │   ├── StepRecap.tsx
│   │   └── LivePreview.tsx
│   │
│   ├── CarteGrid.tsx              # Renommé de BingoGrid.tsx
│   ├── TirageAnimation.tsx        # Inchangé
│   ├── ImageUploader.tsx          # Réutilisé dans SectionImages
│   └── ConfirmModal.tsx           # Inchangé
│
└── lib/
    └── supabase/
        ├── jeu.ts                 # Renommé de bingo.ts
        ├── cartes.ts              # Renommé de grids.ts
        ├── images.ts              # Inchangé
        └── sessions.ts            # Inchangé (tirage)
```

### Nouveaux composants clés

#### 1. JeuHeader
Affiche le nom du jeu, statistiques et actions principales.

```tsx
interface JeuHeaderProps {
  jeu: Jeu
  onEdit: () => void
  onDelete: () => void
}
```

#### 2. SectionCartes
Grid de miniatures avec sélection multiple et bouton impression.

```tsx
interface SectionCartesProps {
  cartes: Carte[]
  isLoading: boolean
  jeuId: string
}
```

#### 3. SectionImages
Gestion des images avec upload et suppression.

```tsx
interface SectionImagesProps {
  images: JeuImage[]
  isLoading: boolean
  jeuId: string
  minRequired: number
}
```

#### 4. SectionTirage
Liste des sessions de tirage avec actions.

```tsx
interface SectionTirageProps {
  sessions: SessionTirage[]
  isLoading: boolean
  jeuId: string
  totalImages: number
}
```

#### 5. TabNavigation (mobile uniquement)
Navigation par onglets pour mobile.

```tsx
const tabs = [
  { id: 'cartes', icon: '📄', label: 'Cartes' },
  { id: 'images', icon: '🖼️', label: 'Images' },
  { id: 'tirage', icon: '🎲', label: 'Tirage' }
]
```

---

## Types et services

### Types renommés

```ts
// lib/supabase/types.ts

// AVANT → APRÈS
Bingo → Jeu
BingoImage → JeuImage
Grid → Carte
GridGroup → GroupeCartes
DrawSession → SessionTirage
```

### Services renommés

```ts
lib/supabase/
├── jeu.ts          // bingo.ts - CRUD jeux
├── cartes.ts       // grids.ts - CRUD cartes
├── images.ts       // Inchangé - CRUD images
└── sessions.ts     // Inchangé - CRUD sessions tirage
```

### Context simplifié

```tsx
// lib/supabase/context.tsx
export const JeuContext = createContext({
  jeu: Jeu | null
  setJeu: (jeu: Jeu) => void
  cartes: Carte[]
  images: JeuImage[]
  sessions: SessionTirage[]
})
```

---

## Flux de données

### Chargement de la page Hub

La page `/jeu/[id]` charge en parallèle :

```tsx
export default function JeuHubPage({ params }) {
  const { data: jeu, isLoading: jeuLoading } = useJeu(params.id)
  const { data: cartes, isLoading: cartesLoading } = useCartes(params.id)
  const { data: images, isLoading: imagesLoading } = useImages(params.id)
  const { data: sessions, isLoading: sessionsLoading } = useSessions(params.id)

  if (jeuLoading) return <JeuHeaderSkeleton />
  if (!jeu) return <JeuNotFound />

  return (
    <>
      <JeuHeader jeu={jeu} />
      <SectionCartes cartes={cartes} isLoading={cartesLoading} />
      <SectionImages images={images} isLoading={imagesLoading} />
      <SectionTirage sessions={sessions} isLoading={sessionsLoading} />
    </>
  )
}
```

**Avantages :**
- Chaque section charge indépendamment
- Header s'affiche immédiatement
- Sections montrent skeleton pendant le chargement
- Erreur dans une section n'affecte pas les autres

### Sélection et impression multi-cartes

```tsx
// State local dans SectionCartes
const [selectedCartes, setSelectedCartes] = useState<string[]>([])

// Bouton "Imprimer (3)"
const handlePrint = () => {
  router.push(`/cartes/print?ids=${selectedCartes.join(',')}`)
}
```

### Actions optimistes

Pour une UX fluide, certaines actions s'affichent immédiatement :

```tsx
const deleteImage = async (imageId: string) => {
  // Update UI immédiatement
  setImages(images.filter(img => img.id !== imageId))

  try {
    await deleteImageFromDB(imageId)
  } catch (error) {
    // Rollback en cas d'erreur
    setImages(prevImages)
    toast.error("Erreur lors de la suppression")
  }
}
```

---

## Gestion des états

### Loading states

Chaque section gère son propre loading :
- `<JeuHeaderSkeleton />` pendant chargement du jeu
- `<CartesGridSkeleton />` pendant chargement des cartes
- `<ImagesGridSkeleton />` pendant chargement des images
- `<SessionsListSkeleton />` pendant chargement des sessions

### Gestion des erreurs

1. **Jeu introuvable** : `<JeuNotFound />` avec bouton retour home
2. **Erreur de chargement section** : Bouton "Réessayer" dans la section concernée
3. **Erreur upload/delete** : Toast notification
4. **Aucune carte générée** : Message + bouton "Modifier le jeu" pour régénérer

### États vides

- **Aucune carte** : "Aucune carte générée. Modifiez votre jeu pour en générer."
- **Aucune image** : "Ajoutez au moins 8 images pour générer des cartes."
- **Aucune session** : "Créez une session pour commencer à jouer."

---

## Performance

### Optimisations

1. **Lazy loading images** : Images chargées progressivement avec `loading="lazy"`
2. **Virtualisation** : Si >100 cartes, utiliser `react-window` pour la grid
3. **Pagination** : Afficher 24 cartes par défaut + bouton "Voir plus"

### Cache Supabase

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
})
```

### Compression images

Conserver la compression existante (`lib/compress-image.ts`) pour optimiser le stockage.

---

## Design responsive

### Breakpoints

```css
/* Mobile */
@media (max-width: 768px) {
  /* Tabs navigation */
  /* Grid 2 colonnes (cartes) */
  /* Grid 3 colonnes (images) */
}

/* Desktop */
@media (min-width: 769px) {
  /* Scroll layout */
  /* Grid 4 colonnes (cartes) */
  /* Grid 6 colonnes (images) */
}
```

### Composant responsive

```tsx
const isMobile = useMediaQuery('(max-width: 768px)')

return isMobile ? (
  <TabLayout tabs={tabs}>
    {activeTab === 'cartes' && <SectionCartes />}
    {activeTab === 'images' && <SectionImages />}
    {activeTab === 'tirage' && <SectionTirage />}
  </TabLayout>
) : (
  <ScrollLayout>
    <SectionCartes />
    <SectionImages />
    <SectionTirage />
  </ScrollLayout>
)
```

---

## Plan de migration

### Étape 1 : Préparation
- [ ] Créer les nouveaux types (Jeu, Carte, etc.)
- [ ] Renommer les services (jeu.ts, cartes.ts)
- [ ] Créer le JeuContext

### Étape 2 : Nouveaux composants
- [ ] JeuHeader
- [ ] SectionCartes
- [ ] SectionImages
- [ ] SectionTirage
- [ ] TabNavigation (mobile)
- [ ] CarteMiniature

### Étape 3 : Nouvelle page Hub
- [ ] Créer `/jeu/[id]/page.tsx`
- [ ] Intégrer les 4 composants principaux
- [ ] Implémenter le responsive (tabs mobile)

### Étape 4 : Adaptation du workflow création
- [ ] Renommer `/create` → `/creer`
- [ ] Mettre à jour la redirection finale vers `/jeu/[id]`
- [ ] Mettre à jour le vocabulaire (Jeu au lieu de Bingo)

### Étape 5 : Page d'impression
- [ ] Renommer `/grilles/[id]` → `/cartes/[id]`
- [ ] Créer `/cartes/print` pour impression multi-cartes
- [ ] Gérer le paramètre `?ids=1,2,3`

### Étape 6 : Navigation
- [ ] Simplifier Navigation.tsx (2 items uniquement)
- [ ] Mettre à jour tous les liens

### Étape 7 : Suppression de l'ancien
- [ ] Supprimer `/grilles`
- [ ] Supprimer `/images/page.tsx`
- [ ] Supprimer `/tirage/page.tsx`
- [ ] Nettoyer les anciens types/services

### Étape 8 : Tests
- [ ] Tester le workflow complet
- [ ] Tester responsive mobile/desktop
- [ ] Tester sélection et impression multi-cartes
- [ ] Tester gestion des erreurs

---

## Bénéfices attendus

### UX améliorée
- ✅ Vocabulaire clair et intuitif ("Jeu", "Cartes")
- ✅ Navigation simplifiée (2 items au lieu de 6)
- ✅ Tout centralisé dans une page hub
- ✅ Contexte jamais perdu

### Performance
- ✅ Chargement parallèle des sections
- ✅ Lazy loading des images
- ✅ Actions optimistes pour réactivité

### Maintenance
- ✅ Code plus simple (moins de pages)
- ✅ Composants réutilisables et isolés
- ✅ Types cohérents et clairs

### Mobile
- ✅ Navigation par onglets adaptée
- ✅ Grids responsive
- ✅ Actions accessibles (FAB)

---

## Notes techniques

### Compatibilité
- Pas de backward compatibility nécessaire (refonte complète acceptée)
- Migration en une seule fois

### Dépendances
- `react-window` : Pour virtualisation si >100 cartes
- Conserver les dépendances actuelles pour le reste

### Base de données
- Aucune modification de schéma nécessaire
- Renommage uniquement au niveau du code TypeScript

---

**Design validé le :** 2025-12-28
**Prêt pour implémentation**
