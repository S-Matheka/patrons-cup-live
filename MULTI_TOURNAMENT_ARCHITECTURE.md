# Multi-Tournament Management Architecture

## **Current System Analysis**

### **Limitations:**
- ❌ No tournament identification in database schema
- ❌ All data mixed in single tables
- ❌ No way to separate historical tournaments
- ❌ No tournament-specific configurations

### **Required Changes:**
- ✅ Add `tournament_id` to all tables
- ✅ Create `tournaments` table for metadata
- ✅ Add tournament selection/switching UI
- ✅ Preserve historical data
- ✅ Support different tournament formats

---

## **Database Schema Changes**

### **1. New Tournaments Table**
```sql
CREATE TABLE tournaments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL, -- URL-friendly identifier
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'archived')),
  format VARCHAR(50) DEFAULT 'patrons_cup' CHECK (format IN ('patrons_cup', 'custom', 'stroke_play')),
  divisions JSONB DEFAULT '["Trophy", "Shield", "Plaque", "Bowl", "Mug"]',
  point_system JSONB, -- Custom point configurations
  settings JSONB, -- Tournament-specific settings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **2. Updated Tables with Tournament ID**

#### **Teams Table**
```sql
ALTER TABLE teams ADD COLUMN tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE;
CREATE INDEX idx_teams_tournament_id ON teams(tournament_id);
```

#### **Players Table**
```sql
ALTER TABLE players ADD COLUMN tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE;
CREATE INDEX idx_players_tournament_id ON players(tournament_id);
```

#### **Matches Table**
```sql
ALTER TABLE matches ADD COLUMN tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE;
CREATE INDEX idx_matches_tournament_id ON matches(tournament_id);
```

#### **Holes Table**
```sql
-- No direct change needed - inherits from matches
-- But add index for performance
CREATE INDEX idx_holes_tournament_id ON holes(match_id) 
INCLUDE (tournament_id) WHERE tournament_id IS NOT NULL;
```

#### **Scores Table**
```sql
ALTER TABLE scores ADD COLUMN tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE;
CREATE INDEX idx_scores_tournament_id ON scores(tournament_id);
```

---

## **Application Architecture Changes**

### **1. Tournament Context Enhancement**
```typescript
interface Tournament {
  id: number;
  name: string;
  slug: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed' | 'archived';
  format: 'patrons_cup' | 'custom' | 'stroke_play';
  divisions: string[];
  pointSystem: Record<string, any>;
  settings: Record<string, any>;
}

interface TournamentContextType {
  currentTournament: Tournament | null;
  tournaments: Tournament[];
  switchTournament: (tournamentId: number) => void;
  createTournament: (tournament: Omit<Tournament, 'id'>) => Promise<void>;
  // ... existing methods with tournament filtering
}
```

### **2. Data Loading with Tournament Filtering**
```typescript
const loadTournamentData = async (tournamentId: number) => {
  const [teamsRes, playersRes, matchesRes, scoresRes] = await Promise.all([
    supabase.from('teams').select('*').eq('tournament_id', tournamentId),
    supabase.from('players').select('*').eq('tournament_id', tournamentId),
    supabase.from('matches').select('*, holes(*)').eq('tournament_id', tournamentId),
    supabase.from('scores').select('*').eq('tournament_id', tournamentId)
  ]);
  // ... process data
};
```

### **3. Tournament Selection UI**
```typescript
// New component: TournamentSelector.tsx
const TournamentSelector = () => {
  const { tournaments, currentTournament, switchTournament } = useTournament();
  
  return (
    <div className="tournament-selector">
      <select 
        value={currentTournament?.id || ''} 
        onChange={(e) => switchTournament(Number(e.target.value))}
      >
        <option value="">Select Tournament</option>
        {tournaments.map(tournament => (
          <option key={tournament.id} value={tournament.id}>
            {tournament.name} ({tournament.status})
          </option>
        ))}
      </select>
    </div>
  );
};
```

---

## **Migration Strategy**

### **Phase 1: Database Migration**
```sql
-- 1. Create tournaments table
CREATE TABLE tournaments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  format VARCHAR(50) DEFAULT 'patrons_cup',
  divisions JSONB DEFAULT '["Trophy", "Shield", "Plaque", "Bowl", "Mug"]',
  point_system JSONB,
  settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insert current tournament
INSERT INTO tournaments (name, slug, description, start_date, end_date, status) 
VALUES (
  'Patrons Cup 2025', 
  'patrons-cup-2025', 
  'Annual Patrons Cup Tournament', 
  '2025-08-22', 
  '2025-08-24', 
  'active'
);

-- 3. Add tournament_id columns
ALTER TABLE teams ADD COLUMN tournament_id INTEGER DEFAULT 1;
ALTER TABLE players ADD COLUMN tournament_id INTEGER DEFAULT 1;
ALTER TABLE matches ADD COLUMN tournament_id INTEGER DEFAULT 1;
ALTER TABLE scores ADD COLUMN tournament_id INTEGER DEFAULT 1;

-- 4. Add foreign key constraints
ALTER TABLE teams ADD CONSTRAINT fk_teams_tournament 
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;
ALTER TABLE players ADD CONSTRAINT fk_players_tournament 
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;
ALTER TABLE matches ADD CONSTRAINT fk_matches_tournament 
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;
ALTER TABLE scores ADD CONSTRAINT fk_scores_tournament 
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;

-- 5. Create indexes
CREATE INDEX idx_teams_tournament_id ON teams(tournament_id);
CREATE INDEX idx_players_tournament_id ON players(tournament_id);
CREATE INDEX idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX idx_scores_tournament_id ON scores(tournament_id);
```

### **Phase 2: Application Updates**
1. Update all database queries to include tournament filtering
2. Add tournament selection UI
3. Update context providers
4. Add tournament management admin interface

---

## **Tournament Management Features**

### **1. Tournament Creation**
- Name, description, dates
- Division configuration
- Point system customization
- Format selection (Patrons Cup, Stroke Play, Custom)

### **2. Tournament Switching**
- Dropdown selector in navigation
- URL-based routing (`/tournament/{slug}`)
- Preserve user preferences
- Historical tournament access

### **3. Data Isolation**
- Complete separation between tournaments
- No data leakage between competitions
- Independent leaderboards and standings
- Tournament-specific configurations

### **4. Historical Data Access**
- View past tournament results
- Compare across tournaments
- Archive completed tournaments
- Export tournament data

---

## **Implementation Benefits**

### **✅ Advantages:**
- **Data Preservation**: All historical tournaments remain accessible
- **Scalability**: Support unlimited tournaments
- **Flexibility**: Different tournament formats and rules
- **Isolation**: Complete data separation
- **Performance**: Indexed queries for fast data retrieval

### **✅ User Experience:**
- **Seamless Switching**: Easy tournament selection
- **Historical Access**: View past results anytime
- **Consistent Interface**: Same UI for all tournaments
- **URL Routing**: Direct links to specific tournaments

---

## **Next Steps**

1. **Database Migration**: Apply schema changes
2. **Tournament Creation**: Add new tournament management
3. **UI Updates**: Add tournament selection interface
4. **Testing**: Verify data isolation and switching
5. **Documentation**: Update user guides

This architecture provides a robust foundation for managing multiple tournaments while preserving all historical data and maintaining the current system's functionality.
