# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The development server will start at `http://localhost:5173`

## 📦 Tech Stack

- **React 18** - UI Library
- **TypeScript** - Type Safety
- **Vite** - Build Tool & Dev Server
- **Tailwind CSS** - Utility-First CSS Framework
- **Framer Motion** - Animation Library
- **ESLint** - Code Linting

## 🔧 Available Scripts

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Start development server with hot reload |
| `npm run build`   | Build for production                     |
| `npm run preview` | Preview production build locally         |
| `npm run lint`    | Run ESLint                               |

## 🌐 Deployment

### Vercel (Recommended)

The easiest way to deploy this app is using [Vercel](https://vercel.com):

1. Push your code to GitHub/GitLab/Bitbucket
2. Import your repository on [Vercel](https://vercel.com/new)
3. Vercel will auto-detect Vite and configure the build settings
4. Click "Deploy"

**Or use Vercel CLI:**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Other Platforms

#### Netlify

```bash
# Build command
npm run build

# Publish directory
dist
```

#### GitHub Pages

1. Install `gh-pages`:

```bash
npm install --save-dev gh-pages
```

2. Add to `package.json`:

```json
{
  "homepage": "https://{username}.github.io/{repo-name}",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

3. Update `vite.config.ts`:

```typescript
export default defineConfig({
  base: "/{repo-name}/",
  // ...
});
```

4. Deploy:

```bash
npm run deploy
```

## 📁 Project Structure

```
.
├── public/             # Static assets
├── src/
│   ├── components/     # React components
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main app component
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── index.html          # HTML template
├── vite.config.ts      # Vite configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── tsconfig.json       # TypeScript configuration
```

## ⚙️ Configuration

### Vite Plugins

Currently using the official plugins:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) - Uses Babel for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) - Uses SWC for Fast Refresh

### React Compiler

The React Compiler is enabled on this template. See [React Compiler documentation](https://react.dev/learn/react-compiler) for more information.

**Note:** This may impact Vite dev & build performance.

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=your_api_url
VITE_APP_TITLE=your_app_title
```

Access in your code:

```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

## 🔨 Expanding the ESLint Configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

## 🐛 Troubleshooting

### Dev server won't start

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build errors

```bash
# Check TypeScript errors
npm run tsc --noEmit

# Clear Vite cache
rm -rf node_modules/.vite
```

### Port already in use

Change the port in `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    port: 3000,
  },
});
```

## 📚 Learn More

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Framer Motion Documentation](https://www.framer.com/motion/)

## 📄 License

MIT
