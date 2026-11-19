-- Existing price_amount values are retained numerically; the application presents them per hour.
-- Existing studios receive the explicit default minimum of one hour. No listing status is changed.
alter table public.listings add column minimum_booking_hours smallint not null default 1
  constraint listings_minimum_booking_hours_check check (minimum_booking_hours between 1 and 168);
comment on column public.listings.price_amount is 'Hourly rate in the listing currency; no currency conversion is performed.';
comment on column public.listings.minimum_booking_hours is 'Minimum booking duration, in whole hours (1-168).';

-- Add structured options without guessing or rewriting hosts' free-text equipment notes.
insert into public.feature_definitions (key, name_tr, name_en, feature_type, options, validation)
values
  ('photo_equipment_options', 'Dahil olan fotoğraf ve video ekipmanları', 'Included photography and video equipment', 'multi_select', '["camera_body", "lenses", "tripod", "studio_flash", "continuous_led", "softbox", "reflector", "light_stands", "wireless_trigger", "tethering", "product_table", "light_meter"]'::jsonb, '{"optionsTr": {"camera_body": "Kamera gövdesi", "lenses": "Lensler", "tripod": "Tripod", "studio_flash": "Stüdyo flaşı", "continuous_led": "Sürekli LED ışık", "softbox": "Softbox", "reflector": "Reflektör", "light_stands": "Işık ayakları", "wireless_trigger": "Kablosuz tetikleyici", "tethering": "Bilgisayara bağlı çekim", "product_table": "Ürün çekim masası", "light_meter": "Pozometre"}, "optionsEn": {"camera_body": "Camera body", "lenses": "Lenses", "tripod": "Tripod", "studio_flash": "Studio flash", "continuous_led": "Continuous LED lights", "softbox": "Softbox", "reflector": "Reflector", "light_stands": "Light stands", "wireless_trigger": "Wireless trigger", "tethering": "Tethering workstation", "product_table": "Product photography table", "light_meter": "Light meter"}}'::jsonb),
  ('backdrop_types', 'Fon türleri', 'Backdrop types', 'multi_select', '["white_paper", "black_paper", "colored_paper", "fabric", "green_screen", "cyclorama_wall"]'::jsonb, '{"optionsTr": {"white_paper": "Beyaz kağıt fon", "black_paper": "Siyah kağıt fon", "colored_paper": "Renkli kağıt fon", "fabric": "Kumaş fon", "green_screen": "Yeşil perde", "cyclorama_wall": "Sonsuz fon duvarı"}, "optionsEn": {"white_paper": "White paper", "black_paper": "Black paper", "colored_paper": "Colored paper", "fabric": "Fabric backdrop", "green_screen": "Green screen", "cyclorama_wall": "Cyclorama wall"}}'::jsonb),
  ('access_facilities', 'Ulaşım, otopark ve erişilebilirlik olanakları', 'Access, parking and accessibility facilities', 'multi_select', '["step_free", "wheelchair_accessible", "passenger_lift", "freight_lift", "ground_floor", "loading_area", "free_parking", "paid_parking", "street_parking", "public_transport"]'::jsonb, '{"optionsTr": {"step_free": "Basamaksız giriş", "wheelchair_accessible": "Tekerlekli sandalye erişimi", "passenger_lift": "Yolcu asansörü", "freight_lift": "Yük asansörü", "ground_floor": "Giriş katı", "loading_area": "Yükleme / boşaltma alanı", "free_parking": "Ücretsiz otopark", "paid_parking": "Ücretli otopark", "street_parking": "Sokakta park imkanı", "public_transport": "Toplu taşımaya yakın"}, "optionsEn": {"step_free": "Step-free entrance", "wheelchair_accessible": "Wheelchair access", "passenger_lift": "Passenger lift", "freight_lift": "Freight lift", "ground_floor": "Ground floor", "loading_area": "Loading / unloading area", "free_parking": "Free parking", "paid_parking": "Paid parking", "street_parking": "Street parking", "public_transport": "Near public transport"}}'::jsonb),
  ('shared_amenities', 'Ortak olanaklar', 'General amenities', 'multi_select', '["wifi", "air_conditioning", "heating", "private_wc", "kitchen", "changing_room", "makeup_station", "waiting_area", "shower", "three_phase_power"]'::jsonb, '{"optionsTr": {"wifi": "Wi-Fi", "air_conditioning": "Klima", "heating": "Isıtma", "private_wc": "Özel tuvalet", "kitchen": "Mutfak", "changing_room": "Giyinme odası", "makeup_station": "Makyaj alanı", "waiting_area": "Bekleme / dinlenme alanı", "shower": "Duş", "three_phase_power": "Trifaze elektrik"}, "optionsEn": {"wifi": "Wi-Fi", "air_conditioning": "Air conditioning", "heating": "Heating", "private_wc": "Private WC", "kitchen": "Kitchen", "changing_room": "Changing room", "makeup_station": "Makeup station", "waiting_area": "Waiting / lounge area", "shower": "Shower", "three_phase_power": "Three-phase power"}}'::jsonb),
  ('house_rules_options', 'Standart kullanım kuralları', 'Standard house rules', 'multi_select', '["no_smoking", "no_food_on_set", "no_pets", "quiet_hours", "clean_after_use", "staff_required"]'::jsonb, '{"optionsTr": {"no_smoking": "Sigara içilmez", "no_food_on_set": "Sette yiyecek yasaktır", "no_pets": "Evcil hayvan kabul edilmez", "quiet_hours": "Sessiz saatlere uyulmalıdır", "clean_after_use": "Kullanım sonrası temizlik", "staff_required": "Stüdyo görevlisi bulunmalıdır"}, "optionsEn": {"no_smoking": "No smoking", "no_food_on_set": "No food on set", "no_pets": "No pets", "quiet_hours": "Quiet hours apply", "clean_after_use": "Clean up after use", "staff_required": "Studio staff must be present"}}'::jsonb),
  ('music_equipment_options', 'Dahil olan enstrümanlar ve kayıt ekipmanları', 'Included instruments and recording equipment', 'multi_select', '["condenser_mics", "dynamic_mics", "audio_interface", "mixing_console", "studio_monitors", "headphones", "drum_kit", "keyboard", "piano", "guitar_amp", "bass_amp", "di_box"]'::jsonb, '{"optionsTr": {"condenser_mics": "Kondenser mikrofonlar", "dynamic_mics": "Dinamik mikrofonlar", "audio_interface": "Ses kartı", "mixing_console": "Miks konsolu", "studio_monitors": "Referans monitörleri", "headphones": "Kulaklıklar", "drum_kit": "Davul seti", "keyboard": "Klavye / synthesizer", "piano": "Piyano", "guitar_amp": "Gitar amfisi", "bass_amp": "Bas amfisi", "di_box": "DI box"}, "optionsEn": {"condenser_mics": "Condenser microphones", "dynamic_mics": "Dynamic microphones", "audio_interface": "Audio interface", "mixing_console": "Mixing console", "studio_monitors": "Studio monitors", "headphones": "Headphones", "drum_kit": "Drum kit", "keyboard": "Keyboard / synthesizer", "piano": "Piano", "guitar_amp": "Guitar amplifier", "bass_amp": "Bass amplifier", "di_box": "DI box"}}'::jsonb),
  ('recording_software_options', 'Kayıt yazılımları', 'Recording software / DAW', 'multi_select', '["pro_tools", "logic_pro", "ableton_live", "cubase", "studio_one", "reaper", "fl_studio"]'::jsonb, '{"optionsTr": {"pro_tools": "Pro Tools", "logic_pro": "Logic Pro", "ableton_live": "Ableton Live", "cubase": "Cubase", "studio_one": "Studio One", "reaper": "REAPER", "fl_studio": "FL Studio"}, "optionsEn": {"pro_tools": "Pro Tools", "logic_pro": "Logic Pro", "ableton_live": "Ableton Live", "cubase": "Cubase", "studio_one": "Studio One", "reaper": "REAPER", "fl_studio": "FL Studio"}}'::jsonb)
