/**
 * Theme Script - Ensures theme is applied before React hydration
 * Prevents flash of wrong theme
 */
export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              const theme = localStorage.getItem('newly-theme') || 'dark';
              document.documentElement.classList.remove('light', 'dark');
              document.documentElement.classList.add(theme);
            } catch (e) {
              // Fallback to dark if localStorage fails
              document.documentElement.classList.add('dark');
            }
          })();
        `,
      }}
    />
  );
}

