import bcrypt from 'bcryptjs'

export function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nickname TEXT,
      email TEXT,
      avatar TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)

  const articleCols = db.prepare('PRAGMA table_info(articles)').all().map((c) => c.name)
  const articleAdditions = [
    ['status', "TEXT NOT NULL DEFAULT 'published'"],
    ['author_name', 'TEXT'],
    ['author_contact', 'TEXT'],
    ['submitted_at', 'TEXT'],
    ['reviewed_at', 'TEXT'],
    ['review_note', 'TEXT'],
    ['author_id', 'INTEGER REFERENCES users(id)'],
    ['category_id', 'INTEGER REFERENCES categories(id)'],
    ['updated_at', 'TEXT'],
    ['deleted_at', 'TEXT'],
  ]
  for (const [name, ddl] of articleAdditions) {
    if (!articleCols.includes(name)) {
      db.exec(`ALTER TABLE articles ADD COLUMN ${name} ${ddl}`)
    }
  }

  const tagCols = db.prepare('PRAGMA table_info(tags)').all().map((c) => c.name)
  const tagAdditions = [
    ['slug', 'TEXT'],
    ['description', 'TEXT'],
    ['created_at', 'TEXT'],
    ['updated_at', 'TEXT'],
  ]
  for (const [name, ddl] of tagAdditions) {
    if (!tagCols.includes(name)) {
      db.exec(`ALTER TABLE tags ADD COLUMN ${name} ${ddl}`)
    }
  }

  db.prepare("UPDATE articles SET status = 'published' WHERE status IS NULL OR status = ''").run()

  syncCategoriesFromArticles(db)
  syncTagMetadata(db)
  seedAdminUser(db)
}

function syncCategoriesFromArticles(db) {
  const rows = db.prepare("SELECT DISTINCT category FROM articles WHERE category IS NOT NULL AND category != ''").all()
  const now = new Date().toISOString()
  const insert = db.prepare(
    `INSERT OR IGNORE INTO categories (name, slug, created_at, updated_at) VALUES (@name, @slug, @now, @now)`,
  )
  const getId = db.prepare('SELECT id FROM categories WHERE name = ?')

  for (const { category } of rows) {
    const slug = slugify(category)
    insert.run({ name: category, slug, now })
    const cat = getId.get(category)
    db.prepare('UPDATE articles SET category_id = ? WHERE category = ? AND (category_id IS NULL)').run(
      cat.id,
      category,
    )
  }
}

function syncTagMetadata(db) {
  const now = new Date().toISOString()
  const tags = db.prepare('SELECT id, name, slug FROM tags').all()
  for (const tag of tags) {
    const slug = tag.slug || slugify(tag.name)
    db.prepare('UPDATE tags SET slug = ?, created_at = COALESCE(created_at, ?), updated_at = ? WHERE id = ?').run(
      slug,
      now,
      now,
      tag.id,
    )
  }
}

function seedAdminUser(db) {
  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin')
  if (exists) return

  const password = process.env.ADMIN_PASSWORD || 'admin123'
  const hash = bcrypt.hashSync(password, 10)
  const now = new Date().toISOString()

  db.prepare(
    `INSERT INTO users (username, password_hash, nickname, email, created_at, updated_at)
     VALUES ('admin', ?, '管理员', 'admin@faar.local', ?, ?)`,
  ).run(hash, now, now)

  console.log('[auth] 已创建默认管理员 admin /', password)
}

function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fff-]/g, '')
    || 'item'
}
