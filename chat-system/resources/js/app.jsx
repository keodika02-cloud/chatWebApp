import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import ChatLayout from './components/Chat/ChatLayout';

const rootElement = document.getElementById('app');
if (rootElement) {
    const root = createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <ChatLayout />
        </React.StrictMode>
    );
}
