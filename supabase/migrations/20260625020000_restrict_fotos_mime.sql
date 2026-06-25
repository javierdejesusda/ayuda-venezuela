-- Harden the public fotos bucket: drop the image/* wildcard (which allows
-- image/svg+xml, a stored-XSS vector when opened directly) for an explicit
-- raster allow-list that still covers mobile camera formats.
update storage.buckets
set allowed_mime_types = array[
  'image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif','image/avif'
]
where id = 'fotos';
