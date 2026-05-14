# Canonkeeper — Keep the Canon

Een moderne web applicatie voor het verkennen en volgen van het Marvel Cinematic Universe (en toekomstige franchises), gebouwd met Nuxt 4, Supabase en Tailwind CSS.

## Features

### Core Functionaliteit
- **Timeline View**: Chronologische lijst met voortgangsindicatoren
- **3D Planet View**: Interactieve 3D weergave met TresJS/Three.js
- **Title Details**: Uitgebreide informatie per film/serie met cast, trailers en streaming links
- **Before You Watch**: AI-gegenereerde gepersonaliseerde samenvattingen van geskipte titels (per-film of als doorlopend verhaal)
- **Progress Tracking**: XP systeem, levels en badges
- **Social Features**: Vrienden toevoegen en vergelijken
- **Quiz System**: Wekelijkse MCU quizzen met leaderboards
- **Spoiler Guard**: Automatische spoilerbescherming op basis van kijkvoortgang
- **i18n**: Meertalige ondersteuning (EN, NL, ES, PT, IT, TR, AR, ZH, JA)
- **Mobile Ready**: Capacitor voor iOS/Android apps

### Technische Features
- **Modern Stack**: Nuxt 4, Supabase, Pinia, Tailwind CSS
- **AI Summaries**: Anthropic Claude API voor gepersonaliseerde "Before You Watch" samenvattingen
- **Authentication**: OAuth met Google/GitHub
- **Database**: PostgreSQL met Row Level Security
- **3D Graphics**: TresJS voor WebGL rendering
- **Mobile**: Capacitor voor native apps
- **Type Safety**: Volledige TypeScript ondersteuning

## Tech Stack

- **Frontend**: Nuxt 4, Vue 3, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI**: Anthropic Claude API (gepersonaliseerde samenvattingen)
- **State Management**: Pinia
- **3D Graphics**: TresJS, Three.js
- **i18n**: @nuxtjs/i18n (9 talen)
- **Mobile**: Capacitor
- **Deployment**: Vercel/Netlify ready

## Installatie

1. **Clone de repository**
   ```bash
   git clone <repository-url>
   cd mcu-timeline
   ```

2. **Installeer dependencies**
   ```bash
   bun install
   ```

3. **Configureer environment variabelen**
   ```bash
   cp env.example .env
   ```
   
   Vul de volgende variabelen in:
   ```env
   SUPABASE_URL=your-supabase-url
   SUPABASE_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_KEY=your-supabase-service-key
   TMDB_API_KEY=your-tmdb-api-key
   ANTHROPIC_API_KEY=your-anthropic-api-key
   ```

   | Variabele | Doel | Verplicht |
   |-----------|------|-----------|
   | `SUPABASE_URL` | Supabase project URL | Ja |
   | `SUPABASE_KEY` | Supabase anon/public key | Ja |
   | `SUPABASE_SERVICE_KEY` | Supabase service role key (admin API) | Ja |
   | `TMDB_API_KEY` | TMDB API key voor posters, cast & trailers | Ja |
   | `ANTHROPIC_API_KEY` | Anthropic API key voor AI-samenvattingen (Before You Watch) | Nee (feature disabled zonder key) |

4. **Setup Supabase database**
   ```bash
   # Voer het schema uit in je Supabase SQL editor
   cat supabase/schema.sql
   ```

5. **Seed de database**
   ```bash
   bun run seed
   ```

6. **Start development server**
   ```bash
   bun run dev
   ```

## Database Schema

### Tabellen
- `titles` - MCU films en series
- `profiles` - Gebruikersprofielen
- `progress` - Voortgang per gebruiker (watched/skipped/queued)
- `badges` - Beschikbare badges
- `user_badges` - Verdiende badges
- `xp_events` - XP transacties
- `friends` - Vriendschappen
- `context_summaries` - Statische samenvattingen per titel (fallback voor AI)

### Row Level Security
Alle tabellen hebben RLS policies voor data privacy en security.

## Mobile App

### Capacitor Setup
```bash
# Voeg platformen toe
bun run cap:add:ios
bun run cap:add:android

# Build en sync
bun run cap:build

# Run op device
bun run cap:ios
bun run cap:android
```

## Deployment

### Vercel
1. Connect je GitHub repository
2. Set environment variabelen (zie tabel hierboven)
3. Deploy automatisch

### Netlify
1. Connect repository
2. Build command: `bun run generate`
3. Publish directory: `dist`

### Environment variabelen (productie)

Zorg dat alle verplichte keys zijn ingesteld. `ANTHROPIC_API_KEY` is optioneel — zonder key wordt de "Before You Watch" AI-feature uitgeschakeld en valt de app terug op statische samenvattingen.

## Security

- **Authentication**: Supabase Auth met OAuth
- **Database**: Row Level Security policies
- **API**: Server-side validation, admin endpoints beveiligd met service key
- **AI**: Anthropic API calls zijn server-side only (key niet zichtbaar in client)
- **Environment**: Secure secret management

## License

Dit project is gelicenseerd onder de MIT License.