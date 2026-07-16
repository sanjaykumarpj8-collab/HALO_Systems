-- Allow anonymous access for the prototype

CREATE POLICY "Allow public select on incidents" ON incidents FOR SELECT USING (true);
CREATE POLICY "Allow public update on incidents" ON incidents FOR UPDATE USING (true);
CREATE POLICY "Allow public insert on incidents" ON incidents FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select on workers" ON workers FOR SELECT USING (true);
CREATE POLICY "Allow public update on workers" ON workers FOR UPDATE USING (true);

CREATE POLICY "Allow public select on sections" ON sections FOR SELECT USING (true);
CREATE POLICY "Allow public update on sections" ON sections FOR UPDATE USING (true);

CREATE POLICY "Allow public select on salary" ON salary FOR SELECT USING (true);
CREATE POLICY "Allow public update on salary" ON salary FOR UPDATE USING (true);
