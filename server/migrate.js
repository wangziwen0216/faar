export function migrate(db) {
  const cols = db.prepare('PRAGMA table_info(articles)').all().map((c) => c.name)

  const additions = [
    ['status', "TEXT NOT NULL DEFAULT 'published'"],
    ['author_name', 'TEXT'],
    ['author_contact', 'TEXT'],
    ['submitted_at', 'TEXT'],
    ['reviewed_at', 'TEXT'],
    ['review_note', 'TEXT'],
  ]

  for (const [name, ddl] of additions) {
    if (!cols.includes(name)) {
      db.exec(`ALTER TABLE articles ADD COLUMN ${name} ${ddl}`)
    }
  }

  db.prepare("UPDATE articles SET status = 'published' WHERE status IS NULL OR status = ''").run()
}
