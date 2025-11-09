# Vanguard League Platform - Frontend

Next.js frontend for the Vanguard League submission-only ladder competition platform.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.sample .env.local
# Edit .env.local with your backend API URL
```

### 3. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Deployment

### Build for production
```bash
npm run build
npm start
```

### Deploy to Vercel
This project is optimized for deployment on Vercel:

1. Push your code to GitHub
2. Import project in Vercel dashboard
3. Configure environment variables
4. Deploy

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx    # Root layout
│   ├── page.tsx      # Homepage
│   └── globals.css   # Global styles
├── public/           # Static assets
└── .env.local        # Environment variables (create from .env.sample)
```

## Features

- Server-side rendering with Next.js App Router
- Tailwind CSS for styling
- TypeScript for type safety
- Responsive design
- Dark mode support

## Development

### Add a new page
Create a new folder in `app/` with a `page.tsx` file.

### Styling
This project uses Tailwind CSS. Modify `tailwind.config.ts` for custom configuration.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
