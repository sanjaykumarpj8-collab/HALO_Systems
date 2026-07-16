DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can see all incidents" ON incidents;
DROP POLICY IF EXISTS "Staff can see assigned incidents" ON incidents;
DROP POLICY IF EXISTS "Staff can update assigned incidents" ON incidents;
DROP POLICY IF EXISTS "Fans can create incidents" ON incidents;

-- Also let's just make users public for this prototype
CREATE POLICY "Allow public select on users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public update on users" ON users FOR UPDATE USING (true);
CREATE POLICY "Allow public insert on users" ON users FOR INSERT WITH CHECK (true);
