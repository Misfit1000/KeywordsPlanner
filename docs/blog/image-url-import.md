# Image URL Import

The admin importer accepts public HTTPS raster images only. It applies SSRF and DNS controls, redirect limits, a 5 MB response limit, MIME and file-signature verification, minimum dimensions, and safe hashed filenames. SVG is rejected.

Publisher, licence, and descriptive alt text are required. Creator, attribution, caption, dimensions, file type, size, and source URL are stored. Accepted files are copied to the controlled `blog-images` Supabase Storage bucket.
