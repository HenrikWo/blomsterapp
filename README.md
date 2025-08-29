# 🌸 Blomsterappen

> *En visuell reise gjennom Norges vakre blomsterverden*

En moderne, interaktiv app som kombinerer **Norsk Flora** og **Wikipedia** for å skape den ultimate blomsterlæringen. Oppdag, lær og test deg selv på over tusen norske blomster med høykvalitets bilder og detaljert informasjon.

---

## ✨ Funksjoner

### 🔍 **Interaktiv Blomsterutforsking**
- **Swipe-funksjonalitet** på mobil for å navigere mellom flere bilder
- **Smooth drag-feedback** med visuell respons
- **Dual bildekilde** - både Norsk Flora og Wikipedia-bilder
- **Touch-optimalisert** for perfekt mobilopplevelse

### 🧠 **Smart Quiz-system**
- **Adaptiv quiz** som bruker alle tilgjengelige bilder
- **Visuell feedback** på riktige og feil svar
- **Progresstracking** med detaljert resultatomoversikt
- **Swipable bilder** også i quiz-modus

### 📱 **Responsiv Design**
- **Mobile-first** tilnærming med perfekt touch-handling
- **Glassmorphism** effekter og moderne UI
- **Smooth animasjoner** og mikrointeraksjoner
- **Accessibility-fokusert** med ARIA-labels og keyboard-navigasjon

### 📊 **Datadrevet**
- **Alle blomster** fra norsk flora
- **Automatisk datasynkronisering** mellom Norsk Flora og Wikipedia
- **Smart bildefiltrering** som sikrer kun høykvalitets innhold
- **CSV-basert database** for enkel vedlikehold

---

## 🚀 Kom i gang

### Forutsetninger
```bash
Node.js 18+ og npm/yarn/pnpm
```

### Installasjon
```bash
# Klon prosjektet
git clone [repository-url]
cd blomsterapp

# Installer dependencies
npm install

# Start utviklingsserver
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000) i nettleseren din og opplev blomsterverdenen! 🌺

---

## 🛠️ Teknisk Stack

### Frontend
- **Next.js 14** - React framework med App Router
- **TypeScript** - Type-sikker utvikling
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Moderne ikoner

### Funksjoner
- **Touch Events** - Native swipe-funksjonalitet
- **Image Optimization** - Next.js automatisk bildeoptimasering
- **State Management** - React hooks og context
- **Responsive Design** - Mobile-first tilnærming

### Data
- **CSV Processing** - Papa Parse for datahåndtering
- **Dual Sources** - Norsk Flora + Wikipedia integration
- **Smart Caching** - Optimalisert datalasting
- **Error Handling** - Robust feilhåndtering

---

## 📁 Prosjektstruktur

```
blomsterapp/
├── 🎨 components/          # React komponenter
│   ├── BlomsterCard.tsx    # Hovedkort med swipe-funksjonalitet
│   └── FeilrapportModal.tsx # Feilrapportering
├── 📚 lib/                 # Utilities og typer
│   ├── types.ts           # TypeScript interfaces
│   ├── data-loader.ts     # CSV data-håndtering
│   └── quizTypes.ts       # Quiz logikk
├── 🌐 app/                 # Next.js App Router
│   ├── page.tsx           # Hovedside
│   ├── quiz/              # Quiz-funksjonalitet
│   └── layout.tsx         # Global layout
└── 📊 public/data/        # CSV database
    └── blomster.csv       # Blomsterdata
```

---

## 🎮 Brukerveiledning

### 🔍 **Utforsk blomster**
- **Tap** på et kort for å se detaljert informasjon
- **Swipe** horisontalt for å se flere bilder av samme blomst
- **Klikk** på lenkene for å utforske Norsk Flora eller Wikipedia

### 🧠 **Ta quiz**
- Trykk på "Test deg selv" fra hovedsiden
- **Swipe** gjennom bildene hvis blomsten har flere
- **Velg** riktig svar fra alternativene
- **Se** detaljert resultat med poengsum og gjennomgang

### 📱 **Mobil vs Desktop**
- **Mobil**: Swipe-gester, touch-optimalisert, alltid synlige kontroller
- **Desktop**: Hover-effekter, pil-navigasjon, mus-optimalisert

---

## 🎨 Design Philosophy

### 🌿 **Naturinspirert**
Fargepalettet er inspirert av norsk natur - smaragdgrønt fra skog, teal fra fjorder, og rene hvite toner fra snø og blomster.

### 📱 **Mobile-First**
Hver interaksjon er designet for å føles naturlig på touch-enheter, med smooth animasjoner og responsiv feedback.

### ✨ **Modern Minimalism**
Rent design som lar blomsternes skjønnhet skinne gjennom, med subtile glassmorphism-effekter og gjennomtenkte mikrointeraksjoner.

---

## 🤝 Bidra

### 🐛 Rapporter feil
Bruker du "🚨 Feil?"-knappen i appen eller opprett en issue på GitHub.

### 💡 Foreslå funksjoner  
Har du en idé? Del den med oss i discussions eller issues.

---

## 🙏 Anerkjennelser

- **[Norsk Flora](https://norskflora.no)** - For den utrolige botaniske databasen
- **[Wikipedia](https://wikipedia.org)** - For høykvalitets blomsterbilder
- **[Next.js](https://nextjs.org)** - For det fantastiske React-rammeverket
- **[Tailwind CSS](https://tailwindcss.com)** - For effektiv og vakker styling

---

<div align="center">

**Laget til Vilde 💚**

*For å bestå vanskelige fag*

</div>