# Workly — Frontend Inventory (for UI redesign)

This document describes **every screen, the exact data each screen has, and the
components in use**, so a redesign mocks up *only features that already exist*.
Pair this with the screenshots and `app/globals.css`.

> **Golden rule for the redesign:** restyle and re-layout the screens below using
> the data shapes given. Do **not** introduce features that require data or
> endpoints we don't have (see [Features that do NOT exist](#features-that-do-not-exist-yet)).
> Purely-cosmetic placeholders are allowed **only if clearly labelled "future"**
> and not wired to fake data.

---

## Tech & design system

- **Next.js (App Router)**, React, TypeScript, TanStack Query.
- **shadcn/ui + Tailwind CSS v4**, theme via **oklch CSS variables** in
  `app/globals.css` (light + `.dark`). Reuse tokens: `--background`,
  `--foreground`, `--card`, `--primary`, `--accent`, `--muted`, `--border`,
  `--sidebar*`, `--radius`. Don't hardcode hex.
- **Per-organization accent color**: `lib/org-theme.tsx` defines 20 named colors
  (slate, blue, violet, emerald, rose, …). Org settings let a user pick the
  org's primary/accent. The redesign must keep working under any of these.
- Fonts: Inter (sans), JetBrains Mono (mono).
- **Existing UI primitives to reuse** (in `components/ui/`): button, card,
  dialog, sheet, table, tabs, badge, avatar, input, textarea, select, checkbox,
  label, dropdown-menu, popover, tooltip, breadcrumb, separator, skeleton,
  sidebar, alert-dialog, sonner (toasts).
- **App-shell components**: `app-sidebar`, `app-topbar` (with breadcrumbs),
  `kanban-board`, `issue-detail-modal`, `issue-comments`,
  `notifications-modal`, `accept-invite-modal`, `empty-states`, `skeletons`,
  `theme-toggle` (light/dark).

---

## App shell (wraps every `/app/*` screen)

- **Left sidebar** (`app-sidebar`): Dashboard · Organizations · My Invites ·
  (per-org) Projects · Members · Invites · Settings · Theme · Docs. Collapses on
  mobile (`use-mobile`).
- **Topbar** (`app-topbar`): breadcrumbs, notifications bell (opens
  `notifications-modal`), light/dark toggle, user/profile access.
- Loading states use `skeletons`; empty states use `empty-states`.

---

## Screens (the complete list — nothing beyond this)

### Public / marketing
| Route | Screen | Notes |
|---|---|---|
| `/` | Landing | Sections: hero, features, stats, board-preview, CTA, footer, navbar |
| `/login` | Login | email + password |
| `/register` | Register | name, email, password, **organization name** (creates first org) |

### Invitations
| Route | Screen | Data |
|---|---|---|
| `/app/invites` | My invites | list of `MyInvite` |
| `/invite/[token]` | Accept invite (public link) | `InviteDetailsResponse`: orgName, inviterName, email, role |

### Organizations
| Route | Screen | Data |
|---|---|---|
| `/app/orgs` | Org list / switcher | `OrganizationResponse[]` |
| `/app/orgs/[orgId]` | Org dashboard | org + projects summary |
| `/app/orgs/[orgId]/members` | Members | `OrgMemberResponse[]`; add/remove/role (role-gated) |
| `/app/orgs/[orgId]/invites` | Sent invites | `InviteResponse[]`; create / revoke |
| `/app/orgs/[orgId]/settings` | Settings | rename org; **pick org theme color** |

### Projects
| Route | Screen | Data |
|---|---|---|
| `/app/orgs/[orgId]/projects` | Project list | `ProjectResponse[]` |
| `/app/orgs/[orgId]/projects/[projectId]` | Project overview | project + members |
| `…/board` | **Kanban board** | columns + issues, drag to reorder/move |
| `…/issues` | Issue list (table) | `IssueResponse[]` |
| `…/issues/[issueId]` | Issue detail | single issue + comments |

### Account
| Route | Screen | Data |
|---|---|---|
| `/app/profile` | Profile | current user (name, email, member-since) + pending invitations (`MyInvite[]`) |

---

## Data shapes (this is the hard boundary of the redesign)

Mock UI **only** for these fields. No field shown that isn't here.

**User**: `id, name, email, createdAt`

**Organization**: `id, name, slug, createdAt`

**OrgMember**: `id, userId, userName, userEmail, role, createdAt`
- `role`: `OWNER | ADMIN | MEMBER`

**ProjectMember**: same as OrgMember; `role`: `ADMIN | MEMBER`

**Invite (sent)**: `id, orgId, invitedEmail, invitedRole, status, token, expiresAt, createdAt`
- `status`: `PENDING | ACCEPTED | DECLINED | REVOKED | EXPIRED`

**MyInvite (received)**: `id, orgId, orgName, invitedRole, status, expiresAt, createdAt, token, acceptUrl`

**Project**: `id, orgId, name, slug, createdAt, updatedAt`

**Board**: `id, projectId` → has **Columns** → each column has **Issues**

**Column**: `id, boardId, name, orderIndex`

**Issue**: `id, title, description (nullable), priority, status, columnId, projectId, reporterId, assigneeId (nullable), orderIndex, createdAt, updatedAt`
- `priority`: `HIGHEST | HIGH | MEDIUM | LOW | LOWEST`
- `status`: `TO_DO | IN_PROGRESS | IN_REVIEW | DONE`

**IssueComment**: `id, issueId, authorId, authorName, body, createdAt` (flat list — no threading, no reactions)

**Notification**: `id, type, message, read, readAt, createdAt`, paginated
(`content, totalElements, totalPages, size, number`)

---

## Key interactions (must survive the redesign)

- **Kanban board**: drag issues between columns and reorder within a column.
  Move is expressed as `{ columnId, status?, beforeIssueId?, afterIssueId? }`.
  Status maps to columns; priority shown as a colored badge.
- **Issue detail modal / page**: edit `title`, `description`, `priority`,
  `status`, `assignee`; view + add + delete comments. (These are the *only*
  editable fields.)
- **Members**: invite by email + role; revoke; remove member; change role —
  these controls are **gated by role** (OWNER/ADMIN). Mock the full-permission
  view, but know lower roles see fewer actions.
- **Notifications**: bell with unread count; modal with paginated list; mark
  one / mark all read.
- **Theme**: global light/dark toggle **and** per-org accent color.

---

## Features that do NOT exist yet

Do **not** design functional UI for these (no data/endpoints back them). They
may appear only as clearly-labelled "future" cosmetic placeholders, never wired:

- Labels / tags on issues
- Sprints, epics, story points, estimates
- Due dates / start dates / timelines / Gantt
- Attachments / file uploads
- Issue search, filtering by anything beyond column/status, saved views
- Activity feed / audit log
- Dashboards with real charts/metrics (the `--chart-*` tokens exist but no chart
  data is provided)
- @mentions, comment threading, reactions, rich-text/markdown in comments
- Time tracking, worklogs
- Custom fields, custom issue types, workflows beyond the 4 statuses
- Multiple boards per project (one board per project today)

---

## What to attach when sending to Claude

1. This file (`FRONTEND_INVENTORY.md`)
2. Your screenshots
3. `app/globals.css` (the design tokens)
4. Optionally `lib/org-theme.tsx` (the 20 org accent colors)
