
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bootstrap_first_admin() FROM PUBLIC, anon, authenticated;

CREATE POLICY "shop images read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'shop-images');
CREATE POLICY "shop images admin insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'shop-images' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "shop images admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'shop-images' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "shop images admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'shop-images' AND public.has_role(auth.uid(),'admin'));
