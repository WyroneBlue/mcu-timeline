# MarvelPath - MCU Onboarding & Experience App

Een moderne web applicatie voor het verkennen en volgen van het Marvel Cinematic Universe, gebouwd met Nuxt 3, Supabase en Tailwind CSS.

## 🚀 Features

### Core Functionaliteit
- **Experience Modes**: Simple (core films), In Depth (films + series), Extreme (alles inclusief Sony/Fox)
- **Timeline View**: Chronologische lijst met voortgangsindicatoren
- **3D Planet View**: Interactieve 3D weergave met TresJS/Three.js
- **Title Details**: Uitgebreide informatie per film/serie
- **Progress Tracking**: XP systeem, levels en badges
- **Social Features**: Vrienden toevoegen en vergelijken
- **Quiz System**: Wekelijkse MCU quizzen met leaderboards
- **Notifications**: Push notificaties en email updates
- **Mobile Ready**: Capacitor voor iOS/Android apps

### Technische Features
- **Modern Stack**: Nuxt 3, Supabase, Pinia, Tailwind CSS
- **Authentication**: OAuth met Google/GitHub
- **Database**: PostgreSQL met Row Level Security
- **Styling**: Nuxt UI componenten met Tailwind CSS
- **3D Graphics**: TresJS voor WebGL rendering
- **Mobile**: Capacitor voor native apps
- **Type Safety**: Volledige TypeScript ondersteuning

## 🛠️ Tech Stack

- **Frontend**: Nuxt 3, Vue 3, TypeScript
- **Styling**: Tailwind CSS, Nuxt UI
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **State Management**: Pinia
- **3D Graphics**: TresJS, Three.js
- **Mobile**: Capacitor
- **Deployment**: Vercel/Netlify ready

## 📦 Installatie

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
   cp .env.example .env
   ```
   
   Vul de volgende variabelen in:
   ```env
   SUPABASE_URL=your-supabase-url
   SUPABASE_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_KEY=your-supabase-service-key
   NUXT_PUBLIC_APP_NAME=MarvelPath
   NUXT_PUBLIC_DEFAULT_MODE=simple
   ```

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

## 🗄️ Database Schema

### Tabellen
- `titles` - MCU films en series
- `profiles` - Gebruikersprofielen
- `progress` - Voortgang per gebruiker
- `badges` - Beschikbare badges
- `user_badges` - Verdiende badges
- `xp_events` - XP transacties
- `friends` - Vriendschappen

### Row Level Security
Alle tabellen hebben RLS policies voor data privacy en security.

## 📱 Mobile App

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

## 🎨 Styling & Theming

De app gebruikt:
- **Tailwind CSS** voor utility-first styling
- **Nuxt UI** voor componenten
- **Custom CSS** in `assets/css/main.css`
- **Responsive design** voor alle schermformaten
- **Dark mode** ondersteuning

## 🧪 Testing

```bash
# Unit tests (toekomstig)
bun run test

# E2E tests (toekomstig)
bun run test:e2e
```

## 🚀 Deployment

### Vercel
1. Connect je GitHub repository
2. Set environment variabelen
3. Deploy automatisch

### Netlify
1. Connect repository
2. Build command: `bun run generate`
3. Publish directory: `dist`

## 📊 Analytics & Monitoring

- **Error Tracking**: Sentry (toekomstig)
- **Analytics**: Google Analytics (toekomstig)
- **Performance**: Web Vitals monitoring

## 🔒 Security

- **Authentication**: Supabase Auth met OAuth
- **Database**: Row Level Security policies
- **API**: Server-side validation
- **CORS**: Properly configured
- **Environment**: Secure secret management

## 🤝 Contributing

1. Fork de repository
2. Maak een feature branch
3. Commit je changes
4. Push naar de branch
5. Open een Pull Request

## 📄 License

Dit project is gelicenseerd onder de MIT License.

## 🙏 Acknowledgments

- Marvel Studios voor de geweldige content
- Supabase voor de backend services
- Nuxt team voor het geweldige framework
- Tailwind CSS voor de styling utilities
- Three.js community voor 3D graphics

## 📞 Support

Voor vragen of support, open een issue in de GitHub repository.

---

**MarvelPath** - Jouw persoonlijke gids door het Marvel Cinematic Universe! 🦸‍♂️