# Multi-Franchise Architectuur voor Canonkeeper

## Context

Canonkeeper is nu 100% MCU-gebouwd. Alle views, data, theming, easter eggs en terminologie zijn hardcoded voor Marvel. Het doel is om dezelfde ervaring aan te bieden voor andere franchises (Fast & Furious, Star Wars, Harry Potter, etc.) waarbij:

- **De List View universeel blijft** — dezelfde component, andere data en terminologie
- **Alle andere views per franchise uniek zijn** — MCU houdt Universe/Branches/Planets, F&F krijgt bijv. Garage/Tracks, etc.
- **Theming, easter eggs, transitions, terminologie per franchise wisselen**

---

## Architectuur: FranchiseConfig Registry

### `app/types/franchise.ts` — Centraal type

Elke franchise wordt beschreven door een `FranchiseConfig` object met:

| Veld | MCU | Fast & Furious | Star Wars | Harry Potter |
|------|-----|----------------|-----------|--------------|
| `code` | `mcu` | `fast-furious` | `star-wars` | `harry-potter` |
| `theme.colorPrimary` | `#F5A623` (goud) | `#22C55E` (groen) | `#FFE81F` (geel) | `#7C3AED` (paars) |
| `theme.colorAccent` | `#8B5CF6` (paars) | `#F97316` (oranje) | `#60A5FA` (blauw) | `#F59E0B` (goud) |
| `theme.colorBackground` | `#0A0E1A` (navy) | `#0D0D0D` (zwart) | `#0B0C10` (space black) | `#0F0A1A` (donkerpaars) |
| `terminology.groupLabel` | "Phase" | "Era" | "Trilogy" | "Year" |
| `terminology.sagaLabel` | "Saga" | "Chapter" | "Era" | "Arc" |
| `terminology.universeLabel` | "Universe" | *(geen)* | "Galaxy" | "Realm" |
| `views[]` | Universe, Sacred Timeline, Planets | Garage, Tracks | Galaxy Map, Lightside/Darkside | Marauders Map, Houses |
| `transitions.types` | portal, incursion, bifrost… | nitro, drift, burnout | hyperspace, force-push, lightsaber-wipe | apparate, floo-powder, portkey |
| `easterEggs` | Thanos snap, Stan Lee cameo | NOS boost | Lightsaber ignite, "I am your father" | Sorting Hat, Patronus |
| `levelNames` | Recruit → Eternal | Rookie → Legend | Youngling → Grand Master | Muggle → Headmaster |
| `canonConfig.core.label` | "Core MCU" | "Main Series" | "Saga Films" | "Main Series" |
| `experienceModes` | Simple/In Depth/Extreme | Mainline/Full Ride/NOS | Saga/Extended/Archives | Books/Films/Extended |

### `app/franchises/index.ts` — Registry

```typescript
import { mcuConfig } from './mcu/config'
import { fastFuriousConfig } from './fast-furious/config'
import { starWarsConfig } from './star-wars/config'
import { harryPotterConfig } from './harry-potter/config'

const registry = new Map<string, FranchiseConfig>()
registry.set('mcu', mcuConfig)
registry.set('fast-furious', fastFuriousConfig)
registry.set('star-wars', starWarsConfig)
registry.set('harry-potter', harryPotterConfig)

export function getFranchiseConfig(code: string): FranchiseConfig
export function getAllFranchises(): FranchiseConfig[]
```

### `app/composables/useFranchise.ts` — Centraal composable

Leest franchise code uit de route, geeft `currentFranchise`, `theme`, `terminology`, `views` terug. Injecteert CSS variables op `document.documentElement`:

```
--ck-primary, --ck-accent, --ck-bg, --ck-surface
--ck-group-primary, --ck-group-accent  (scroll-dynamisch per groep)
```

---

## URL Structuur

```
/                                → Franchise selector dashboard
/mcu/timeline                    → MCU List View
/mcu/universe                    → MCU 3D Universe
/mcu/branches                    → MCU Sacred Timeline
/mcu/planets                     → MCU Planets
/mcu/title/iron-man-2008         → MCU title detail
/fast-furious/timeline            → F&F List View
/fast-furious/garage              → F&F Garage (3D auto-showroom)
/fast-furious/tracks              → F&F Tracks (wereldkaart race-locaties)
/star-wars/timeline               → Star Wars List View
/star-wars/galaxy                 → Star Wars Galaxy Map (3D sterrenkaart)
/star-wars/force                  → Star Wars Light/Dark Side alignment
/harry-potter/timeline            → HP List View
/harry-potter/map                 → HP Marauders Map (interactieve Hogwarts kaart)
/harry-potter/houses              → HP Hogwarts Houses (sortering & stats)
/profile                         → Cross-franchise
/friends, /leaderboard, /notifications → Cross-franchise
```

