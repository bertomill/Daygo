# Daygo - Journal Application

Daygo is a personal journal application built with Next.js, Firebase, and Shadcn UI that allows users to record their daily thoughts and reflections.

## Features

- **User Authentication**: Secure login and registration system
- **Daily Journaling**: Create and manage daily journal entries
- **Rich Text Formatting**: Write entries with formatting options
- **Template System**: Create and use customizable templates
- **Dark/Light Mode**: Toggle between light and dark themes
- **Responsive Design**: Works on all devices

## Template System

Daygo supports a flexible template system for structured journaling:

- Create custom templates with various field types
- Apply templates to new journal entries
- Field types include:
  - Short text
  - Long text
  - Yes/No questions
  - Mantras for reflection

## Technology Stack

- **Frontend**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI
- **Backend/Database**: Firebase (Firestore, Authentication)
- **State Management**: React Context API
- **Deployment**: Vercel

## Getting Started

To run the project locally:

```bash
git clone https://github.com/yourusername/daygo.git
cd daygo
npm install
npm run dev
```

Create a `.env.local` file with your Firebase configuration:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## License

MIT

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Shadcn UI](https://ui.shadcn.com/)
- [Firebase](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)
