# Responsive images

Safe imports retain the validated original and create deterministic WebP and AVIF variants at supported widths up to 1,600 pixels without upscaling. Sharp enforces input-pixel, file-size, format, metadata, and animation limits and strips unnecessary metadata during re-encoding.

Rendered articles use `<picture>`, `srcset`, `sizes`, dimensions, decoding hints, fallback source, alt text, and attribution. Hero images may load eagerly; below-fold images remain lazy. The admin validation panel lists variant dimensions, format, size, source, licence, and attribution. Daily cleanup removes old unattached variants.
