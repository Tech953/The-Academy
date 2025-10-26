# Curriculum System - Dual Theme Support

The Academy features two complete curriculum systems that can be easily switched:

## 🎓 Realistic Curriculum (Currently Active)

**File:** `courseGenerator.ts`

Features 144 courses across 12 real-world departments:
- **STEM:** Mathematics, Natural Sciences, Computer Science
- **Humanities:** History, Literature, Philosophy, Language Studies  
- **Social Sciences:** Psychology, Economics, Political Science
- **Fine Arts:** Art, Music

Perfect for players who want a traditional college experience with realistic academic content.

## ⚔️ Fantasy Curriculum (Preserved for Spin-off)

**File:** `fantasycurriculum.ts`

Features 96 courses across 8 mystical departments:
- Mysticism (energy manipulation, divination, ritual magic)
- Combat Arts (martial techniques, weapons mastery)
- Arcane Sciences (magical physics, elemental control)
- Diplomacy (negotiation, political systems)
- History (ancient civilizations, magical eras)
- Philosophy (ethics, metaphysics)
- Investigation (detective work, forensic magic)
- Leadership (organizational management, strategy)

Perfect for a fantasy/magical academy setting.

---

## How to Switch Curricula

### Option 1: Simple Flag Toggle (Recommended)

1. Open `server/procedural/generators.ts`
2. At the top, import the fantasy curriculum:
   ```typescript
   import { generateFantasyCourses, generateFantasyPathways, USE_FANTASY_CURRICULUM } from './fantasycurriculum';
   ```
3. In the `initializeCurriculum()` function, add a conditional:
   ```typescript
   export function initializeCurriculum() {
     const courses = USE_FANTASY_CURRICULUM 
       ? generateFantasyCourses() 
       : generateCourses();
     
     const pathways = USE_FANTASY_CURRICULUM
       ? generateFantasyPathways()
       : generateGraduationPathways();
     
     // ... rest of initialization
   }
   ```
4. Toggle `USE_FANTASY_CURRICULUM` in `fantasycurriculum.ts` to switch themes

### Option 2: Environment Variable

Add support for an environment variable to switch themes:

```typescript
const CURRICULUM_THEME = process.env.CURRICULUM_THEME || 'realistic';

export function initializeCurriculum() {
  const courses = CURRICULUM_THEME === 'fantasy'
    ? generateFantasyCourses()
    : generateCourses();
    
  // ... etc
}
```

Then set `CURRICULUM_THEME=fantasy` in your environment to use the fantasy version.

### Option 3: Separate Builds

Create two separate game configurations:
- **The Academy** - Realistic curriculum (current)
- **The Academy: Arcane Edition** - Fantasy curriculum (spin-off)

Each can maintain its own world generation seed and configuration.

---

## Content Comparison

| Feature | Realistic | Fantasy |
|---------|-----------|---------|
| Total Courses | 144 | 96 |
| Departments | 12 | 8 |
| Majors/Minors | 24 (12+12) | 16 (8+8) |
| Theme | Modern academia | Mystical academy |
| Course Names | Calculus I, Biology | Ritual Magic, Combat Arts |
| Professors | Regular faculty | Mystical masters |

---

## Extending the Systems

Both systems share the same underlying architecture, so you can:

1. **Add new departments** to either system
2. **Mix and match** - create hybrid curricula
3. **Create seasonal themes** - Halloween edition with spooky courses
4. **Add difficulty modes** - Easier fantasy courses for casual play
5. **Create crossover courses** - "Math of Mysticism" combining both themes

---

## Notes

- Both systems generate proper syllabi, assignments, and graduation pathways
- All course data is fully compatible with the enrollment/grading system
- Fantasy curriculum maintains the same 7-assignment structure per course
- Prerequisites work the same way in both systems
- Can switch themes without database migration (just regenerate courses)

---

## Future Ideas

- **Sci-Fi Academy**: Computer programming, robotics, space exploration
- **Arts Conservatory**: Music, theater, visual arts, dance
- **Military Academy**: Strategy, weapons training, leadership
- **Medical School**: Anatomy, surgery, patient care
- **Detective Academy**: Investigation, forensics, criminal psychology (already in fantasy!)

The modular curriculum system makes any academic theme possible! 🎓
