-- 先删除已有的对象，再重新创建
DROP TRIGGER IF EXISTS todos_updated_at ON todos;
DROP FUNCTION IF EXISTS update_updated_at();
DROP TABLE IF EXISTS todos;
DROP TABLE IF EXISTS boards;

-- 1. boards 表
CREATE TABLE boards (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL DEFAULT '待办看板',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. todos 表
CREATE TABLE todos (
  id              BIGINT PRIMARY KEY,
  board_id        UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  text            TEXT NOT NULL,
  done            BOOLEAN NOT NULL DEFAULT false,
  priority        TEXT NOT NULL DEFAULT 'P1'
                  CHECK (priority IN ('P0', 'P1', 'P2')),
  category        TEXT NOT NULL DEFAULT 'work'
                  CHECK (category IN ('work', 'life')),
  date            TEXT NOT NULL,
  end_date        TEXT,
  progress        INTEGER NOT NULL DEFAULT 0
                  CHECK (progress >= 0 AND progress <= 100),
  daily_progress  JSONB NOT NULL DEFAULT '{}'::jsonb,
  recurrence      TEXT NOT NULL DEFAULT 'none'
                  CHECK (recurrence IN ('none', 'weekly')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_todos_board_id ON todos(board_id);
CREATE INDEX idx_todos_board_date ON todos(board_id, date);

-- 3. updated_at 自动更新触发器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4. RLS 策略（匿名可读写）
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "boards_insert" ON boards FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "boards_select" ON boards FOR SELECT TO anon USING (true);
CREATE POLICY "todos_select" ON todos FOR SELECT TO anon USING (true);
CREATE POLICY "todos_insert" ON todos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "todos_update" ON todos FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "todos_delete" ON todos FOR DELETE TO anon USING (true);

-- 5. 开启 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE todos;
