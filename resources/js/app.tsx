import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

// Title suffix: use shared props (site settings / app name) so it updates without rebuilding.
let titleSuffix = import.meta.env.VITE_APP_NAME || 'Laravel';

function updateTitleSuffixFromProps(initialPage: { props?: Record<string, unknown> } | null) {
    const p = initialPage?.props;
    titleSuffix =
        (p?.siteSettings as { site_name?: string } | null)?.site_name ??
        (typeof p?.name === 'string' ? p.name : null) ??
        import.meta.env.VITE_APP_NAME ??
        'Laravel';
}

createInertiaApp({
    title: (title) => `${title} - ${titleSuffix}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        function AppWithTitleSync(setupProps: typeof props) {
            updateTitleSuffixFromProps(setupProps.initialPage);
            return <App {...setupProps} />;
        }

        root.render(<AppWithTitleSync {...props} />);
    },
    progress: {
        delay: 150,
        color: 'var(--primary)',
        includeCSS: true,
        showSpinner: true,
    },
});

// This will set light / dark mode on load...
initializeTheme();
