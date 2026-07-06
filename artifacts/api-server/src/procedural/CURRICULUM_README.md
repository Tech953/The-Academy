# Curriculum System - Triple Theme Support

The Academy features three complete curriculum systems that can be easily switched:

## 📝 GED Curriculum (Currently Active)

**File:** `courseGenerator.ts`

Features 24 courses across the 4 GED test areas:
- **Mathematical Reasoning** (6 courses: Basic Math → Algebra → Geometry → Statistics → Test Prep)
- **Language Arts** (6 courses: Reading → Grammar → Essay Writing → Literature → Test Prep)
- **Science** (6 courses: Life Science → Physical Science → Earth Science → Health → Test Prep)
- **Social Studies** (6 courses: U.S. History → World History → Civics → Economics → Geography → Test Prep)

**Total:** 24 courses, 168 assignments, 5 pathways (1 GED Diploma + 4 Test Area Certificates)

Perfect for a high school equivalency preparation academy focused on helping students pass the GED exam.

## 🎓 Collegiate Curriculum (Saved for Sequel)

**File:** `collegiatecurriculum.ts`

Features 144 courses across 12 real-world departments:
- **STEM:** Mathematics, Natural Sciences, Computer Science
- **Humanities:** History, Literature, Philosophy, Language Studies  
- **Social Sciences:** Psychology, Economics, Political Science
- **Fine Arts:** Art, Music

**Total:** 144 courses, 1,008 assignments, 24 pathways (12 majors + 12 minors)

Perfect for players who want a traditional college experience with realistic academic content.

## ⚔️ Fantasy Curriculum (Saved for Spin-off)

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

**Total:** 96 courses, 672 assignments, 16 pathways (8 majors + 8 minors)

Perfect for a fantasy/magical academy setting.

---

## How to Switch Curricula

### Option 1: Simple File Replacement (Recommended)

To switch curriculum themes, simply replace the imports in `server/procedural/generators.ts`:

**For GED (current):**
```typescript
import { generateCourseCatalog, generateGraduationPathways, generateCourseAssignments } from './courseGenerator';
```

**For Collegiate:**
```typescript
import { generateCourseCatalog, generateGraduationPathways, generateCourseAssignments } from './collegiatecurriculum';
```

**For Fantasy:**
```typescript
import { generateFantasyCourses as generateCourseCatalog, generateFantasyPathways as generateGraduationPathways } from './fantasycurriculum';
// Note: You'll need to add generateCourseAssignments to fantasycurriculum.ts
```

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

| Feature | GED (Active) | Collegiate | Fantasy |
|---------|--------------|------------|---------|
| Total Courses | 24 | 144 | 96 |
| Test Areas/Departments | 4 | 12 | 8 |
| Pathways | 5 (1+4) | 24 (12+12) | 16 (8+8) |
| Total Assignments | 168 | 1,008 | 672 |
| Theme | High school equivalency | College/University | Mystical academy |
| Course Names | Basic Math Skills, Reading Comprehension | Calculus I, Biology | Ritual Magic, Combat Arts |
| Target Audience | GED test prep | Traditional college | Fantasy RPG |
| Difficulty Level | High school | Undergraduate | Fantasy themed |

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
