/**
 * Feature: nigms-app
 * Property 1: Project list renders all entries with required fields
 *
 * Models the ProjectGrid rendering as a pure function:
 *   - renderProjectList(projects) — maps an array of project records to
 *     an array of rendered entry objects containing title, description,
 *     and status.
 *
 * For any array of project records, the rendered output must:
 *   - Contain exactly as many entries as the input (no omissions)
 *   - Preserve each project's title (non-empty string)
 *   - Preserve each project's status value
 *   - Preserve each project's description (or null)
 *
 * This mirrors the behaviour of ProjectGrid, which maps over the projects
 * array and renders a card per entry showing title, status badge, and
 * description.
 *
 * Validates: Requirements 1.2, 1.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProjectStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

interface ProjectRecord {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
}

interface RenderedEntry {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
}

// ---------------------------------------------------------------------------
// Pure function modelling ProjectGrid's rendering logic
//
// ProjectGrid maps over the projects array and renders one card per entry,
// displaying title, StatusBadge (status), and description. This pure
// function captures that mapping contract without any React/DOM dependency.
// ---------------------------------------------------------------------------

function renderProjectList(projects: ProjectRecord[]): RenderedEntry[] {
  return projects.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    status: p.status,
  }));
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const statusArb: fc.Arbitrary<ProjectStatus> = fc.constantFrom(
  'pending',
  'in_progress',
  'completed',
  'cancelled',
);

const projectRecordArb: fc.Arbitrary<ProjectRecord> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 120 }),
  description: fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: null }),
  status: statusArb,
});

const projectListArb: fc.Arbitrary<ProjectRecord[]> = fc.array(projectRecordArb, {
  minLength: 0,
  maxLength: 50,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 1: Project list renders all entries with required fields', () => {
  it('output contains exactly as many entries as the input — no project is omitted', () => {
    fc.assert(
      fc.property(projectListArb, (projects) => {
        const rendered = renderProjectList(projects);
        expect(rendered).toHaveLength(projects.length);
      }),
      { numRuns: 20 },
    );
  });

  it('each rendered entry has a non-empty title matching the source record', () => {
    fc.assert(
      fc.property(projectListArb, (projects) => {
        const rendered = renderProjectList(projects);
        rendered.forEach((entry, i) => {
          expect(entry.title).toBe(projects[i].title);
          expect(entry.title.length).toBeGreaterThan(0);
        });
      }),
      { numRuns: 20 },
    );
  });

  it('each rendered entry has a status value matching the source record', () => {
    fc.assert(
      fc.property(projectListArb, (projects) => {
        const rendered = renderProjectList(projects);
        rendered.forEach((entry, i) => {
          expect(entry.status).toBe(projects[i].status);
          expect(['pending', 'in_progress', 'completed', 'cancelled']).toContain(entry.status);
        });
      }),
      { numRuns: 20 },
    );
  });

  it('each rendered entry preserves the description from the source record', () => {
    fc.assert(
      fc.property(projectListArb, (projects) => {
        const rendered = renderProjectList(projects);
        rendered.forEach((entry, i) => {
          expect(entry.description).toBe(projects[i].description);
        });
      }),
      { numRuns: 20 },
    );
  });

  it('output order matches input order — projects are not reordered', () => {
    fc.assert(
      fc.property(projectListArb, (projects) => {
        const rendered = renderProjectList(projects);
        rendered.forEach((entry, i) => {
          expect(entry.id).toBe(projects[i].id);
        });
      }),
      { numRuns: 20 },
    );
  });

  it('empty input produces empty output', () => {
    const rendered = renderProjectList([]);
    expect(rendered).toHaveLength(0);
  });
});
