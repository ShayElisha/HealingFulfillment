# Mobile-First Design Notes

## Layout Changes on Mobile

### Navigation
- **Desktop**: Horizontal menu bar
- **Mobile**: Hamburger menu (drawer/slide-in)
- **Breakpoint**: md (768px)

### Hero Section
- **Desktop**: Large text (6xl-7xl), side-by-side content
- **Mobile**: Smaller text (4xl), stacked content
- **Spacing**: Reduced padding on mobile

### Grid Layouts
- **Desktop**: 3-4 columns
- **Tablet**: 2 columns
- **Mobile**: 1 column

### Cards
- **Desktop**: Side-by-side, hover effects
- **Mobile**: Full width, stacked
- **Padding**: Reduced on mobile (p-4 vs p-8)

## Button Sizes

### Touch Targets
- **Minimum**: 44x44px (Apple HIG)
- **Recommended**: 48x48px
- **Mobile**: Larger buttons (py-4 vs py-3)
- **Desktop**: Standard size (py-3)

### Button Spacing
- **Mobile**: Full width buttons in forms
- **Desktop**: Auto width, centered
- **Gap**: sm:flex-row gap-4 (responsive)

## Spacing Adjustments

### Section Padding
- **Mobile**: `py-16` (4rem / 64px)
- **Desktop**: `py-24` (6rem / 96px)
- **Large Desktop**: `py-32` (8rem / 128px)

### Container Padding
- **Mobile**: `px-4` (1rem / 16px)
- **Tablet**: `px-6` (1.5rem / 24px)
- **Desktop**: `px-8` (2rem / 32px)

### Element Spacing
- **Mobile**: Reduced gaps (gap-4 vs gap-8)
- **Desktop**: Generous spacing (gap-8, gap-12)

## Typography Scaling

### Responsive Font Sizes
- **Hero**: `text-4xl md:text-6xl lg:text-7xl`
- **H1**: `text-3xl md:text-4xl lg:text-5xl`
- **H2**: `text-2xl md:text-3xl lg:text-4xl`
- **Body**: `text-base md:text-lg`

### Line Height
- **Mobile**: Tighter (leading-tight)
- **Desktop**: More relaxed (leading-relaxed)

## Navigation Transformation

### Hamburger Menu
- **Trigger**: Fixed top-right
- **Animation**: Slide-in from right (RTL)
- **Overlay**: Semi-transparent backdrop
- **Close**: X button or click outside

### Menu Items
- **Mobile**: Full-width buttons
- **Spacing**: py-3 (comfortable touch)
- **Active State**: Background color highlight

### Sticky Header
- **Mobile**: Always visible (important for navigation)
- **Desktop**: Transparent → White on scroll
- **Height**: Reduced on mobile (h-16 vs h-20)

## Form Optimization

### Input Fields
- **Size**: Larger on mobile (py-3)
- **Font Size**: 16px minimum (prevents zoom on iOS)
- **Spacing**: Generous between fields (space-y-6)

### Date/Time Pickers
- **Mobile**: Native pickers (better UX)
- **Desktop**: Custom styled pickers

### Submit Buttons
- **Mobile**: Full width
- **Desktop**: Auto width, centered

## Image Handling

### Responsive Images
- **Mobile**: Smaller, optimized
- **Desktop**: Larger, higher quality
- **Format**: WebP with fallback

### Aspect Ratios
- **Mobile**: 16:9 or 4:3
- **Desktop**: Can be wider (21:9)

## WhatsApp Button

### Mobile
- **Size**: Larger (w-14 h-14)
- **Position**: Bottom-left, fixed
- **Spacing**: More padding (p-4)

### Desktop
- **Size**: Standard (w-12 h-12)
- **Position**: Bottom-left, fixed
- **Hover**: Scale up effect

## Performance Considerations

### Mobile
- **Lazy Loading**: Images below fold
- **Code Splitting**: Load only needed JS
- **Font Loading**: Preload critical fonts
- **Minification**: All assets minified

### Network
- **Compression**: Gzip/Brotli
- **CDN**: Static assets on CDN
- **Caching**: Aggressive caching headers

## Touch Interactions

### Hover States
- **Mobile**: Tap instead of hover
- **Active States**: Visual feedback on tap
- **No Hover**: Remove hover-only content

### Swipe Gestures
- **Navigation**: Swipe to close menu
- **Carousels**: Swipe between items
- **Scroll**: Smooth scrolling

## Breakpoints (Tailwind)

- **sm**: 640px (small tablets)
- **md**: 768px (tablets)
- **lg**: 1024px (small desktops)
- **xl**: 1280px (desktops)
- **2xl**: 1536px (large desktops)

## Testing Checklist

### Mobile Devices
- [ ] iPhone (various sizes)
- [ ] Android phones
- [ ] Tablets (iPad, Android tablets)

### Features
- [ ] Navigation works smoothly
- [ ] Forms are easy to fill
- [ ] Buttons are easy to tap
- [ ] Text is readable
- [ ] Images load quickly
- [ ] WhatsApp button accessible
- [ ] No horizontal scroll

### Performance
- [ ] Page loads in < 3s
- [ ] Images optimized
- [ ] Fonts load quickly
- [ ] Smooth animations

## Common Mobile Issues & Solutions

### Issue: Text too small
**Solution**: Minimum 16px font size, responsive scaling

### Issue: Buttons too small
**Solution**: Minimum 44x44px touch targets

### Issue: Forms hard to use
**Solution**: Larger inputs, clear labels, helpful placeholders

### Issue: Navigation hidden
**Solution**: Sticky header, hamburger always visible

### Issue: Slow loading
**Solution**: Lazy load images, code splitting, optimize assets

