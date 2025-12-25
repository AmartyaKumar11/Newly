/**
 * Live Editing Mutations
 * 
 * Phase 4.1: Live Editing
 * 
 * Defines mutation types for real-time collaborative editing.
 * 
 * Each mutation represents a single atomic editor action.
 */

import type { Block, Position, Size, BlockStyles } from "./blocks";

/**
 * Mutation operation types
 */
export type MutationType =
  | "move_block"
  | "resize_block"
  | "update_block"
  | "add_block"
  | "delete_block"
  | "update_block_styles"
  | "undo"
  | "redo";

/**
 * Base mutation structure
 * 
 * Every mutation must have:
 * - mutationId: Unique identifier
 * - userId: User who created the mutation
 * - timestamp: When mutation was created (client-side)
 * - baseVersion: Document version this mutation is based on
 * - type: Operation type
 */
export interface BaseMutation {
  mutationId: string;
  userId: string | null; // null for anonymous users
  timestamp: number; // Client-side timestamp (milliseconds)
  baseVersion: number; // Document version this mutation expects
  type: MutationType;
  newsletterId: string;
}

/**
 * Move block mutation
 */
export interface MoveBlockMutation extends BaseMutation {
  type: "move_block";
  blockId: string;
  position: Position;
}

/**
 * Resize block mutation
 */
export interface ResizeBlockMutation extends BaseMutation {
  type: "resize_block";
  blockId: string;
  size: Size;
}

/**
 * Update block mutation (generic property updates)
 */
export interface UpdateBlockMutation extends BaseMutation {
  type: "update_block";
  blockId: string;
  updates: Partial<Block>;
}

/**
 * Add block mutation
 */
export interface AddBlockMutation extends BaseMutation {
  type: "add_block";
  block: Block;
}

/**
 * Delete block mutation
 */
export interface DeleteBlockMutation extends BaseMutation {
  type: "delete_block";
  blockId: string;
}

/**
 * Update block styles mutation
 */
export interface UpdateBlockStylesMutation extends BaseMutation {
  type: "update_block_styles";
  blockId: string;
  styles: Partial<BlockStyles>;
}

/**
 * Undo mutation (inverse of previous user mutation)
 */
export interface UndoMutation extends BaseMutation {
  type: "undo";
  targetMutationId: string; // The mutation being undone
  inverseMutation: Mutation; // The inverse mutation to apply
}

/**
 * Redo mutation
 */
export interface RedoMutation extends BaseMutation {
  type: "redo";
  targetMutationId: string; // The mutation being redone
  redoMutation: Mutation; // The mutation to reapply
}

/**
 * Union type of all mutations
 */
export type Mutation =
  | MoveBlockMutation
  | ResizeBlockMutation
  | UpdateBlockMutation
  | AddBlockMutation
  | DeleteBlockMutation
  | UpdateBlockStylesMutation
  | UndoMutation
  | RedoMutation;

/**
 * Mutation acknowledgement from server
 */
export interface MutationAck {
  mutationId: string;
  accepted: boolean;
  appliedVersion: number; // New document version after applying
  reason?: string; // Rejection reason if accepted=false
}

/**
 * Mutation broadcast from server
 */
export interface MutationBroadcast {
  mutation: Mutation;
  appliedVersion: number;
  appliedBy: string; // userId who created the mutation
}

/**
 * Document version tracking
 */
export interface DocumentVersion {
  newsletterId: string;
  version: number; // Incrementing version number
  lastMutationId: string | null;
  lastMutationTimestamp: number;
}

/**
 * Generate unique mutation ID
 */
export function generateMutationId(): string {
  return `mut_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Check if mutation is from current user
 */
export function isOwnMutation(mutation: Mutation, userId: string | null): boolean {
  return mutation.userId === userId;
}
