export type BrainFileKind = 'markdown' | 'file';

export interface BrainFolder {
  id: string;
  name: string;
  parentId: string | null;
}

export interface BrainDocument {
  id: string;
  folderId: string | null;
  title: string;
  fileName: string;
  kind: BrainFileKind;
  content: string;
  updatedAt: string;
}

export type BrainDialog =
  | { kind: 'folder'; mode: 'create'; parentId: string | null; title: string }
  | { kind: 'folder'; mode: 'rename'; folderId: string; title: string }
  | { kind: 'document'; documentId: string; title: string }
  | { kind: 'confirm-folder'; folderId: string; title: string; hasContents: boolean }
  | { kind: 'confirm-document'; documentId: string; title: string }
  | null;
