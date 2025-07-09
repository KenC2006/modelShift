# Theme System Documentation

## Overview

The application now uses a modern, comprehensive theme system built with CSS Custom Properties (CSS Variables) and Tailwind CSS. This system provides consistent theming across all components with support for light and dark themes.

## Architecture

### CSS Custom Properties

The theme system is built around CSS custom properties defined in `src/index.css`:

#### Light Theme Variables

```css
:root {
  --theme-bg: #ffffff;
  --theme-bg-secondary: #f8fafc;
  --theme-bg-tertiary: #f1f5f9;
  --theme-surface: #ffffff;
  --theme-surface-hover: #f8fafc;
  --theme-border: #e2e8f0;
  --theme-border-light: #f1f5f9;
  --theme-border-focus: #3b82f6;
  --theme-text: #0f172a;
  --theme-text-secondary: #334155;
  --theme-text-tertiary: #64748b;
  --theme-text-muted: #94a3b8;
  --theme-ring: rgba(59, 130, 246, 0.1);
}
```

#### Dark Theme Variables

```css
.dark {
  --theme-bg: #0f172a;
  --theme-bg-secondary: #1e293b;
  --theme-bg-tertiary: #334155;
  --theme-surface: #1e293b;
  --theme-surface-hover: #334155;
  --theme-border: #475569;
  --theme-border-light: #334155;
  --theme-border-focus: #60a5fa;
  --theme-text: #f8fafc;
  --theme-text-secondary: #cbd5e1;
  --theme-text-tertiary: #94a3b8;
  --theme-text-muted: #64748b;
  --theme-ring: rgba(96, 165, 250, 0.2);
}
```

### Semantic Colors

The system includes semantic colors for consistent usage:

```css
--color-primary: #3b82f6;
--color-primary-hover: #2563eb;
--color-success: #22c55e;
--color-warning: #f59e0b;
--color-error: #ef4444;
```

### Shadows

Dynamic shadows that adapt to the theme:

```css
/* Light theme shadows */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);

/* Dark theme shadows */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
```

### Transitions

Configurable transition durations:

```css
--transition-fast: 150ms ease-in-out;
--transition-normal: 200ms ease-in-out;
--transition-slow: 300ms ease-in-out;
```

## Usage

### Tailwind Classes

The theme system provides utility classes that automatically adapt to the current theme:

#### Background Colors

- `bg-theme-bg` - Main background
- `bg-theme-bg-secondary` - Secondary background
- `bg-theme-bg-tertiary` - Tertiary background
- `bg-theme-surface` - Surface background
- `bg-theme-surface-hover` - Hover state background

#### Text Colors

- `text-theme-text` - Primary text
- `text-theme-text-secondary` - Secondary text
- `text-theme-text-tertiary` - Tertiary text
- `text-theme-text-muted` - Muted text

#### Border Colors

- `border-theme-border` - Primary border
- `border-theme-border-light` - Light border
- `border-theme-border-focus` - Focus border

### Component Classes

The system provides pre-built component classes:

#### Buttons

```css
.btn-primary {
  background-color: var(--color-primary);
  color: white;
  /* ... */
}

.btn-secondary {
  background-color: var(--theme-surface);
  color: var(--theme-text-secondary);
  border-color: var(--theme-border);
  /* ... */
}
```

#### Form Elements

```css
.input-field {
  background-color: var(--theme-surface);
  border: 1px solid var(--theme-border);
  color: var(--theme-text);
  /* ... */
}
```

#### Cards

```css
.card {
  background-color: var(--theme-surface);
  border: 1px solid var(--theme-border);
  box-shadow: var(--shadow-sm);
  /* ... */
}
```

## Theme Switching

### JavaScript Implementation

Theme switching is handled in `App.js`:

```javascript
useEffect(() => {
  // Apply theme
  if (settings.theme === "dark") {
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
  } else {
    // Default to light theme
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
  }
}, [settings.theme]);
```

````

## Component Guidelines

### Using Theme Colors

