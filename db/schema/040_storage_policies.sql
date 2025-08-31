-- Storage RLS policies for storage.objects (generated from JSON)

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- avatars_delete_own
DROP POLICY IF EXISTS avatars_delete_own ON storage.objects;
CREATE POLICY avatars_delete_own
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING ((bucket_id = 'avatars'::text) AND (split_part(name, '/'::text, 1) = (auth.uid())::text));

-- avatars_delete_own_folder
DROP POLICY IF EXISTS avatars_delete_own_folder ON storage.objects;
CREATE POLICY avatars_delete_own_folder
  ON storage.objects
  FOR DELETE
  TO public
  USING ((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text));

-- avatars_insert_own
DROP POLICY IF EXISTS avatars_insert_own ON storage.objects;
CREATE POLICY avatars_insert_own
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK ((bucket_id = 'avatars'::text) AND (split_part(name, '/'::text, 1) = (auth.uid())::text));

-- avatars_insert_own_folder
DROP POLICY IF EXISTS avatars_insert_own_folder ON storage.objects;
CREATE POLICY avatars_insert_own_folder
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK ((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text));

-- avatars_public_read
DROP POLICY IF EXISTS avatars_public_read ON storage.objects;
CREATE POLICY avatars_public_read
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars'::text);

-- avatars_select_public
DROP POLICY IF EXISTS avatars_select_public ON storage.objects;
CREATE POLICY avatars_select_public
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars'::text);

-- avatars_update_own
DROP POLICY IF EXISTS avatars_update_own ON storage.objects;
CREATE POLICY avatars_update_own
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING ((bucket_id = 'avatars'::text) AND (split_part(name, '/'::text, 1) = (auth.uid())::text))
  WITH CHECK ((bucket_id = 'avatars'::text) AND (split_part(name, '/'::text, 1) = (auth.uid())::text));

-- avatars_update_own_folder
DROP POLICY IF EXISTS avatars_update_own_folder ON storage.objects;
CREATE POLICY avatars_update_own_folder
  ON storage.objects
  FOR UPDATE
  TO public
  USING ((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))
  WITH CHECK ((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text));

-- post_media_delete_own_folder
DROP POLICY IF EXISTS post_media_delete_own_folder ON storage.objects;
CREATE POLICY post_media_delete_own_folder
  ON storage.objects
  FOR DELETE
  TO public
  USING ((bucket_id = 'post-media'::text) AND (auth.role() = 'authenticated'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text));

-- post_media_insert_own_folder
DROP POLICY IF EXISTS post_media_insert_own_folder ON storage.objects;
CREATE POLICY post_media_insert_own_folder
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK ((bucket_id = 'post-media'::text) AND (auth.role() = 'authenticated'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text));

-- post_media_select_public
DROP POLICY IF EXISTS post_media_select_public ON storage.objects;
CREATE POLICY post_media_select_public
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'post-media'::text);

-- post_media_update_own_folder
DROP POLICY IF EXISTS post_media_update_own_folder ON storage.objects;
CREATE POLICY post_media_update_own_folder
  ON storage.objects
  FOR UPDATE
  TO public
  USING ((bucket_id = 'post-media'::text) AND (auth.role() = 'authenticated'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))
  WITH CHECK ((bucket_id = 'post-media'::text) AND (auth.role() = 'authenticated'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text));

-- postmedia_delete_own
DROP POLICY IF EXISTS postmedia_delete_own ON storage.objects;
CREATE POLICY postmedia_delete_own
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING ((bucket_id = 'post-media'::text) AND (split_part(name, '/'::text, 1) = (auth.uid())::text));

-- postmedia_insert_own
DROP POLICY IF EXISTS postmedia_insert_own ON storage.objects;
CREATE POLICY postmedia_insert_own
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK ((bucket_id = 'post-media'::text) AND (split_part(name, '/'::text, 1) = (auth.uid())::text));

-- postmedia_public_read
DROP POLICY IF EXISTS postmedia_public_read ON storage.objects;
CREATE POLICY postmedia_public_read
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'post-media'::text);

-- postmedia_update_own
DROP POLICY IF EXISTS postmedia_update_own ON storage.objects;
CREATE POLICY postmedia_update_own
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING ((bucket_id = 'post-media'::text) AND (split_part(name, '/'::text, 1) = (auth.uid())::text))
  WITH CHECK ((bucket_id = 'post-media'::text) AND (split_part(name, '/'::text, 1) = (auth.uid())::text));


