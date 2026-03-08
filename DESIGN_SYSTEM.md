# Design System - Healing Fulfillment

## Brand Personality (5 Traits)

1. **Calm** - שלווה, רוגע, מרגיע
2. **Safe** - בטוח, מכיל, מקבל
3. **Premium** - איכותי, מקצועי, מעודן
4. **Emotionally Deep** - רגשי עמוק, אותנטי, אמיתי
5. **Non-Salesy** - לא מכירתי, לא דוחף, מכבד

## Color Palette

### Primary Colors
- **Primary 500**: `#00b48c` - Teal green (ריפוי, צמיחה)
- **Primary 600**: `#009070` - Darker teal
- **Primary 400**: `#33c3a3` - Lighter teal
- **Primary 50**: `#f0f9f7` - Very light teal (backgrounds)

### Secondary Colors
- **Secondary 500**: `#cdaf8c` - Warm beige (חום, ארציות)
- **Secondary 600**: `#a48c70` - Darker beige
- **Secondary 50**: `#faf7f4` - Very light beige

### Accent Colors
- **Accent 500**: `#ff8c00` - Warm orange (אנרגיה, תקווה)
- **Accent 600**: `#cc7000` - Darker orange

### Neutral Colors
- **Neutral 50**: `#fafafa` - Off-white backgrounds
- **Neutral 100**: `#f5f5f5` - Light gray
- **Neutral 600**: `#525252` - Medium gray (text)
- **Neutral 900**: `#171717` - Dark gray (headings)

## Typography

### Primary Font (Sans-serif)
- **Font**: Rubik (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700
- **Usage**: Body text, UI elements, navigation

### Secondary Font (Serif)
- **Font**: Cormorant Garamond (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700
- **Usage**: Headings, quotes, emotional content

### Font Sizes
- **Hero**: 4xl-7xl (2.25rem - 4.5rem)
- **H1**: 4xl-6xl (2.25rem - 3.75rem)
- **H2**: 3xl-5xl (1.875rem - 3rem)
- **H3**: 2xl-3xl (1.5rem - 1.875rem)
- **Body**: base-lg (1rem - 1.125rem)
- **Small**: sm (0.875rem)

## Spacing System

Based on Tailwind's spacing scale (4px base unit):
- **xs**: 0.5rem (8px)
- **sm**: 1rem (16px)
- **md**: 1.5rem (24px)
- **lg**: 2rem (32px)
- **xl**: 3rem (48px)
- **2xl**: 4rem (64px)
- **3xl**: 6rem (96px)

**Section Padding**: 
- Mobile: `py-16` (4rem / 64px)
- Desktop: `py-24` (6rem / 96px)
- Large: `py-32` (8rem / 128px)

## Button Styles

### Primary Button
- Background: Primary 500
- Text: White
- Padding: px-6 py-3
- Border radius: xl (1rem)
- Hover: Primary 600 + shadow
- Active: scale-95

### Secondary Button
- Background: White
- Text: Primary 600
- Border: 2px Primary 500
- Hover: Primary 50 background

### Soft Button
- Background: Neutral 100
- Text: Neutral 700
- Hover: Neutral 200

## UI Softness

### Border Radius
- **Small**: rounded-lg (0.5rem)
- **Medium**: rounded-xl (1rem)
- **Large**: rounded-2xl (1.5rem)
- **Extra Large**: rounded-3xl (2rem)

### Shadows
- **Soft**: `shadow-soft` - Subtle elevation
- **Soft Large**: `shadow-soft-lg` - More elevation on hover

### Transitions
- **Default**: 300ms ease-in-out
- **Hover**: Smooth scale and color transitions
- **Active**: Scale down to 95%

## Animation Strategy

### Principles
- **Subtle** - לא מוגזם, לא מסיח
- **Calm** - תנועות איטיות ורכות
- **Purposeful** - כל אנימציה יש לה מטרה

### Animation Types
1. **Fade In** - 0.6s ease-in-out
2. **Slide Up** - 0.6s ease-out (from 20px below)
3. **Slide In Right** - 0.6s ease-out (for RTL)

### Usage
- Section reveals on scroll (Framer Motion)
- Button hover effects
- Card hover elevation
- Page transitions

## Layout Principles

### White Space
- **Generous** - הרבה אוויר בין אלמנטים
- **Breathing Room** - כל אלמנט צריך מקום לנשום
- **Visual Hierarchy** - רווחים עוזרים להבין מה חשוב

### Grid System
- **Mobile**: 1 column
- **Tablet**: 2 columns
- **Desktop**: 3-4 columns (depending on content)

### Container Width
- **Max Width**: 7xl (80rem / 1280px)
- **Padding**: Responsive (px-4 sm:px-6 lg:px-8)

## RTL Support

- **Direction**: `dir="rtl"` on html element
- **Spacing**: Use `space-x-reverse` for horizontal spacing
- **Text Alignment**: Right-aligned by default
- **Icons**: Flipped where appropriate

## Accessibility

- **Color Contrast**: WCAG AA compliant
- **Focus States**: Clear focus indicators
- **Semantic HTML**: Proper heading hierarchy
- **Alt Text**: All images have descriptive alt text
- **Keyboard Navigation**: All interactive elements accessible

