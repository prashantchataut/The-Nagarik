import type { CollectionConfig } from 'payload'
import { editorRoles, withRoles } from '../access/rbac'

/**
 * Journalist onboarding applications.
 *
 * Becoming a journalist is NEVER self-service: applicants submit here through
 * the public (validated, rate-limited) `/api/journalist/apply` route, and an
 * editor/admin verifies identity before a staff account is created. Approval
 * through `/api/admin/journalist-applications` creates the `users` account
 * with the `journalist` role and a one-time password handed over manually.
 */
export const JournalistApplications: CollectionConfig = {
  slug: 'journalist-applications',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'organization', 'status', 'createdAt'],
    listSearchableFields: ['name', 'email', 'organization'],
    group: 'People',
    description: 'Journalist onboarding queue. Verify identity before approving.',
  },
  access: {
    // Public submissions arrive only via the validated API route.
    read: withRoles(editorRoles),
    create: withRoles(editorRoles),
    update: withRoles(editorRoles),
    delete: withRoles(editorRoles),
  },
  fields: [
    { name: 'name', type: 'text', required: true, maxLength: 80 },
    { name: 'email', type: 'email', required: true, index: true },
    { name: 'phone', type: 'text', maxLength: 30 },
    {
      name: 'organization',
      type: 'text',
      maxLength: 120,
      admin: { description: 'Current or previous newsroom / outlet.' },
    },
    {
      name: 'portfolioUrl',
      type: 'text',
      maxLength: 300,
      admin: { description: 'Published work, portfolio, or press council listing.' },
    },
    {
      name: 'message',
      type: 'textarea',
      maxLength: 2000,
      admin: { description: 'Beats, experience, and why they want to join.' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: [
        { label: 'Pending verification', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
    {
      name: 'reviewedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar' },
    },
    {
      name: 'createdUser',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
        description: 'Staff account created on approval.',
      },
    },
    {
      name: 'locale',
      type: 'select',
      defaultValue: 'ne',
      options: [
        { label: 'नेपाली', value: 'ne' },
        { label: 'English', value: 'en' },
      ],
    },
    {
      name: 'ipHash',
      type: 'text',
      admin: { position: 'sidebar', description: 'Salted hash for abuse control.' },
    },
  ],
  timestamps: true,
}
