-- ============================================================
-- Vybe Seed Data — 20 Dummy Users for Discover Feed Testing
-- Run this against your Supabase / PostgreSQL database
-- Prerequisites: bio TEXT and badges TEXT[] columns must exist
--   If missing: ALTER TABLE users ADD COLUMN bio TEXT;
--               ALTER TABLE users ADD COLUMN badges TEXT[] DEFAULT '{}';
-- ============================================================

-- Idempotent cleanup (safe to re-run)
DELETE FROM user_photos WHERE user_id IN (SELECT id FROM users WHERE phone LIKE '+9100000000%');
DELETE FROM users WHERE phone LIKE '+9100000000%';

-- ── Insert 20 users ────────────────────────────────────────────────────────────
INSERT INTO users (
  phone, country_code, name, dob, gender, bio, city, lat, lng,
  interests, badges, profile_complete, voice_url
) VALUES
-- Women
('+910000000001','+91','Priya Sharma',  '2000-03-15','Female','Art gallery hopper 🎨 underground techno at night. Late night chai is mandatory ☕️✨','Mumbai',    19.0596, 72.8295,ARRAY['Music','Art','Nightlife','Photography'],   ARRAY['🔥 Vybe Starter','✨ Early Adopter'],  true,'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'),
('+910000000002','+91','Aisha Khan',    '2002-07-22','Female','Fashion is self-expression 👗 travel is therapy ✈️ making memories every single day',  'Mumbai',    19.1197, 72.8468,ARRAY['Fashion','Travel','Photography','Food'],     ARRAY['🔥 Vybe Starter','🌟 Main Character'],  true,NULL),
('+910000000003','+91','Kavya Nair',    '1998-11-08','Female','Software engineer by day 💻 weekend hiker 🥾 coffee is my primary love language',       'Bangalore', 12.9716, 77.5946,ARRAY['Tech','Fitness','Hiking','Books'],           ARRAY['✨ Early Adopter','🎯 Goal Getter'],     true,'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'),
('+910000000004','+91','Riya Mehta',    '2003-04-30','Female','Foodie 🍕 music lover 🎵 art enthusiast 🎨 always up for the next unexpected adventure','Mumbai',    19.1074, 72.8274,ARRAY['Food','Music','Art','Movies'],               ARRAY['🔥 Vybe Starter','🎵 Music Head'],      true,NULL),
('+910000000005','+91','Ananya Joshi',  '1999-09-17','Female','Yoga 🧘 and good books 📚. Slow living in a fast world. Chai over coffee always.',      'Pune',      18.5204, 73.8567,ARRAY['Yoga','Books','Travel','Cooking'],           ARRAY['🧘 Chill Vibes','✨ Early Adopter'],    true,'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'),
('+910000000006','+91','Shreya Gupta',  '2001-12-05','Female','Dancer 💃 traveler ✈️ making the world my stage. DM for collabs!',                     'Delhi',     28.6139, 77.2090,ARRAY['Dance','Travel','Fashion','Music'],          ARRAY['🌙 Night Owl','💃 Party Animal'],       true,NULL),
('+910000000007','+91','Neha Patel',    '1997-06-20','Female','Fitness freak 🏋️ cricket stan ⚽ living for the gym and good playlists 🎵',             'Mumbai',    19.1869, 72.8482,ARRAY['Fitness','Sports','Music','Food'],           ARRAY['🎯 Goal Getter','💯 Realest'],          true,'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'),
('+910000000008','+91','Dia Kapoor',    '2003-02-14','Female','Capturing life one frame at a time 📸 Art is my superpower 🎨 Nightlife is my timezone','Mumbai',    19.0596, 72.8270,ARRAY['Photography','Art','Nightlife','Fashion'],   ARRAY['🔥 Vybe Starter','🌟 Main Character'],  true,NULL),
('+910000000009','+91','Pooja Rao',     '1996-08-25','Female','Game dev 🎮 tech geek 💻 metalhead 🎵 find me at hackathons or underground concerts',    'Hyderabad', 17.3850, 78.4867,ARRAY['Gaming','Tech','Music','Art'],               ARRAY['⚡ Social Spark','🎯 Goal Getter'],     true,'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'),
('+910000000010','+91','Tara Singh',    '2002-05-11','Female','Street food explorer 🍕 travel photographer ✈️ 📸 always planning the next getaway',     'Mumbai',    19.2307, 72.8567,ARRAY['Food','Travel','Fashion','Photography'],     ARRAY['✈️ Wanderer','💃 Party Animal'],       true,NULL),
-- Men
('+910000000011','+91','Arjun Sharma',  '1999-01-28','Male','Music producer 🎵 nightlife connoisseur 🌃 living for the drop. Electronic vibes only',   'Mumbai',    19.1197, 72.8400,ARRAY['Music','Nightlife','Art','Tech'],            ARRAY['🎵 Music Head','🌙 Night Owl'],         true,'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'),
('+910000000012','+91','Dev Kapoor',    '1997-10-03','Male','Photographer 📸 coffee addict ☕ tech enthusiast 💻 always up for a collab',              'Mumbai',    19.0640, 72.8290,ARRAY['Photography','Tech','Food','Art'],           ARRAY['⚡ Social Spark','✨ Early Adopter'],   true,NULL),
('+910000000013','+91','Rishi Mehta',   '2001-03-19','Male','Gamer 🎮 coder 💻 sports fan ⚽ living that NPC life unironically lol',                   'Pune',      18.5300, 73.8700,ARRAY['Gaming','Tech','Sports','Movies'],           ARRAY['🔥 Vybe Starter','🎯 Goal Getter'],     true,NULL),
('+910000000014','+91','Kabir Khan',    '1998-07-07','Male','Runner 🏃 gym rat 🏋️ traveler ✈️ half marathon done — ultramarathon next',               'Delhi',     28.6200, 77.2100,ARRAY['Fitness','Sports','Travel','Food'],          ARRAY['💯 Realest','🎯 Goal Getter'],          true,'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3'),
('+910000000015','+91','Aarav Joshi',   '2000-11-22','Male','Jazz & soul 🎵 wannabe artist 🎨 coffee shop regular ☕ Bangalore is always home',         'Bangalore', 12.9800, 77.5900,ARRAY['Music','Art','Food','Books'],               ARRAY['🎵 Music Head','🧘 Chill Vibes'],       true,NULL),
('+910000000016','+91','Vihaan Patel',  '2002-09-08','Male','Street food explorer 🍕 travel photographer ✈️ 📸 always on the move',                   'Mumbai',    19.1100, 72.8300,ARRAY['Food','Travel','Photography','Sports'],     ARRAY['✈️ Wanderer','🔥 Vybe Starter'],       true,'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'),
('+910000000017','+91','Rohan Singh',   '1996-04-14','Male','Backend dev ⚙️ gamer 🎮 bookworm 📚 building cool things and reading cooler stuff',      'Thane',     19.2183, 72.9781,ARRAY['Tech','Gaming','Books','Music'],            ARRAY['⚡ Social Spark','💯 Realest'],          true,NULL),
('+910000000018','+91','Aditya Nair',   '2003-06-01','Male','Classical fusion meets underground electronica 🎵 art kid 🎨 nightlife is my timezone 🌃', 'Chennai',   13.0827, 80.2707,ARRAY['Music','Art','Nightlife','Dance'],          ARRAY['🌙 Night Owl','🎵 Music Head'],         true,'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3'),
('+910000000019','+91','Karan Gupta',   '1995-12-30','Male','Footballer ⚽ trekker 🥾 fitness coach 🏋️ weekends are always for the mountains',         'Mumbai',    19.2350, 72.8550,ARRAY['Sports','Fitness','Hiking','Travel'],       ARRAY['💯 Realest','🎯 Goal Getter'],          true,NULL),
('+910000000020','+91','Yash Rao',      '2001-08-18','Male','Street photographer 📸 fashion forward 👗 music is life 🎵 collab DMs always open',        'Mumbai',    19.1850, 72.8460,ARRAY['Photography','Fashion','Music','Art'],      ARRAY['🌟 Main Character','⚡ Social Spark'],  true,'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3');

