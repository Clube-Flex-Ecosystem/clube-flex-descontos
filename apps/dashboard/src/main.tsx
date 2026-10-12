import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Providers } from './app/providers';
import './styles/tailwind.css';

const root = document.getElementById('root');
if (!root) throw new Error('Elemento #root não encontrado');

createRoot(root).render(
    <StrictMode>
        <Providers />
    </StrictMode>,
);
