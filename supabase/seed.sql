-- Demo content only. No application path relies on these rows.
insert into public.categories (
  id, slug, name_tr, name_en, description_tr, description_en, sort_order
) values
  ('10000000-0000-0000-0000-000000000001', 'fotograf-studyosu', 'Fotoğraf Stüdyosu', 'Photography Studio', 'Ürün, moda ve portre çekimleri için profesyonel alanlar.', 'Professional spaces for product, fashion and portrait shoots.', 10),
  ('10000000-0000-0000-0000-000000000002', 'podcast-studyosu', 'Podcast Stüdyosu', 'Podcast Studio', 'Kayıt ve video podcast prodüksiyonu için hazır stüdyolar.', 'Ready-to-record studios for audio and video podcasts.', 20),
  ('10000000-0000-0000-0000-000000000003', 'dans-studyosu', 'Dans Stüdyosu', 'Dance Studio', 'Prova, eğitim ve çekim için ferah dans alanları.', 'Spacious dance rooms for rehearsals, classes and shoots.', 30),
  ('10000000-0000-0000-0000-000000000004', 'etkinlik-alani', 'Etkinlik Alanı', 'Event Space', 'Atölye, lansman ve özel buluşmalar için seçkin mekânlar.', 'Distinctive venues for workshops, launches and gatherings.', 40)
on conflict (id) do nothing;

insert into public.feature_definitions (
  id, key, name_tr, name_en, feature_type, unit, options, validation
) values
  ('20000000-0000-0000-0000-000000000001', 'ceiling_height', 'Tavan yüksekliği', 'Ceiling height', 'number', 'm', null, '{"min": 1.5, "max": 20}'),
  ('20000000-0000-0000-0000-000000000002', 'cyclorama', 'Sonsuz fon', 'Cyclorama', 'boolean', null, null, '{}'),
  ('20000000-0000-0000-0000-000000000003', 'recording_format', 'Kayıt formatı', 'Recording format', 'multi_select', null, '["audio", "video", "live_stream"]', '{}'),
  ('20000000-0000-0000-0000-000000000004', 'floor_type', 'Zemin tipi', 'Floor type', 'select', null, '["wood", "vinyl", "concrete"]', '{}')
on conflict (id) do nothing;

insert into public.category_features (
  category_id, feature_definition_id, is_required, is_filterable, sort_order
) values
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', false, true, 10),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', false, true, 20),
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', true, true, 10),
  ('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004', false, true, 10)
on conflict (category_id, feature_definition_id) do nothing;