-- ── Insert photos for all 20 users ────────────────────────────────────────────
-- Using Unsplash photos (free to use, no auth required)
WITH photo_data(phone, pos, url) AS (
  VALUES
  -- Priya Sharma (1) — 2 photos
  ('+910000000001', 0, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80'),
  ('+910000000001', 1, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80'),
  -- Aisha Khan (2)
  ('+910000000002', 0, 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80'),
  ('+910000000002', 1, 'https://images.unsplash.com/photo-1524504388688-3846b2b18bfd?w=600&q=80'),
  -- Kavya Nair (3)
  ('+910000000003', 0, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=80'),
  ('+910000000003', 1, 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&q=80'),
  -- Riya Mehta (4)
  ('+910000000004', 0, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&q=80'),
  ('+910000000004', 1, 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&q=80'),
  -- Ananya Joshi (5)
  ('+910000000005', 0, 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=600&q=80'),
  ('+910000000005', 1, 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&q=80'),
  -- Shreya Gupta (6)
  ('+910000000006', 0, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80'),
  ('+910000000006', 1, 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80'),
  -- Neha Patel (7)
  ('+910000000007', 0, 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&q=80'),
  ('+910000000007', 1, 'https://images.unsplash.com/photo-1614289371518-722f2615943d?w=600&q=80'),
  -- Dia Kapoor (8)
  ('+910000000008', 0, 'https://images.unsplash.com/photo-1597248374161-426f0d943c45?w=600&q=80'),
  ('+910000000008', 1, 'https://images.unsplash.com/photo-1581424290030-3c6a21b4fa84?w=600&q=80'),
  -- Pooja Rao (9)
  ('+910000000009', 0, 'https://images.unsplash.com/photo-1610227539468-a18fbdb1cbde?w=600&q=80'),
  ('+910000000009', 1, 'https://images.unsplash.com/photo-1621784563330-c87f396e35cc?w=600&q=80'),
  -- Tara Singh (10)
  ('+910000000010', 0, 'https://images.unsplash.com/photo-1596815064285-45ed8a9c0463?w=600&q=80'),
  ('+910000000010', 1, 'https://images.unsplash.com/photo-1485893226298-e08f9f9f3c3e?w=600&q=80'),
  -- Arjun Sharma (11)
  ('+910000000011', 0, 'https://images.unsplash.com/photo-1535713875284-0d1587e9b52e?w=600&q=80'),
  ('+910000000011', 1, 'https://images.unsplash.com/photo-1542909168-82c0cbc3422c?w=600&q=80'),
  -- Dev Kapoor (12)
  ('+910000000012', 0, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=80'),
  ('+910000000012', 1, 'https://images.unsplash.com/photo-1549068106-b024baf0d21d?w=600&q=80'),
  -- Rishi Mehta (13)
  ('+910000000013', 0, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80'),
  ('+910000000013', 1, 'https://images.unsplash.com/photo-1558898935-c5dad39f5826?w=600&q=80'),
  -- Kabir Khan (14)
  ('+910000000014', 0, 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&q=80'),
  ('+910000000014', 1, 'https://images.unsplash.com/photo-1560177112-0da328d9c66b?w=600&q=80'),
  -- Aarav Joshi (15)
  ('+910000000015', 0, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80'),
  ('+910000000015', 1, 'https://images.unsplash.com/photo-1578022476384-d9c15da14fd8?w=600&q=80'),
  -- Vihaan Patel (16)
  ('+910000000016', 0, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80'),
  ('+910000000016', 1, 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&q=80'),
  -- Rohan Singh (17)
  ('+910000000017', 0, 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=600&q=80'),
  ('+910000000017', 1, 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=600&q=80'),
  -- Aditya Nair (18)
  ('+910000000018', 0, 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=600&q=80'),
  ('+910000000018', 1, 'https://images.unsplash.com/photo-1611078489935-0cb9b6d5b6f2?w=600&q=80'),
  -- Karan Gupta (19)
  ('+910000000019', 0, 'https://images.unsplash.com/photo-1618077360395-d93ed84c1ed6?w=600&q=80'),
  ('+910000000019', 1, 'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=600&q=80'),
  -- Yash Rao (20)
  ('+910000000020', 0, 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&q=80'),
  ('+910000000020', 1, 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600&q=80')
)
INSERT INTO user_photos (user_id, url, r2_path, position)
SELECT u.id, d.url, d.url, d.pos
FROM photo_data d
JOIN users u ON u.phone = d.phone;

-- Verify
SELECT u.name, u.city, COUNT(p.id) AS photo_count
FROM users u
LEFT JOIN user_photos p ON p.user_id = u.id
WHERE u.phone LIKE '+9100000000%'
GROUP BY u.id, u.name, u.city
ORDER BY u.name;
