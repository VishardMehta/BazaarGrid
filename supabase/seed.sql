-- ============================================================
-- BazaarGrid — Rich seed data
-- Run this in Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- ── Fix prices to proper INR amounts & add images ───────────
UPDATE products SET
  price = 380,
  images = ARRAY['https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=800&q=80&fit=crop']
WHERE id = 'c0000000-0000-0000-0000-000000000001';

UPDATE products SET
  price = 320,
  images = ARRAY['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&q=80&fit=crop']
WHERE id = 'c0000000-0000-0000-0000-000000000002';

UPDATE products SET
  price = 850,
  images = ARRAY['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&q=80&fit=crop']
WHERE id = 'c0000000-0000-0000-0000-000000000003';

UPDATE products SET
  price = 180,
  images = ARRAY['https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80&fit=crop']
WHERE id = 'c0000000-0000-0000-0000-000000000004';

UPDATE products SET
  price = 650,
  images = ARRAY['https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80&fit=crop']
WHERE id = 'c0000000-0000-0000-0000-000000000005';

UPDATE products SET
  price = 280,
  images = ARRAY['https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=800&q=80&fit=crop']
WHERE id = 'c0000000-0000-0000-0000-000000000006';

UPDATE products SET
  price = 1800,
  images = ARRAY['https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=800&q=80&fit=crop']
WHERE id = 'c0000000-0000-0000-0000-000000000007';

UPDATE products SET
  price = 1200,
  images = ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&fit=crop']
WHERE id = 'c0000000-0000-0000-0000-000000000008';

UPDATE products SET
  price = 160,
  images = ARRAY['https://images.unsplash.com/photo-1498579150354-977475b7ea0b?w=800&q=80&fit=crop']
WHERE id = 'c0000000-0000-0000-0000-000000000009';

UPDATE products SET
  price = 480,
  images = ARRAY['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80&fit=crop']
WHERE id = 'c0000000-0000-0000-0000-000000000010';