Always use theme-aware classes instead of hardcoded colors:

```jsx
// ✅ Good
<div className="bg-theme-surface text-theme-text border-theme-border">
  Content
</div>

// ❌ Bad
<div className="bg-white text-black border-gray-200">
  Content
</div>
````

### Component Styling

Use the provided component classes for consistency:

```jsx
// ✅ Good
<button className="btn btn-primary">Primary Action</button>
<input className="input-field" />
<div className="card">Content</div>

// ❌ Bad
<button className="bg-blue-500 text-white px-4 py-2 rounded">
  Primary Action
</button>
```

### Hover and Focus States

Use theme-aware hover states:

```jsx
// ✅ Good
<button className="bg-theme-surface hover:bg-theme-surface-hover">
  Button
</button>

// ❌ Bad
<button className="bg-white hover:bg-gray-100">
  Button
</button>
```

## Accessibility

### Focus Indicators

The theme system includes proper focus indicators:

```css
*:focus {
  outline: 2px solid var(--theme-border-focus);
  outline-offset: 2px;
}
```

### Color Contrast

All theme colors are designed to meet WCAG AA contrast requirements in both light and dark modes.

## Performance

### CSS Custom Properties

Using CSS custom properties provides several benefits:

1. **Runtime Updates**: Theme changes are instant without page reloads
2. **Cascade**: Changes automatically propagate to all child elements
3. **Performance**: No JavaScript DOM manipulation required for color changes
4. **Memory Efficient**: Single source of truth for all theme values

### Transitions

Smooth transitions are provided by default but can be disabled for users who prefer reduced motion:

```javascript
if (!settings.animations) {
  document.documentElement.style.setProperty("--transition-fast", "0ms");
  document.documentElement.style.setProperty("--transition-normal", "0ms");
  document.documentElement.style.setProperty("--transition-slow", "0ms");
}
```

## Extending the Theme

### Adding New Colors

To add new theme colors:

1. Add the CSS custom property to both `:root` and `.dark` selectors
2. Add corresponding Tailwind utilities in `tailwind.config.js`
3. Update component classes if needed

### Adding New Components

When creating new components:

1. Use existing theme classes when possible
2. Create new component classes in the `@layer components` section
3. Use CSS custom properties for any custom styling
4. Ensure proper contrast ratios in both themes

## Migration Guide

### From Old Theme System

The old theme system used hardcoded colors and complex dark mode selectors. To migrate:

1. Replace hardcoded colors with theme classes
2. Remove `.dark` selectors where possible
3. Use component classes instead of custom styling
4. Update any JavaScript theme switching logic

### Example Migration

```jsx
// Old
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  Content
</div>

// New
<div className="bg-theme-surface text-theme-text">
  Content
</div>
```

## Best Practices

1. **Consistency**: Always use theme classes instead of hardcoded colors
2. **Semantic Naming**: Use semantic color names (primary, success, error) rather than visual descriptions
3. **Accessibility**: Ensure proper contrast ratios in both themes
4. **Performance**: Avoid JavaScript-based theme switching when possible
5. **Testing**: Test components in both light and dark themes
6. **Documentation**: Document any custom theme extensions

## Troubleshooting

### Common Issues

1. **Colors not updating**: Ensure CSS custom properties are properly defined
2. **Inconsistent theming**: Check that all components use theme classes
3. **Performance issues**: Verify that theme switching doesn't trigger unnecessary re-renders
4. **Accessibility problems**: Test contrast ratios in both themes

### Debug Tools

Use browser dev tools to inspect CSS custom properties:

```javascript
// Check current theme values
getComputedStyle(document.documentElement).getPropertyValue("--theme-bg");
```

## Future Enhancements

Potential improvements to the theme system:

1. **Color Palette Generator**: Automatically generate theme variations
2. **High Contrast Mode**: Additional accessibility theme
3. **Custom Color Schemes**: User-defined color preferences
4. **Theme Presets**: Pre-built theme collections
5. **Animation Preferences**: More granular animation controls
