# JSONB Field Consistency Check

## All JSONB Fields in form_submissions Table

| Field | Type | Cleaning Function | Needs JSON.stringify? | Status |
|-------|------|-------------------|----------------------|--------|
| `roster_players` | Array | `cleanRosterPlayers()` | ✅ YES | ✅ FIXED (line 171) |
| `intro_song` | Object | `cleanSongObject()` | ❌ NO | ✅ CORRECT (line 172) |
| `warmup_songs` | Object | `cleanWarmupSongs()` | ❌ NO | ✅ CORRECT (line 173) |
| `goal_horn` | Object | `cleanJsonbObject()` | ❌ NO | ✅ CORRECT (line 174) |
| `goal_song` | Object | `cleanJsonbObject()` | ❌ NO | ✅ CORRECT (line 175) |
| `win_song` | Object | `cleanJsonbObject()` | ❌ NO | ✅ CORRECT (line 176) |
| `sponsors` | Object | `cleanJsonbObject()` | ❌ NO | ✅ CORRECT (line 177) |
| `audio_files` | Array | `cleanJsonbObject()` | ✅ YES | ✅ FIXED (lines 180-183) |

## Rules

### For Objects
- Use appropriate cleaning function
- Pass directly to database (pg library handles conversion)
- **DO NOT** use `JSON.stringify()`

### For Arrays
- Use appropriate cleaning function
- **MUST** use `JSON.stringify()` before passing to database
- pg library does NOT automatically convert arrays to JSON format

## Verification

```typescript
// ✅ CORRECT - Object
cleanSongObject(input.introSong)

// ✅ CORRECT - Array
cleanRosterPlayers(input.roster?.players) ? 
  JSON.stringify(cleanRosterPlayers(input.roster?.players)) : null

// ❌ WRONG - Array without stringify
cleanRosterPlayers(input.roster?.players)

// ❌ WRONG - Object with stringify
JSON.stringify(cleanSongObject(input.introSong))
```

## Current Implementation Status

✅ All fields handled correctly
✅ Consistent approach across all JSONB fields
✅ No redundant function calls
✅ Proper null handling
