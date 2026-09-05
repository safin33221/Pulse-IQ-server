## Database URLs in production

For Neon deployments, configure two URLs:

- `DATABASE_URL`: Neon's pooled connection string (hostname contains
  `-pooler`), used by the running application.
- `DIRECT_URL`: Neon's direct, non-pooled connection string, used by Prisma
  migrations.

On Render, use `pnpm prisma migrate deploy` as the **Pre-Deploy Command** when
available. Do not run migrations from multiple services or deployments at once.

                    User
                      │
               ┌──────┴──────┐
               │             │
          UserProfile    UserPreferences
               │
       ┌───────┼────────┐
       ↓       ↓        ↓
    Career   Skills   Interests
       │       │        │
       └───────┼────────┘
               ↓
        Recommendation
               ↑
          UserBehavior
               ↑
              News




                    ┌──────────────┐
                    │ RSS Sources  │
                    └──────┬───────┘
                           ↓
                    Collection Layer
                           ↓
                    Processing Layer
                           ↓
             ┌─────────────┼─────────────┐
             ↓             ↓             ↓
          Topics        Careers        Skills
             │             │             │
             └─────────────┼─────────────┘
                           ↓
                         NEWS
                           │
             ┌─────────────┼─────────────┐
             ↓             ↓             ↓
         PostgreSQL     pgvector       Redis
             │             │             │
             └─────────────┼─────────────┘
                           ↓
                Recommendation Engine
                           ↑
             ┌─────────────┼─────────────┐
             ↓             ↓             ↓
        User Profile    Interests     Behavior
             │             │             │
             └─────────────┼─────────────┘
                           ↓
                       FOR YOU
                           ↓
                    User Interaction
                           ↓
                    Behavior Learning
                           ↓
                  Recommendation Update
