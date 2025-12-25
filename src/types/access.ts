/**
 * Access Role Definitions
 * 
 * Defines access roles for newsletter sharing and collaboration.
 * 
 * This is a shared type definition used by both backend and frontend.
 * No editor, AI, or UI logic should be imported here.
 * 
 * Roles (v1):
 * - owner: Newsletter creator, full control
 * - viewer: Read-only access via share link
 * - editor: Write access via share link (defined but not behaviorally enabled in v1)
 */

export type AccessRole = "owner" | "viewer" | "editor";

/**
 * Check if a role has write permissions.
 * 
 * @param role - Access role to check
 * @returns true if role can modify newsletter content
 */
export function canEdit(role: AccessRole): boolean {
  return role === "owner" || role === "editor";
}

/**
 * Check if a role has read permissions.
 * 
 * @param role - Access role to check
 * @returns true if role can view newsletter content
 */
export function canView(role: AccessRole): boolean {
  return role === "owner" || role === "editor" || role === "viewer";
}
