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