# Database — Module 02

MySQL via SQLAlchemy (PyMySQL) + Alembic.

## Configuration
Centralized in `backend/app/core/config.py` (`DATABASE_URL` from `MYSQL_HOST/PORT/DATABASE/USER/PASSWORD`) and `backend/app/core/database.py` (`engine`, `SessionLocal`, `Base`, `get_db()`).

## Models (Module 02)
- `users` — `User` (`app/models/user.py`) — id UUID(36), email unique 191, name, password_hash, timestamps, InnoDB
- `contents` — `Content` (`app/models/content.py`) — id, user_id FK CASCADE, title 255, original_content TEXT, status enum(draft/processing/completed/failed), deleted_at soft delete, indexes on (user_id,created_at) etc
- `tags` — `Tag` (`app/models/tag.py`) — id, user_id FK, name 64, unique(user_id,name), index
- `content_tags` — `ContentTag` (`app/models/content_tag.py`) — composite PK (content_id,tag_id) M:N
- `generated_outputs` — `GeneratedOutput` (`app/models/generated_output.py`) — id, content_id FK, output_type enum 8 values, raw_ai_content TEXT, edited_content TEXT, model/latency/tokens, unique(content_id,output_type)

All tables `ENGINE=InnoDB CHARSET=utf8mb4`.

## Initialization
```bash
cd backend
python init_db.py          # Base.metadata.create_all — Module 02 quick init
# or via Alembic for future migrations:
alembic revision --autogenerate -m "add field"
alembic upgrade head
```

Existing MySQL `content_intelligence` database — tables recreated Module 02 (was MyISAM, now InnoDB). `Base.metadata.create_all` verified; FK enforcement tested (invalid content_id fails).

## Business Rules Enforced
- Original vs generated separation (separate tables)
- Unique tag per user
- One output per type per content
- FK CASCADE, ownership via user_id
