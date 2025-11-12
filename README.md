# TypeScript Admin

A simple TypeScript-based admin application with a Material UI login page.

## Features

- Clean, modern login interface using Material UI v7.3.5
- TypeScript for type safety
- React 19 with hooks
- Vite for fast development and building
- Responsive design

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Ultimate-Company-New/Typescript-admin.git
cd Typescript-admin
```

2. Install dependencies:
```bash
npm install
```

## Development

To start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173/`

## Build

To create a production build:

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

## Project Structure

```
├── src/
│   ├── components/
│   │   └── LoginPage.tsx    # Login page component
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── index.html               # HTML template
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Project dependencies
```

## Technologies Used

- **React**: UI library
- **TypeScript**: Type-safe JavaScript
- **Material UI**: Component library
- **Vite**: Build tool and dev server
- **Emotion**: CSS-in-JS styling (required by Material UI)
