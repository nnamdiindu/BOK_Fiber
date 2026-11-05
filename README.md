# BOK Integrated Nigeria Limited — Landing Page

Built from the Figma file "Project Bok Fiber" using HTML, CSS and Bootstrap 5.3.

## Files
- index.html: the full one-page site (11 sections)
- css/styles.css: all custom styles (design tokens live in :root)
- download-assets.sh: pulls every image and icon from Figma into assets/

## First step: get the images
The Figma asset links expire on 12 Nov 2026. Before then, run this from the project folder:

    bash download-assets.sh

It fills assets/img and assets/icons. If the links have expired, export the images
from Figma again using the same file names.

Open index.html in a browser. No build step is needed.
