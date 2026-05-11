INSERT INTO cities (name) VALUES
('Москва'),
('Санкт-Петербург'),
('Казань'),
('Екатеринбург'),
('Новосибирск');

INSERT INTO districts (city_id, name)
SELECT id, 'Центральный' FROM cities WHERE name = 'Москва';

INSERT INTO districts (city_id, name)
SELECT id, 'Северный' FROM cities WHERE name = 'Москва';

INSERT INTO districts (city_id, name)
SELECT id, 'Южный' FROM cities WHERE name = 'Москва';

INSERT INTO living_rules (name) VALUES
('Можно с животными'),
('Можно с детьми'),
('Курение запрещено'),
('Вечеринки запрещены');