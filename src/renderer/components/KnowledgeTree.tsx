import { useMemo, useRef, useState } from 'react';
import type { BrainDocument, BrainFolder } from '../enterpriseBrainTypes';
import { KnowledgeTreeItem } from './KnowledgeTreeItem';

interface KnowledgeTreeProps {
  folders: BrainFolder[];
  documents: BrainDocument[];
  selectedFolderId: string | null;
  expandedFolderIds: Set<string>;
  onSelectFolder: (folderId: string | null) => void;
  onToggleFolder: (folderId: string) => void;
  onNewFolder: (parentId: string | null) => void;
  onNewDocument: (folderId: string | null) => void;
  onUpload: (folderId: string | null, file: File) => void;
  onRenameFolder: (folderId: string) => void;
  onDuplicateFolder: (folderId: string) => void;
  onDeleteFolder: (folderId: string) => void;
}

function folderHasMatch(
  folderId: string,
  term: string,
  foldersByParent: Map<string | null, BrainFolder[]>,
): boolean {
  const folder =
    foldersByParent.get(null)?.find((item) => item.id === folderId) ??
    Array.from(foldersByParent.values())
      .flat()
      .find((item) => item.id === folderId);

  if (folder?.name.toLocaleLowerCase().includes(term)) {
    return true;
  }

  return (foldersByParent.get(folderId) ?? []).some((child) =>
    folderHasMatch(child.id, term, foldersByParent),
  );
}

export function KnowledgeTree({
  folders,
  documents,
  selectedFolderId,
  expandedFolderIds,
  onSelectFolder,
  onToggleFolder,
  onNewFolder,
  onNewDocument,
  onUpload,
  onRenameFolder,
  onDuplicateFolder,
  onDeleteFolder,
}: KnowledgeTreeProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [openCreateMenuId, setOpenCreateMenuId] = useState<string | null>(null);
  const [openMoreMenuId, setOpenMoreMenuId] = useState<string | null>(null);
  const [isRootMenuOpen, setIsRootMenuOpen] = useState(false);
  const [pendingUploadFolderId, setPendingUploadFolderId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase();

  const foldersByParent = useMemo(() => {
    const grouped = new Map<string | null, BrainFolder[]>();
    folders.forEach((folder) => {
      const siblings = grouped.get(folder.parentId) ?? [];
      siblings.push(folder);
      grouped.set(folder.parentId, siblings);
    });
    return grouped;
  }, [folders]);

  const visibleFolders = useMemo(() => {
    if (!normalizedSearchTerm) {
      return new Set(folders.map((folder) => folder.id));
    }

    return new Set(
      folders
        .filter((folder) => folderHasMatch(folder.id, normalizedSearchTerm, foldersByParent))
        .map((folder) => folder.id),
    );
  }, [folders, foldersByParent, normalizedSearchTerm]);

  const getFolderLevel = (folder: BrainFolder) => {
    let level = 1;
    let parentId = folder.parentId;
    while (parentId) {
      level += 1;
      parentId = folders.find((item) => item.id === parentId)?.parentId ?? null;
    }
    return level;
  };

  const startUpload = (folderId: string | null) => {
    setOpenCreateMenuId(null);
    setIsRootMenuOpen(false);
    setPendingUploadFolderId(folderId);
    window.setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const handleFileChange = (file: File | undefined) => {
    if (file && pendingUploadFolderId !== undefined) {
      onUpload(pendingUploadFolderId, file);
    }
    setPendingUploadFolderId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderFolders = (parentId: string | null) =>
    (foldersByParent.get(parentId) ?? [])
      .filter((folder) => visibleFolders.has(folder.id))
      .map((folder) => {
        const childFolders = foldersByParent.get(folder.id) ?? [];
        const isExpanded = normalizedSearchTerm ? true : expandedFolderIds.has(folder.id);
        const level = getFolderLevel(folder);
        return (
          <KnowledgeTreeItem
            key={folder.id}
            folder={folder}
            level={level}
            isExpanded={isExpanded}
            isSelected={selectedFolderId === folder.id}
            isCreateMenuOpen={openCreateMenuId === folder.id}
            isMoreMenuOpen={openMoreMenuId === folder.id}
            hasChildren={childFolders.some((child) => visibleFolders.has(child.id))}
            documentCount={documents.filter((document) => document.folderId === folder.id).length}
            onSelect={() => onSelectFolder(folder.id)}
            onToggle={() => onToggleFolder(folder.id)}
            onToggleCreateMenu={() => {
              setOpenMoreMenuId(null);
              setOpenCreateMenuId((current) => (current === folder.id ? null : folder.id));
            }}
            onToggleMoreMenu={() => {
              setOpenCreateMenuId(null);
              setOpenMoreMenuId((current) => (current === folder.id ? null : folder.id));
            }}
            onCreateFolder={() => {
              setOpenCreateMenuId(null);
              onNewFolder(folder.id);
            }}
            onCreateDocument={() => {
              setOpenCreateMenuId(null);
              onNewDocument(folder.id);
            }}
            onUpload={() => startUpload(folder.id)}
            onRename={() => {
              setOpenMoreMenuId(null);
              onRenameFolder(folder.id);
            }}
            onDuplicate={() => {
              setOpenMoreMenuId(null);
              onDuplicateFolder(folder.id);
            }}
            onDelete={() => {
              setOpenMoreMenuId(null);
              onDeleteFolder(folder.id);
            }}
          >
            {isExpanded ? renderFolders(folder.id) : null}
          </KnowledgeTreeItem>
        );
      });

  return (
    <section className="brain-tree" aria-label="企业大脑目录">
      <div className="brain-tree__toolbar">
        <label className="brain-search">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="搜索企业大脑目录"
            value={searchTerm}
            placeholder="搜索目录"
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>
        <div className="brain-root-actions">
          <button
            type="button"
            className="brain-add-button"
            aria-label="管理企业大脑"
            onClick={() => {
              setOpenCreateMenuId(null);
              setOpenMoreMenuId(null);
              setIsRootMenuOpen((current) => !current);
            }}
          >
            +
          </button>
          {isRootMenuOpen ? (
            <div className="brain-tree-menu brain-root-menu">
              <button
                type="button"
                onClick={() => {
                  setIsRootMenuOpen(false);
                  onNewFolder(null);
                }}
              >
                新建一级目录
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRootMenuOpen(false);
                  onNewDocument(null);
                }}
              >
                新建文档
              </button>
              <button type="button" onClick={() => startUpload(null)}>
                上传文件
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        className={`brain-tree-root${selectedFolderId === null ? ' brain-tree-root--selected' : ''}`}
        onClick={() => onSelectFolder(null)}
      >
        <span className="brain-tree-root__icon" aria-hidden="true">
          ▦
        </span>
        <span>
          <strong>企业大脑</strong>
          <small>知识库目录</small>
        </span>
      </button>

      <div className="brain-tree__list">
        {renderFolders(null)}
        {normalizedSearchTerm && visibleFolders.size === 0 ? (
          <p className="brain-tree-empty">没有匹配的目录</p>
        ) : null}
      </div>

      <input
        ref={fileInputRef}
        className="visually-hidden"
        type="file"
        aria-label="选择要上传的文件"
        onChange={(event) => handleFileChange(event.target.files?.[0])}
      />
    </section>
  );
}