-- ── New sellers ──────────────────────────────────────────────
INSERT INTO sellers (id, village_id, type, name, tagline, story, village, region, phone, email, verified, traceability_score, rating, review_count, product_count, member_since, brand_accents, status)
VALUES
  ('b0000000-0000-0000-0000-000000000006','a0000000-0000-0000-0000-000000000001','VILLAGE_PRODUCER',
   'Himalayan Beeworks','Pure mountain honey from altitude hives',
   'Nestled at 2,400m in the Kullu valley, our hives feed on rhododendron, buckwheat and alpine wildflowers. Every batch is single-origin and hand-labelled.',
   'Green Valley','Himachal Pradesh','91-98765-11001','hello@himalayanbeeworks.example',
   true, 96, 4.9, 187, 6, '2021-04-10', ARRAY['#8B5E3C','#4A7C59','#C8A96E'], 'ACTIVE'),

  ('b0000000-0000-0000-0000-000000000007','a0000000-0000-0000-0000-000000000001','VILLAGE_PRODUCER',
   'Valley Herbals','Wildcrafted herbal teas & infusions',
   'Our family of foragers collects herbs from the sub-alpine meadows of Himachal every summer and sun-dries them at altitude to preserve potency.',
   'Green Valley','Himachal Pradesh','91-98765-11002','info@valleyherbals.example',
   true, 88, 4.6, 93, 8, '2022-11-05', ARRAY['#4A7C59','#8B5E3C','#2C5F2E'], 'ACTIVE'),

  ('b0000000-0000-0000-0000-000000000008','a0000000-0000-0000-0000-000000000002','VILLAGE_PRODUCER',
   'Goa Salt & Sea','Artisan sea salts and coastal condiments',
   'We harvest salt from the mangrove tidal flats of North Goa using methods passed down from the kharwas community for over 400 years.',
   'Coastal Harvest','Goa','91-98765-22001','hello@goasaltandsea.example',
   true, 82, 4.5, 71, 7, '2023-03-18', ARRAY['#1A6B8A','#C8A96E','#4A7C59'], 'ACTIVE'),

  ('b0000000-0000-0000-0000-000000000009','a0000000-0000-0000-0000-000000000003','VILLAGE_PRODUCER',
   'Rajwada Pottery Studio','Wheel-thrown terracotta & blue pottery',
   'Three generations of potters in Jaipur. We mix blue-pottery tradition with modern forms — all pieces are fired in wood kilns using camel dung and eucalyptus.',
   'Desert Rose','Rajasthan','91-98765-33001','studio@rajwadapottery.example',
   true, 93, 4.8, 204, 11, '2020-09-20', ARRAY['#1A6B8A','#9d3d2e','#C8A96E'], 'ACTIVE'),

  ('b0000000-0000-0000-0000-000000000010','a0000000-0000-0000-0000-000000000003','VILLAGE_PRODUCER',
   'Thar Spice House','Single-origin Rajasthani spices & masalas',
   'We source directly from smallholder farms in the Thar desert region — cumin, coriander, dried chilli and ker-sangri — and stone-grind everything to order.',
   'Desert Rose','Rajasthan','91-98765-33002','spices@tharspicehouse.example',
   true, 89, 4.7, 142, 9, '2021-07-12', ARRAY['#C8A96E','#9d3d2e','#4A7C59'], 'ACTIVE'),

  ('b0000000-0000-0000-0000-000000000011','a0000000-0000-0000-0000-000000000004','VILLAGE_PRODUCER',
   'Kumaon Organics','Certified organic mountain produce',
   'Family farm at 1,800m in Binsar, Uttarakhand. We grow heirloom rice, dal and finger millet under a certified organic regime since 2015.',
   'Hill Top Crafts','Uttarakhand','91-98765-44001','farm@kumaonorganics.example',
   true, 91, 4.6, 68, 7, '2022-02-28', ARRAY['#4A7C59','#2C5F2E','#C8A96E'], 'ACTIVE'),

  ('b0000000-0000-0000-0000-000000000012','a0000000-0000-0000-0000-000000000004','VILLAGE_PRODUCER',
   'Pahadi Handlooms','Hand-woven woollen shawls & scarves',
   'Weavers of Uttarakhand''s Garhwal hills create traditional angora and merino shawls on pit looms. Each piece takes 3–5 days to complete.',
   'Hill Top Crafts','Uttarakhand','91-98765-44002','weave@pahadihandlooms.example',
   true, 85, 4.7, 89, 5, '2021-12-01', ARRAY['#8B5E3C','#C8A96E','#4A7C59'], 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- ── New products ─────────────────────────────────────────────
INSERT INTO products (id, seller_id, name, description, story, price, currency, unit, category, status, stock, traceable, organic, batch_id, tags, rating, review_count, images)
VALUES
  -- Himalayan Beeworks
  ('c0000000-0000-0000-0000-000000000011','b0000000-0000-0000-0000-000000000006',
   'Rhododendron Honey','Single-flora honey from high-altitude rhododendron groves.',
   'Collected in April when the Buransh (rhododendron) blooms carpet the ridgeline above 2,200m. Rich amber colour, mildly tangy, with a long floral finish.',
   520,'INR','250g jar','HONEY','LIVE',38,true,true,'BG-2025-RH-011',ARRAY['Single Flora','Raw','Cold-Extracted'],4.9,74,
   ARRAY['https://images.unsplash.com/photo-1558642891-54be180ea339?w=800&q=80&fit=crop']),

  ('c0000000-0000-0000-0000-000000000012','b0000000-0000-0000-0000-000000000006',
   'Buckwheat Honey','Dark, robust buckwheat honey with high antioxidant content.',
   'Our buckwheat fields grow above the treeline. This honey is darker and more mineral than floral varieties — beloved by chefs and health-conscious buyers alike.',
   450,'INR','500g jar','HONEY','LIVE',52,true,true,'BG-2025-BH-019',ARRAY['Dark Honey','Antioxidant Rich','Raw'],4.8,61,
   ARRAY['https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=800&q=80&fit=crop']),

  -- Valley Herbals
  ('c0000000-0000-0000-0000-000000000013','b0000000-0000-0000-0000-000000000007',
   'Himalayan Tulsi & Ginger Tea','Sun-dried tulsi leaf blended with wild ginger root.',
   'Foraged from forests above Manali between June and August, dried on bamboo racks at altitude, then blended in small batches.',
   220,'INR','50g tin','HERBS','LIVE',90,true,true,'BG-2025-TG-003',ARRAY['Wildcrafted','Caffeine-Free','Organic'],4.7,48,
   ARRAY['https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&q=80&fit=crop']),

  ('c0000000-0000-0000-0000-000000000014','b0000000-0000-0000-0000-000000000007',
   'Brahmi & Ashwagandha Blend','Adaptogenic herb blend for focus and calm.',
   'Hand-picked brahmi from valley wetlands and certified organic ashwagandha root from HP farms. Slow-dried to preserve active withanolides.',
   340,'INR','40g pouch','HERBS','LIVE',65,true,true,'BG-2025-BA-007',ARRAY['Adaptogenic','Ayurvedic','Organic'],4.6,39,
   ARRAY['https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80&fit=crop']),

  -- Goa Salt & Sea
  ('c0000000-0000-0000-0000-000000000015','b0000000-0000-0000-0000-000000000008',
   'Mangrove Smoked Sea Salt','Slow-smoked artisan salt from Goa''s tidal flats.',
   'Traditional kharwa-community salt is cold-smoked over mangrove wood chips for 48 hours, giving a deep, savoury finish perfect for finishing meats and vegetables.',
   320,'INR','150g tin','SPICES','LIVE',44,false,false,'BG-2025-SS-022',ARRAY['Smoked','Hand-Harvested','Artisan'],4.8,57,
   ARRAY['https://images.unsplash.com/photo-1530099486328-e021101a494a?w=800&q=80&fit=crop']),

  ('c0000000-0000-0000-0000-000000000016','b0000000-0000-0000-0000-000000000008',
   'Coastal Kokum Syrup','Sun-dried kokum concentrate — Goa''s answer to tamarind.',
   'We macerate hand-picked kokum rinds in brine for 21 days before concentrating into a jewel-red syrup. Ideal in curries, shrubs and summer drinks.',
   190,'INR','200ml bottle','CULINARY','LIVE',60,false,true,'BG-2025-KS-009',ARRAY['Artisan','No Preservatives','Coastal'],4.5,33,
   ARRAY['https://images.unsplash.com/photo-1612528443702-f6741f70a049?w=800&q=80&fit=crop']),

  -- Coast Artisans
  ('c0000000-0000-0000-0000-000000000017','b0000000-0000-0000-0000-000000000003',
   'Tide Pool Espresso Cup Set','Set of 4 hand-thrown espresso cups with ocean-glaze.',
   'Each cup is thrown on the wheel by hand and glazed with a compound of locally-sourced iron oxide and sea-glass powder — no two are identical.',
   980,'INR','set of 4','POTTERY','LIVE',14,true,false,'BG-2025-EC-031',ARRAY['Handmade','Stoneware','Gift Ready'],4.8,28,
   ARRAY['https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?w=800&q=80&fit=crop']),

  -- Rajwada Pottery
  ('c0000000-0000-0000-0000-000000000018','b0000000-0000-0000-0000-000000000009',
   'Jaipur Blue Pottery Vase','Hand-painted blue pottery vase in traditional motifs.',
   'Using quartz paste and kaolinite clay in the centuries-old Mughal-era method, our craftsmen hand-paint each vase before a double-fire kiln process.',
   750,'INR','each','POTTERY','LIVE',22,true,false,'BG-2025-BV-015',ARRAY['Heritage','Blue Pottery','Gift Ready'],4.9,112,
   ARRAY['https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80&fit=crop']),

  ('c0000000-0000-0000-0000-000000000019','b0000000-0000-0000-0000-000000000009',
   'Terracotta Masala Dani','Traditional 7-compartment spice box in terracotta.',
   'Inspired by the classic steel masala dani but crafted from red terracotta clay — keeps spices naturally cool and dry in India''s heat.',
   550,'INR','each','POTTERY','LIVE',30,false,false,'BG-2025-MD-008',ARRAY['Traditional','Handmade','Kitchen'],4.7,67,
   ARRAY['https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800&q=80&fit=crop']),

  -- Thar Spice House
  ('c0000000-0000-0000-0000-000000000020','b0000000-0000-0000-0000-000000000010',
   'Rajasthani Laal Maas Masala','Stone-ground spice blend for the classic Rajasthani mutton dish.',
   'We source whole Mathania chillis, Jodhpur coriander and Nagaur cumin separately, then stone-grind them fresh to order in small batches.',
   280,'INR','100g pack','SPICES','LIVE',80,false,true,'BG-2025-LM-014',ARRAY['Stone-Ground','Authentic','Chef Favourite'],4.8,98,
   ARRAY['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80&fit=crop']),

  ('c0000000-0000-0000-0000-000000000021','b0000000-0000-0000-0000-000000000010',
   'Ker-Sangri Pickle','Traditional wild desert bean & berry pickle in mustard oil.',
   'Ker (wild capers) and sangri (desert beans) are foraged from the khejri trees of the Thar. Sun-pickled in mustard oil and spices for 21 days.',
   220,'INR','250g jar','CULINARY','LIVE',55,false,true,'BG-2025-KP-006',ARRAY['Traditional','Foraged','Artisan'],4.6,44,
   ARRAY['https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&q=80&fit=crop']),

  -- Desert Weavers
  ('c0000000-0000-0000-0000-000000000022','b0000000-0000-0000-0000-000000000004',
   'Sanganeri Block-Print Dupatta','Hand block-printed cotton dupatta in Sanganeri motifs.',
   'Printed in natural vegetable dyes using 150-year-old carved teak blocks in our family''s Sanganer workshop. Each dupatta takes a full day to print.',
   680,'INR','each','TEXTILES','LIVE',18,true,false,'BG-2025-SD-027',ARRAY['Natural Dye','Handmade','Heritage'],4.8,76,
   ARRAY['https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=800&q=80&fit=crop']),

  ('c0000000-0000-0000-0000-000000000023','b0000000-0000-0000-0000-000000000004',
   'Ajrakh Print Cushion Covers','Pair of hand block-printed ajrakh cushion covers.',
   'Ajrakh is a resist-printing technique using clay paste and natural dyes — indigo for blue, madder root for red. A 16-step process over 3 days.',
   520,'INR','pair (45×45cm)','TEXTILES','LIVE',24,true,false,'BG-2025-AC-018',ARRAY['Ajrakh','Natural Dye','Heritage Print'],4.7,53,
   ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&fit=crop']),

  -- Kumaon Organics
  ('c0000000-0000-0000-0000-000000000024','b0000000-0000-0000-0000-000000000011',
   'Red Rice of Kumaon','Heirloom red rice grown at 1,600m without chemicals.',
   'Lal chawal (red rice) has been grown in the Kumaon hills for centuries. Our certified organic plots use only cow-dung compost and rainwater irrigation.',
   240,'INR','1kg bag','GRAINS','LIVE',150,false,true,'BG-2025-RR-002',ARRAY['Heirloom','Organic','Mountain Grown'],4.7,58,
   ARRAY['https://images.unsplash.com/photo-1498579150354-977475b7ea0b?w=800&q=80&fit=crop']),

  ('c0000000-0000-0000-0000-000000000025','b0000000-0000-0000-0000-000000000011',
   'Gahat Dal (Horse Gram)','Protein-rich mountain lentil, slow-cooked Kumaoni staple.',
   'Gahat is a winter staple across Kumaon — slow-cooked in iron pots with jakhiya tempering. Our variety is grown rain-fed at altitude with no synthetic inputs.',
   180,'INR','500g pack','GRAINS','LIVE',120,false,true,'BG-2025-GD-011',ARRAY['Organic','Protein Rich','Heirloom'],4.6,42,
   ARRAY['https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80&fit=crop']),

  ('c0000000-0000-0000-0000-000000000026','b0000000-0000-0000-0000-000000000011',
   'Mandua Flour (Finger Millet)','Stone-milled ragi flour from Uttarakhand highlands.',
   'Mandua ragi is the traditional staple grain of the Garhwal-Kumaon hills, ground on traditional water-driven chakki mills. Rich in calcium and iron.',
   160,'INR','1kg bag','GRAINS','LIVE',90,false,true,'BG-2025-MF-005',ARRAY['Stone-Milled','Gluten-Free','Organic'],4.5,31,
   ARRAY['https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80&fit=crop']),

  -- Pahadi Handlooms
  ('c0000000-0000-0000-0000-000000000027','b0000000-0000-0000-0000-000000000012',
   'Garhwali Merino Shawl','Hand-woven pure merino shawl in natural undyed wool.',
   'Woven on pit looms by women weavers in a collective of 14 artisans from Pauri Garhwal. Natural undyed wool from local Bhedpalan sheep-keeping families.',
   2800,'INR','each','TEXTILES','LIVE',8,true,false,'BG-2025-GS-003',ARRAY['Handwoven','Pure Merino','Natural'],4.9,34,
   ARRAY['https://images.unsplash.com/photo-1617196034294-e5f4f196eb15?w=800&q=80&fit=crop']),

  ('c0000000-0000-0000-0000-000000000028','b0000000-0000-0000-0000-000000000012',
   'Kinnauri Patterned Woollen Stole','Traditional geometric-patterned Kinnauri stole.',
   'Kinnaur weaving uses a supplementary weft technique to create the distinctive diagonal stripe patterns. Our weavers use naturally dyed wool and a hand-operated loom.',
   1600,'INR','each','TEXTILES','LIVE',12,false,false,'BG-2025-KS-009',ARRAY['Traditional Pattern','Handwoven','Kinnauri'],4.8,47,
   ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&fit=crop']),

  -- Old Oak Mill additional products
  ('c0000000-0000-0000-0000-000000000029','b0000000-0000-0000-0000-000000000002',
   'Kala Chana (Black Chickpea)','Heritage black chickpea, stone-milled to coarse besan.',
   'We source Desi kala chana from a single farm in the Kangra valley and mill it coarse on the same 1923 millstone. Rich in fibre and iron.',
   210,'INR','1kg bag','GRAINS','LIVE',110,false,true,'BG-2025-KC-012',ARRAY['Heirloom','Stone-Milled','High Protein'],4.6,29,
   ARRAY['https://images.unsplash.com/photo-1498579150354-977475b7ea0b?w=800&q=80&fit=crop']),

  ('c0000000-0000-0000-0000-000000000030','b0000000-0000-0000-0000-000000000001',
   'Forest Wildflower Honey','Multi-flora raw honey from deep forest hives.',
   'Set deep in the Oakridge Forest, our wildflower hives forage across hundreds of species of hill flowers. Lighter in colour than our single-flora varieties but complex in flavour.',
   350,'INR','500g jar','HONEY','LIVE',45,true,true,'BG-2025-WH-031',ARRAY['Multi-Flora','Raw','Forest'],4.8,89,
   ARRAY['https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=800&q=80&fit=crop'])
ON CONFLICT (id) DO NOTHING;

-- ── Extra certifications ─────────────────────────────────────
INSERT INTO certifications (seller_id, label, icon) VALUES
  ('b0000000-0000-0000-0000-000000000006','Verified Producer','verified'),
  ('b0000000-0000-0000-0000-000000000006','Organic Certified','eco'),
  ('b0000000-0000-0000-0000-000000000006','QR-Traceable','qr_code_2'),
  ('b0000000-0000-0000-0000-000000000007','Verified Producer','verified'),
  ('b0000000-0000-0000-0000-000000000007','Wildcrafted','nature'),
  ('b0000000-0000-0000-0000-000000000008','Verified Producer','verified'),
  ('b0000000-0000-0000-0000-000000000008','Heritage Craft','handshake'),
  ('b0000000-0000-0000-0000-000000000009','Verified Producer','verified'),
  ('b0000000-0000-0000-0000-000000000009','Heritage Craft','handshake'),
  ('b0000000-0000-0000-0000-000000000009','QR-Traceable','qr_code_2'),
  ('b0000000-0000-0000-0000-000000000010','Verified Producer','verified'),
  ('b0000000-0000-0000-0000-000000000011','Verified Producer','verified'),
  ('b0000000-0000-0000-0000-000000000011','Organic Certified','eco'),
  ('b0000000-0000-0000-0000-000000000011','QR-Traceable','qr_code_2'),
  ('b0000000-0000-0000-0000-000000000012','Verified Producer','verified'),
  ('b0000000-0000-0000-0000-000000000012','Heritage Craft','handshake')
ON CONFLICT DO NOTHING;

-- ── Update village product counts ────────────────────────────
UPDATE villages SET product_count = 18, producer_count = 4 WHERE id = 'a0000000-0000-0000-0000-000000000001';
UPDATE villages SET product_count = 16, producer_count = 3 WHERE id = 'a0000000-0000-0000-0000-000000000002';
UPDATE villages SET product_count = 22, producer_count = 4 WHERE id = 'a0000000-0000-0000-0000-000000000003';
UPDATE villages SET product_count = 15, producer_count = 4 WHERE id = 'a0000000-0000-0000-0000-000000000004';
