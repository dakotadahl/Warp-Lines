# Alluvium Sandbox Build

This is a sandbox build of the Alluvium homepage design from Figma, converted to plain HTML/CSS/JavaScript. Analysis notes (CDN vs local JSON, etc.) have been moved to the project **docs/** folder.

## Overview

This sandbox contains a standalone HTML file that recreates the Alluvium homepage design. The design has been converted from React/Tailwind CSS (as provided by Figma MCP) to vanilla HTML/CSS/JS to match the project's technology stack.

## Features

- **Navigation**: Sticky header with alert banner and main navigation
- **Hero Section**: Large headline with call-to-action buttons
- **Logo Marquee**: Partner/client logos section
- **Problem Statements**: Three sections highlighting key problems
- **Value Proposition**: Core benefits section
- **Features Grid**: Press/media coverage cards
- **CTA Sections**: Multiple call-to-action sections
- **Footer**: Site navigation and links

## Design Tokens

The design uses CSS custom properties (variables) for consistent theming:

- Colors: Deep maroon (#2c1011), dark brown/black (#0c0909), red-orange accents (#fd574b)
- Typography: GT Cinetype Mono (monospace), Cardone Trial (serif), Mona Sans (sans-serif)
- Spacing: Consistent spacing scale (8px, 24px, 40px, 64px, etc.)

## Image Assets

**Note**: The original Figma design includes image assets hosted on a localhost server (`http://localhost:3845/assets/...`). These images will only be accessible when:

1. The Figma MCP server is running
2. The assets are downloaded and hosted locally

For a production build, you would need to:
- Download all image assets from Figma
- Host them locally or on a CDN
- Update the image URLs in the HTML

## Usage

Simply open `index.html` in a web browser. No build process or dependencies required.

## Responsive Design

The layout includes responsive breakpoints:
- Desktop: Full-width layout with multi-column grids
- Tablet: Adjusted spacing and single-column layouts
- Mobile: Stacked navigation and simplified layouts

## Next Steps

To integrate this into the main project:

1. Download and optimize image assets from Figma
2. Replace placeholder content with actual images
3. Add any required JavaScript functionality
4. Integrate with the existing build system
5. Test across browsers and devices