on conflict (key) do nothing;

-- Keep all previously entered notes, under clearer additional-details labels.
update public.feature_definitions set name_tr = case key
  when 'photo_equipment' then 'Ek fotoğraf ekipmanı bilgileri / modeller'
  when 'music_equipment' then 'Ek müzik ekipmanı bilgileri / modeller'
  when 'backdrop_options' then 'Ek fon bilgileri'
  when 'access_information' then 'Yol tarifi ve ek erişim bilgileri'
  when 'house_rules' then 'Ek kullanım kuralları'
  when 'recording_software' then 'Diğer yazılımlar / sürümler' end,
name_en = case key
  when 'photo_equipment' then 'Additional photography equipment / models'
  when 'music_equipment' then 'Additional music equipment / models'
  when 'backdrop_options' then 'Additional backdrop details'
  when 'access_information' then 'Directions and additional access details'
  when 'house_rules' then 'Additional house rules'
  when 'recording_software' then 'Other software / versions' end
where key in ('photo_equipment','music_equipment','backdrop_options','access_information','house_rules','recording_software');

with assignments(category_slug, feature_key, position) as (values
 ('fotograf-studyosu','photo_equipment_options',145),
 ('fotograf-studyosu','backdrop_types',155),
 ('muzik-studyosu','music_equipment_options',135),
 ('muzik-studyosu','recording_software_options',155),
 ('fotograf-studyosu','access_facilities',165),
 ('muzik-studyosu','access_facilities',165),
 ('fotograf-studyosu','shared_amenities',175),
 ('muzik-studyosu','shared_amenities',175),
 ('fotograf-studyosu','house_rules_options',179),
 ('muzik-studyosu','house_rules_options',179)
)
insert into public.category_features (category_id, feature_definition_id, sort_order, is_required, is_filterable)
select c.id, f.id, a.position, false, true
from assignments a join public.categories c on c.slug=a.category_slug
join public.feature_definitions f on f.key=a.feature_key
on conflict (category_id, feature_definition_id) do nothing;

-- Refuse to discard unknown lighting values or overwrite a customized catalog.
do $$ begin
 if exists (select 1 from public.feature_definitions where key='lighting_setup' and feature_type not in ('select','multi_select'))
 or exists (select 1 from public.listing_feature_values v join public.feature_definitions f on f.id=v.feature_definition_id
   where f.key='lighting_setup' and v.value_text is not null and v.value_text not in ('daylight','artificial','both'))
 or exists (select 1 from public.listing_feature_values v join public.feature_definitions f on f.id=v.feature_definition_id where f.key='lighting_setup' and v.value_json is not null and not ('["daylight","artificial"]'::jsonb @> v.value_json)) then
   raise exception 'lighting_catalog_requires_manual_review';
 end if;
end $$;
update public.feature_definitions set feature_type='multi_select', options='["daylight","artificial"]',
 validation=validation || '{"optionsTr":{"daylight":"Doğal ışık","artificial":"Yapay ışık"},"optionsEn":{"daylight":"Daylight","artificial":"Artificial lighting"}}'::jsonb
where key='lighting_setup';
update public.listing_feature_values v
set value_json=case v.value_text when 'both' then '["daylight","artificial"]'::jsonb else jsonb_build_array(v.value_text) end,
    value_text=null
from public.feature_definitions f
where f.id=v.feature_definition_id and f.key='lighting_setup' and v.value_text is not null;
