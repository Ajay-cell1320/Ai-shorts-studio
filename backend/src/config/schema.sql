-- AI Shorts Studio PostgreSQL Database Schema

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  plan VARCHAR(50) DEFAULT 'FREE',
  credits_remaining INT DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  source_url TEXT,
  duration_seconds INT,
  status VARCHAR(50) DEFAULT 'IDLE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  hook TEXT,
  start_time NUMERIC(10,2),
  end_time NUMERIC(10,2),
  duration INT,
  engagement_score INT,
  category VARCHAR(50),
  transcript_excerpt TEXT,
  status VARCHAR(50) DEFAULT 'QUEUED',
  output_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
