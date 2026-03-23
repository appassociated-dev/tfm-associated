import i18n from '@/i18n/i18n'; // Inicializar i18next antes de cualquier componente React

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/es';
import { App } from '@/app/app';

// Configurar dayjs para @mantine/dates
dayjs.locale('es');
dayjs.extend(customParseFormat);

// Importar estilos base de Mantine
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(i18n.t('errors:rootNotFound'));
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
