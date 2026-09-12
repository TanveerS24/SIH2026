import { z } from 'zod';

export const RoleEnum = z.enum([
  'INVESTIGATION_OFFICER',
  'WOMEN_HELP_DESK_OFFICER',
  'PROSECUTOR',
  'JUDGE',
  'NCRB_ANALYST',
]);

export type Role = z.infer<typeof RoleEnum>;

export const RoleDisplayNames: Record<Role, string> = {
  INVESTIGATION_OFFICER: 'Investigation Officer (IO)',
  WOMEN_HELP_DESK_OFFICER: 'Women Help Desk Officer (WHDO)',
  PROSECUTOR: 'Public Prosecutor',
  JUDGE: 'Honorable Magistrate / Judge',
  NCRB_ANALYST: 'NCRB Statistical Analyst',
};

export const RoleDescriptions: Record<Role, string> = {
  INVESTIGATION_OFFICER: 'Full access to assigned cases, evidence capture, OCR confirmation, and filing workflows.',
  WOMEN_HELP_DESK_OFFICER: 'Field evidence & statement capture, offline queue submission, self-submitted record review.',
  PROSECUTOR: 'Filed case scrutiny, charge-sheet workflow validation, evidence verification.',
  JUDGE: 'Read-only case judicial scrutiny, document authenticity verification, trial view.',
  NCRB_ANALYST: 'De-identified aggregate statistics, national trend dashboards; individual case access requires elevated approval.',
};