**Implementatie:** `app/pages/[franchise]/` dynamic route + `[...view].vue` catch-all voor custom views.

---

## Folderstructuur

```
app/
  franchises/
    index.ts                          # Registry
    types.ts                          # FranchiseConfig interface
    mcu/
      config.ts                       # MCU config
      components/
        UniverseView.vue              # ← verplaatst vanuit components/timeline/Universe.vue
        BranchesView.vue              # ← verplaatst vanuit components/timeline/TimelineBranchView.vue
        PlanetView.vue                # ← verplaatst vanuit pages/planet.vue
      easter-eggs/
        SnapEffect.vue                # ← verplaatst
        StanLeeCameo.vue              # ← verplaatst
      transitions/
        MultiverseTransition.vue      # ← verplaatst
      composables/
        useUniverses.ts               # ← verplaatst
        useLocations.ts               # ← verplaatst
        useMultiverseTransitions.ts   # ← verplaatst
      data/
        mcu-titles.json               # ← verplaatst vanuit data/
        universes.json
        timeline-branches.json
        locations.json
    fast-furious/
      config.ts
      components/
        GarageView.vue                # 3D auto-showroom met iconische auto's per film
        TracksView.vue                # Wereldkaart met race-locaties en heist-spots
      easter-eggs/
        NosBoost.vue                  # NOS-injectie effect over het scherm
      transitions/
        NitroTransition.vue           # Snelheidslijnen / nitro-blur transition
      data/
        ff-titles.json
        cars.json                     # Iconische auto's per film (Charger, Supra, etc.)
        tracks.json                   # Race locaties (LA, Tokyo, Rio, Abu Dhabi, etc.)
    star-wars/
      config.ts
      components/
        GalaxyMapView.vue             # 3D sterrenkaart met planeten (Tatooine, Coruscant, etc.)
        ForceAlignmentView.vue        # Light/Dark side visualisatie per personage/film
      easter-eggs/
        LightsaberIgnite.vue          # Lightsaber die aangaat bij interactie
        ImperialMarch.vue             # "I am your father" moment
      transitions/
        HyperspaceTransition.vue      # Hyperspace jump lijnen
      composables/
        usePlanets.ts                 # Star Wars planeten data
        useForceAlignment.ts          # Light/Dark side tracking
      data/
        sw-titles.json
        planets.json                  # Tatooine, Coruscant, Dagobah, etc. met 3D posities
        force-alignments.json         # Light/Dark/Neutral per film/personage
    harry-potter/
      config.ts
      components/
        MaraudersMapView.vue          # Interactieve Hogwarts plattegrond met locaties
        HousesView.vue               # Hogwarts Houses sorteer-experience + stats per huis
      easter-eggs/
        SortingHat.vue                # Sorteerhoed die je een huis geeft
        PatronusEffect.vue            # Patronus verschijning
      transitions/
        ApparateTransition.vue        # Appareren twist-effect
      composables/
        useHogwarts.ts                # Hogwarts locaties en kamers
        useHouses.ts                  # Huis-sorteer logica en stats
      data/
        hp-titles.json
        hogwarts-locations.json       # Kamers, gangen, geheime doorgangen
        houses.json                   # Gryffindor, Slytherin, Hufflepuff, Ravenclaw
  composables/
    useFranchise.ts                   # NIEUW — centraal franchise composable
    useAuth.ts                        # Blijft — franchise-agnostisch
    useProgress.ts                    # Blijft — franchise-agnostisch
    useXP.ts                          # Aanpassen — level names uit franchise config
    useTitles.ts                      # Aanpassen — filter op franchise_id
    useScrollAnimation.ts             # Aanpassen — kleuren uit franchise config
  components/
    ui/
      GroupTag.vue                    # ← hernoemd van PhaseTag.vue
      CanonBadge.vue                  # Aanpassen — labels uit franchise config
    layout/
      FranchiseSwitcher.vue           # NIEUW
      AppHeader.vue                   # Aanpassen — franchise switcher toevoegen
      BottomNav.vue                   # Aanpassen — franchise-specific nav items
```

