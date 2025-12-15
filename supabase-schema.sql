-- Bingo Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: bingo
-- Represents a bingo game configuration
CREATE TABLE bingo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    theme TEXT NOT NULL DEFAULT 'standard' CHECK (theme IN ('standard', 'christmas', 'birthday')),
    grid_size INT NOT NULL DEFAULT 5 CHECK (grid_size >= 3 AND grid_size <= 7),
    player_count INT NOT NULL DEFAULT 10 CHECK (player_count >= 1 AND player_count <= 100),
    grids_per_page INT NOT NULL DEFAULT 1 CHECK (grids_per_page IN (1, 2, 4)),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: bingo_image
-- Images belonging to a bingo
CREATE TABLE bingo_image (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bingo_id UUID NOT NULL REFERENCES bingo(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: grid_group
-- A batch of grids created together
CREATE TABLE grid_group (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bingo_id UUID NOT NULL REFERENCES bingo(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    size INT NOT NULL CHECK (size >= 3 AND size <= 7),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: grid
-- Individual bingo grid
CREATE TABLE grid (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grid_group_id UUID NOT NULL REFERENCES grid_group(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cells JSONB NOT NULL, -- Array of image UUIDs
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: draw_session
-- A drawing session for a bingo
CREATE TABLE draw_session (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bingo_id UUID NOT NULL REFERENCES bingo(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    drawn_image_ids JSONB DEFAULT '[]'::jsonb, -- Array of drawn image UUIDs
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_bingo_image_bingo_id ON bingo_image(bingo_id);
CREATE INDEX idx_grid_group_bingo_id ON grid_group(bingo_id);
CREATE INDEX idx_grid_grid_group_id ON grid(grid_group_id);
CREATE INDEX idx_draw_session_bingo_id ON draw_session(bingo_id);
CREATE INDEX idx_draw_session_is_active ON draw_session(is_active);

-- Row Level Security (RLS) - Enable for all tables
ALTER TABLE bingo ENABLE ROW LEVEL SECURITY;
ALTER TABLE bingo_image ENABLE ROW LEVEL SECURITY;
ALTER TABLE grid_group ENABLE ROW LEVEL SECURITY;
ALTER TABLE grid ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_session ENABLE ROW LEVEL SECURITY;

-- Policies - Allow anonymous access for now (public app)
CREATE POLICY "Allow public read access on bingo" ON bingo FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on bingo" ON bingo FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on bingo" ON bingo FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on bingo" ON bingo FOR DELETE USING (true);

CREATE POLICY "Allow public read access on bingo_image" ON bingo_image FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on bingo_image" ON bingo_image FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on bingo_image" ON bingo_image FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on bingo_image" ON bingo_image FOR DELETE USING (true);

CREATE POLICY "Allow public read access on grid_group" ON grid_group FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on grid_group" ON grid_group FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on grid_group" ON grid_group FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on grid_group" ON grid_group FOR DELETE USING (true);

CREATE POLICY "Allow public read access on grid" ON grid FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on grid" ON grid FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on grid" ON grid FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on grid" ON grid FOR DELETE USING (true);

CREATE POLICY "Allow public read access on draw_session" ON draw_session FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on draw_session" ON draw_session FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on draw_session" ON draw_session FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on draw_session" ON draw_session FOR DELETE USING (true);

-- Migration script for existing databases (run separately if needed)
-- ALTER TABLE bingo ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'standard';
-- ALTER TABLE bingo ADD COLUMN IF NOT EXISTS grid_size INT DEFAULT 5;
-- ALTER TABLE bingo ADD COLUMN IF NOT EXISTS player_count INT DEFAULT 10;
-- ALTER TABLE bingo ADD COLUMN IF NOT EXISTS grids_per_page INT DEFAULT 1;
