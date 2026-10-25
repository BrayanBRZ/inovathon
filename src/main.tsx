import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'next-themes';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        {/* Tema claro/escuro pela classe `dark`, como o shadcn/ui espera; a escolha fica salva no navegador. */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="fregues-tema" disableTransitionOnChange>
            <App />
        </ThemeProvider>
    </StrictMode>,
);
