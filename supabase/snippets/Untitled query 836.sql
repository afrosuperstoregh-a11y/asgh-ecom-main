CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (INSERT INTO categories (name, slug, description, sort_order) VALUES 
('Clothing', 'clothing', 'Afrocentric clothing and apparel', 1),
('Accessories', 'accessories', 'Fashion accessories and jewelry', 2),
('Home & Living', 'home-living', 'Home decor and lifestyle products', 3),
('Art & Crafts', 'art-crafts', 'Traditional and contemporary art pieces', 4)
ON CONFLICT (slug) DO NOTHING;
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
);
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admina')
    )INSERT INTO categories (name, slug, description, sort_order) VALUES 
('Clothing', 'clothing', 'Afrocentric clothing and apparel', 1),
('Accessories', 'accessories', 'Fashion accessories and jewelry', 2),
('Home & Living', 'home-living', 'Home decor and lifestyle products', 3),
('Art & Crafts', 'art-crafts', 'Traditional and contemporary art pieces', 4)
ON CONFLICT (slug) DO NOTHING;
);

