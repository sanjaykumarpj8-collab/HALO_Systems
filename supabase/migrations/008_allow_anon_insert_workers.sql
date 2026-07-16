-- Allow anon INSERT and DELETE on workers
CREATE POLICY "Allow public insert on workers" ON workers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete on workers" ON workers FOR DELETE USING (true);