---

## Theming Systeem

### CSS Variables (dynamisch geïnjecteerd door `useFranchise`)

Vervangt huidige hardcoded `--phase-current-primary` variabelen in `app.vue`.

### Tailwind uitbreiden

```javascript
// tailwind.config.js
colors: {
  ck: {
    primary: 'var(--ck-primary)',
    accent: 'var(--ck-accent)',
    bg: 'var(--ck-bg)',
    surface: 'var(--ck-surface)',
    'group-primary': 'var(--ck-group-primary)',
    'group-accent': 'var(--ck-group-accent)',
  }
}
```

### Layout

`default.vue` rendert easter eggs en transitions dynamisch via `<component :is>` op basis van franchise config i.p.v. hardcoded MCU components.

---

## Database Wijzigingen

| Wijziging | Reden |
|-----------|-------|
| `mcu_relevance_score` → `relevance_score` | Generiek concept, niet MCU-specifiek |
| `franchise_id` toevoegen aan `locations`, `universes`, `timeline_branches` | Franchise-scoped data |
| Location type enum uitbreiden | F&F: `city`, `track`, `country`, `venue` toevoegen |
| `phase`/`saga` kolommen hergebruiken | MCU: "Phase 1", F&F: "Street Racing Era" — zelfde concept, andere labels |

---

## Wat Blijft Gedeeld vs Per-Franchise

### Gedeeld (franchise-agnostisch):
- List View (timeline.vue) — zelfde component, andere data/labels
- Title Detail — zelfde component
- Quiz — zelfde engine, vragen per franchise_id
- Progress tracking, XP engine, Badges, Social, Auth, Profile, Notifications
- Alle shared UI components (GlassCard, PosterCard, StatusBadge, etc.)

### Per-franchise:
- Custom 3D views (Universe voor MCU, Garage/Tracks voor F&F)
- Easter eggs en transitions
- Theme kleuren en groepskleuren
- Terminologie (Phase/Era/Trilogy)
- Level namen
- Data bestanden
- Franchise-specifieke composables

---

## Franchise-Specifieke Custom Views

### MCU — Universe / Sacred Timeline / Planets
Blijft zoals het nu is. 3D universe met poster-cards per phase, Sacred Timeline met nexus events, 3D planeet-explorer.

### Fast & Furious — Garage / Tracks

