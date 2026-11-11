-- Production catalog configuration requested for StudioHut studio onboarding.
-- Not demo seed data: no businesses, users, listings or leads are created.
-- Existing category/feature configuration is preserved. Execute as one transaction.
begin;

insert into public.categories (slug, name_tr, name_en, description_tr, description_en, sort_order, is_active)
values
 ('fotograf-studyosu', 'Fotoğraf Stüdyosu', 'Photography Studio',
  'Ürün, portre, moda ve video çekimleri için stüdyolar.',
  'Studios for product, portrait, fashion and video shoots.', 10, true),
 ('muzik-studyosu', 'Müzik Stüdyosu', 'Music Studio',
  'Kayıt, prova, miks ve mastering için müzik stüdyoları.',
  'Music studios for recording, rehearsal, mixing and mastering.', 20, true)
on conflict (slug) do nothing;

insert into public.feature_definitions (key, name_tr, name_en, feature_type, unit, options, validation)
values
 ('studio_website', 'Stüdyo web sitesi', 'Studio website', 'text', null, null,
  '{"maxLength":2048,"format":"url","section":"contact","placeholder":"www.yourstudio.com.tr"}'),
 ('studio_contact_email', 'İletişim e-postası', 'Contact email', 'text', null, null,
  '{"maxLength":254,"format":"email","section":"contact","placeholder":"hello@yourstudio.com.tr"}'),
 ('studio_contact_phone', 'İletişim telefonu', 'Contact phone', 'text', null, null,
  '{"maxLength":50,"format":"tel","section":"contact","placeholder":"+90 5xx xxx xx xx"}'),
 ('studio_opening_hours', 'Çalışma saatleri', 'Opening hours', 'text', null, null,
  '{"maxLength":500,"section":"contact"}'),
 ('shooting_types', 'Çekim türleri', 'Types of shoots', 'multi_select', null,
  '["product","portrait","fashion","video","commercial"]',
  '{"optionsTr":{"product":"Ürün","portrait":"Portre","fashion":"Moda","video":"Video","commercial":"Reklam"},"optionsEn":{"product":"Product","portrait":"Portrait","fashion":"Fashion","video":"Video","commercial":"Commercial"}}'),
 ('lighting_setup', 'Işık düzeni', 'Lighting setup', 'select', null,
  '["daylight","artificial","both"]',
  '{"optionsTr":{"daylight":"Doğal ışık","artificial":"Yapay ışık","both":"Doğal ve yapay ışık"},"optionsEn":{"daylight":"Daylight","artificial":"Artificial lighting","both":"Daylight and artificial lighting"}}'),
 ('ceiling_height', 'Tavan yüksekliği', 'Ceiling height', 'number', 'm', null, '{"min":1.5,"max":30}'),
 ('cyclorama', 'Sonsuz fon', 'Cyclorama', 'boolean', null, null, '{}'),
 ('dressing_room', 'Makyaj / giyinme odası', 'Makeup / dressing room', 'boolean', null, null, '{}'),
 ('photo_equipment', 'Dahil olan çekim ekipmanları', 'Included photography equipment', 'text', null, null, '{"maxLength":2000}'),
 ('backdrop_options', 'Fon seçenekleri', 'Backdrop options', 'text', null, null, '{"maxLength":1000}'),
 ('music_services', 'Müzik hizmetleri', 'Music services', 'multi_select', null,
  '["recording","rehearsal","mixing","mastering","live_session"]',
  '{"optionsTr":{"recording":"Kayıt","rehearsal":"Prova","mixing":"Miks","mastering":"Mastering","live_session":"Canlı performans kaydı"},"optionsEn":{"recording":"Recording","rehearsal":"Rehearsal","mixing":"Mixing","mastering":"Mastering","live_session":"Live session"}}'),
 ('soundproofing', 'Ses yalıtımı', 'Soundproofing', 'boolean', null, null, '{}'),
 ('live_room_count', 'Kayıt / prova odası sayısı', 'Recording / rehearsal rooms', 'number', null, null, '{"min":1,"max":50}'),
 ('vocal_booth', 'Vokal kabini', 'Vocal booth', 'boolean', null, null, '{}'),
 ('music_equipment', 'Enstrümanlar ve kayıt ekipmanları', 'Instruments and recording equipment', 'text', null, null, '{"maxLength":3000}'),
 ('audio_engineer', 'Ses mühendisi hizmeti', 'Audio engineer available', 'boolean', null, null, '{}'),
 ('recording_software', 'Kayıt yazılımları', 'Recording software / DAW', 'text', null, null, '{"maxLength":1000}'),
 ('access_information', 'Ulaşım, otopark ve erişilebilirlik', 'Access, parking and accessibility', 'text', null, null, '{"maxLength":1500}'),
 ('house_rules', 'Kullanım kuralları', 'House rules', 'text', null, null, '{"maxLength":2000}')
on conflict (key) do nothing;

-- All fields may be saved in a draft. Required facilities must be completed for review.
with assignments(category_slug, feature_key, position, required, filterable) as (
 values
 ('fotograf-studyosu','studio_website',10,false,false),
 ('fotograf-studyosu','studio_contact_email',20,false,false),
 ('fotograf-studyosu','studio_contact_phone',30,false,false),
 ('fotograf-studyosu','studio_opening_hours',40,false,false),
 ('fotograf-studyosu','shooting_types',100,true,true),
 ('fotograf-studyosu','lighting_setup',110,true,true),
 ('fotograf-studyosu','ceiling_height',120,false,true),
 ('fotograf-studyosu','cyclorama',130,false,true),
 ('fotograf-studyosu','dressing_room',140,false,true),
 ('fotograf-studyosu','photo_equipment',150,false,false),
 ('fotograf-studyosu','backdrop_options',160,false,false),
 ('fotograf-studyosu','access_information',170,false,false),
 ('fotograf-studyosu','house_rules',180,false,false),
 ('muzik-studyosu','studio_website',10,false,false),
 ('muzik-studyosu','studio_contact_email',20,false,false),
 ('muzik-studyosu','studio_contact_phone',30,false,false),
 ('muzik-studyosu','studio_opening_hours',40,false,false),
 ('muzik-studyosu','music_services',100,true,true),
 ('muzik-studyosu','soundproofing',110,false,true),
 ('muzik-studyosu','live_room_count',120,false,true),
 ('muzik-studyosu','vocal_booth',130,false,true),
 ('muzik-studyosu','music_equipment',140,false,false),
 ('muzik-studyosu','audio_engineer',150,false,true),
 ('muzik-studyosu','recording_software',160,false,false),
 ('muzik-studyosu','access_information',170,false,false),
 ('muzik-studyosu','house_rules',180,false,false)
)
insert into public.category_features (category_id, feature_definition_id, sort_order, is_required, is_filterable)
select c.id, f.id, a.position, a.required, a.filterable
from assignments a
join public.categories c on c.slug = a.category_slug
join public.feature_definitions f on f.key = a.feature_key
on conflict (category_id, feature_definition_id) do nothing;

commit;
