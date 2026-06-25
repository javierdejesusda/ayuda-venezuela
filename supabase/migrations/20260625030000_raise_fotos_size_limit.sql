-- Raise the per-photo upload cap from 5 MB to 10 MB so reporters can attach
-- higher-resolution images straight from a phone camera. Storage enforces this
-- server-side for every upload regardless of the client (10 MB = 10 * 1024 * 1024).
update storage.buckets
set file_size_limit = 10485760
where id = 'fotos';