**Garage View** (`GarageView.vue`)
- 3D showroom met iconische auto's uit de franchise
- Per film een sectie met de key vehicles (Dom's Charger, Brian's Supra, Han's RX-7, etc.)
- Auto's draaien langzaam op een platform, klikbaar voor details
- Filter op era (Street Racing / Heist / Global Ops / Finale)
- Watched-status badge op elke auto's film
- Donkere garage-sfeer met neon-accenten en reflecterend vloeroppervlak

**Tracks View** (`TracksView.vue`)
- Flat wereldkaart (of 3D globe) met pinpoints voor alle race/heist-locaties
- Los Angeles, Tokyo (Drift), Rio de Janeiro, Londen, Abu Dhabi, Cuba, etc.
- Klik op locatie → toont welke films daar spelen + key scenes
- Verbindingslijnen tussen locaties in chronologische volgorde
- Kleurcodering per era

### Star Wars — Galaxy Map / Force Alignment

**Galaxy Map View** (`GalaxyMapView.vue`)
- 3D sterrenkaart van de Star Wars galaxy
- Planeten als gloeiende bollen: Tatooine (zandkleur), Coruscant (stadslichtten), Dagobah (groen), Hoth (wit), etc.
- Klik op planeet → toont welke films/series daar spelen
- Core Worlds, Outer Rim, Unknown Regions als regio's
- Hyperspace-lijnen verbinden planeten die in dezelfde film voorkomen
- Nebula-achtergrond passend bij de SW esthetiek

**Force Alignment View** (`ForceAlignmentView.vue`)
- Verticale as van Light (blauw, boven) → Dark (rood, onder)
- Elke film/serie gepositioneerd op basis van Light/Dark-balans
- A New Hope → sterk Light, Revenge of the Sith → sterk Dark, Rogue One → grijs midden
- Visuele Force-energie stromen tussen connected films
- Klikbaar voor details over de morele thema's per titel

### Harry Potter — Marauders Map / Houses

**Marauders Map View** (`MaraudersMapView.vue`)
- 2D perkament-stijl plattegrond van Hogwarts (top-down of isometrisch)
- Kamers en locaties markeren waar key scenes plaatsvinden
- Voetafdrukken die bewegen (als de echte Marauders Map)
- Klik op locatie (Grote Zaal, Verboden Bos, Kamer van Hoge Nood) → films/scenes
- Perkament-textuur, inkt-stijl lijnen, "I solemnly swear" intro-animatie
- Filter op school-jaar (Year 1-7 = film 1-7)

**Houses View** (`HousesView.vue`)
- Vier huizen als grote kaarten/secties met hun kleuren en wapen
- Gryffindor (rood/goud), Slytherin (groen/zilver), Hufflepuff (geel/zwart), Ravenclaw (blauw/brons)
- Per huis: key personages, hun titels/films, watch progress
- Optioneel: sorteer-quiz die je een huis geeft (gamification)
- Stats: welk huis heeft de meeste screen time, meeste key events, etc.

---

## Franchise Theming Details

### MCU
- **Sfeer:** Kosmisch, tech-glans, infinity stones glow
- **Achtergrond:** Deep space navy `#0A0E1A` met sterrenveldd
- **Typografie:** Space Grotesk (display), Inter (body)
- **Accenten:** Gouden primair, paarse secondary
- **Group colors:** Rood (Infinity) → Paars (Multiverse) → Teal (Secret Wars)

### Fast & Furious
- **Sfeer:** Neon street racing, underground, asfalt, nacht
- **Achtergrond:** Puur zwart `#0D0D0D` met subtiele asfalt-textuur
- **Typografie:** Boldere display font (bijv. Oswald of Bebas Neue)
- **Accenten:** Neon groen primair, oranje secondary (NOS/vlammen)
- **Group colors:** Groen (Street Racing) → Geel (Heist) → Blauw (Global Ops) → Rood (Finale)
- **Speciale effecten:** Speed lines, motion blur, rpm-meter animaties

### Star Wars
- **Sfeer:** Episch, ruimte-opera, Force-mystiek
- **Achtergrond:** Space black `#0B0C10` met subtiele sterrennevel
- **Typografie:** Star Wars-achtig display font (bijv. Pathway Gothic One), body Inter
- **Accenten:** Geel primair (opening crawl), blauw secondary (lightsaber/hologram)
- **Group colors:** Goud (Original) → Rood (Prequel) → Blauw (Sequel) → Groen (TV)
- **Speciale effecten:** Hologram-flicker, lightsaber glow, Force ripples

### Harry Potter
- **Sfeer:** Magisch, warm, perkament, kaarslicht
- **Achtergrond:** Donkerpaars `#0F0A1A` met subtle sparkle/sterren
- **Typografie:** Serif display font (bijv. Crimson Text of Playfair Display), body Inter
- **Accenten:** Paars primair (magie), goud secondary (Gringotts/snitch)
- **Group colors:** Per schooljaar met warmere tinten
- **Speciale effecten:** Sparkle particles, perkament-textuur overlays, toverstaf-trails

---

## Component Auto-Import

Nuxt config uitbreiden zodat `app/franchises/*/components/` automatisch geïmporteerd worden met prefix:

```typescript
// nuxt.config.ts
components: [
  { path: '~/franchises', pathPrefix: true, prefix: 'Franchise' },
  { path: '~/components' },
]
```

Resultaat: `franchises/mcu/components/UniverseView.vue` → `<FranchiseMcuUniverseView />`

---

## Migratie in Fasen

### Fase 1: Foundation (geen zichtbare wijzigingen)
- `app/types/franchise.ts` aanmaken
- `app/franchises/mcu/config.ts` schrijven
- `app/franchises/index.ts` registry opzetten
- `app/composables/useFranchise.ts` + `app/stores/franchise.ts` maken
- Nuxt config updaten voor component auto-import

### Fase 2: MCU code verplaatsen
- MCU-specifieke composables → `app/franchises/mcu/composables/`
- Easter eggs → `app/franchises/mcu/easter-eggs/`
- Transitions → `app/franchises/mcu/transitions/`
- Data files → `app/franchises/mcu/data/`

### Fase 3: Shared code franchise-aware maken
- `app.vue` — dynamische CSS variables
- `default.vue` — dynamische easter eggs / transitions
- `PhaseTag` → `GroupTag` hernoemen
- `CanonBadge`, `XPBar`, `GlassCard` — franchise config gebruiken
- `useXP`, `useScrollAnimation`, `useTitles`, `useContextSummaries` aanpassen

### Fase 4: URL herstructurering
- `app/pages/[franchise]/timeline.vue` aanmaken
- `app/pages/[franchise]/title/[slug].vue` aanmaken
- `app/pages/[franchise]/[...view].vue` catch-all
- `FranchiseSwitcher.vue` component
- Redirect middleware: `/timeline` → `/mcu/timeline`

### Fase 5: Fast & Furious toevoegen
- `app/franchises/fast-furious/config.ts` schrijven
- F&F titles data samenstellen (`ff-titles.json`, `cars.json`, `tracks.json`)
- F&F titles seeden in Supabase
- `GarageView.vue` bouwen — 3D auto-showroom met Three.js
- `TracksView.vue` bouwen — wereldkaart met race-locaties
- `NosBoost.vue` easter egg + `NitroTransition.vue`
- Registreren in registry

### Fase 6: Star Wars toevoegen
- `app/franchises/star-wars/config.ts` schrijven
- SW titles data samenstellen (`sw-titles.json`, `planets.json`, `force-alignments.json`)
- SW titles seeden in Supabase
- `GalaxyMapView.vue` bouwen — 3D sterrenkaart
- `ForceAlignmentView.vue` bouwen — Light/Dark side visualisatie
- `HyperspaceTransition.vue` + easter eggs
- Registreren in registry

### Fase 7: Harry Potter toevoegen
- `app/franchises/harry-potter/config.ts` schrijven
- HP titles data samenstellen (`hp-titles.json`, `hogwarts-locations.json`, `houses.json`)
- HP titles seeden in Supabase
- `MaraudersMapView.vue` bouwen — perkament-stijl Hogwarts plattegrond
- `HousesView.vue` bouwen — Hogwarts Houses experience
- `ApparateTransition.vue` + easter eggs
- Registreren in registry

### Fase 8: Database migratie
- Kolom hernoemen (`mcu_relevance_score` → `relevance_score`)
- `franchise_id` toevoegen aan locations/universes/timeline_branches
- Location types uitbreiden (city, track, planet, castle, forest, etc.)
- Alle franchises seeden

---

## Verificatie

1. **MCU werkt nog steeds identiek** na fase 1-4 — navigeer naar `/mcu/timeline`, wissel tussen List/Universe/Branches, controleer theming, easter eggs, transitions
2. **F&F werkt** na fase 5 — `/fast-furious/timeline` (list), `/fast-furious/garage` (3D showroom), `/fast-furious/tracks` (wereldkaart), theming switcht naar neon-groen
3. **Star Wars werkt** na fase 6 — `/star-wars/timeline` (list), `/star-wars/galaxy` (sterrenkaart), `/star-wars/force` (alignment), theming switcht naar geel/blauw
4. **Harry Potter werkt** na fase 7 — `/harry-potter/timeline` (list), `/harry-potter/map` (Marauders Map), `/harry-potter/houses` (sortering), theming switcht naar paars/goud
5. **Franchise switcher** — wissel tussen alle 4 franchises, controleer dat theming/nav/views/terminologie wisselen
6. **Deep links** — elke franchise title page werkt: `/mcu/title/iron-man-2008`, `/star-wars/title/a-new-hope`, etc.
7. **Cross-franchise** — profiel toont stats van alle franchises, leaderboard kan filteren per franchise

---

## Kritieke Bestanden

- [app/app.vue](app/app.vue) — hardcoded phase CSS variables → dynamisch
- [app/layouts/default.vue](app/layouts/default.vue) — hardcoded MCU easter eggs/transitions → dynamisch
- [tailwind.config.js](tailwind.config.js) — kleuren naar CSS variables
- [nuxt.config.ts](nuxt.config.ts) — component auto-import paden
- [app/composables/useTitles.ts](app/composables/useTitles.ts) — franchise-aware maken
- [app/composables/useXP.ts](app/composables/useXP.ts) — level names uit config
- [app/composables/useScrollAnimation.ts](app/composables/useScrollAnimation.ts) — kleuren uit config
- [app/components/ui/PhaseTag.vue](app/components/ui/PhaseTag.vue) — hernoemen naar GroupTag
- [app/components/ui/CanonBadge.vue](app/components/ui/CanonBadge.vue) — labels uit config
- [types/supabase.ts](types/supabase.ts) — schema updates
- [supabase/schema.sql](supabase/schema.sql) — migratie
