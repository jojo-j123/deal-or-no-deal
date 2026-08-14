import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { SettingsProvider } from './react/settings.tsx';

import './styles/base.css';
import './styles/stage.css';
import './styles/cases.css';
import './styles/game.css';
import './styles/board.css';
import './styles/overlays.css';
import './styles/menu.css';
import './styles/creator.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </StrictMode>,
);
