import { useEffect, useMemo, useState } from 'react';
import { initialBrainDocuments, initialBrainFolders } from './enterpriseBrainMockData';
import type { BrainDialog, BrainDocument, BrainFolder } from './enterpriseBrainTypes';
import { DocumentList } from './components/DocumentList';
import { DocumentReader } from './components/DocumentReader';
import { KnowledgeTree } from './components/KnowledgeTree';
import { ProductSidebar } from './components/ProductSidebar';

interface EditorDraft {
  title: string;
  content: string;
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getFolderName(folders: BrainFolder[], folderId: string | null) {
  return folderId
    ? (folders.find((folder) => folder.id === folderId)?.name ?? '未命名目录')
    : '企业大脑';
}

function getFolderDepth(folders: BrainFolder[], folderId: string) {
  let depth = 1;
  let parentId = folders.find((folder) => folder.id === folderId)?.parentId ?? null;
  while (parentId) {
    depth += 1;
    parentId = folders.find((folder) => folder.id === parentId)?.parentId ?? null;
  }
  return depth;
}

function collectFolderIds(folders: BrainFolder[], folderId: string) {
  const ids = new Set<string>([folderId]);
  const visit = (parentId: string) => {
    folders
      .filter((folder) => folder.parentId === parentId)
      .forEach((folder) => {
        ids.add(folder.id);
        visit(folder.id);
      });
  };
  visit(folderId);
  return ids;
}

function getDocumentFileName(title: string) {
  const normalized = title.trim() || '未命名文档';
  return normalized.toLowerCase().endsWith('.md') ? normalized : `${normalized}.md`;
}

function getDocumentTitle(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, '') || '未命名文件';
}

function BrainDialogModal({
  dialog,
  value,
  onChange,
  onCancel,
  onSave,
  onConfirm,
}: {
  dialog: BrainDialog;
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
  onConfirm: () => void;
}) {
  if (!dialog) {
    return null;
  }

  const isConfirm = dialog.kind === 'confirm-folder' || dialog.kind === 'confirm-document';
  const title = isConfirm
    ? '确认删除'
    : dialog.kind === 'folder'
      ? dialog.mode === 'rename'
        ? '重命名文件夹'
        : '新建文件夹'
      : '重命名文档';

  return (
    <div className="brain-modal-layer">
      <div className="brain-modal-backdrop" onClick={onCancel} />
      <section
        className="brain-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="brain-modal-title"
      >
        <div className="brain-modal__header">
          <h2 id="brain-modal-title">{title}</h2>
          <button
            type="button"
            className="brain-modal__close"
            aria-label="关闭弹窗"
            onClick={onCancel}
          >
            ×
          </button>
        </div>

        {isConfirm ? (
          <div className="brain-modal__body">
            <p>
              确定删除“{dialog.title}”吗？
              {dialog.kind === 'confirm-folder' && dialog.hasContents
                ? '目录中的子目录和文件也会被删除。'
                : ''}
            </p>
          </div>
        ) : (
          <div className="brain-modal__body">
            <label htmlFor="brain-dialog-name">
              {dialog.kind === 'folder' ? '文件夹名称' : '文档标题'}
            </label>
            <input
              id="brain-dialog-name"
              autoFocus
              value={value}
              placeholder={dialog.kind === 'folder' ? '请输入文件夹名称' : '请输入文档标题'}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && value.trim()) {
                  onSave();
                }
              }}
            />
          </div>
        )}

        <div className="brain-modal__footer">
          <button type="button" className="button button--secondary" onClick={onCancel}>
            取消
          </button>
          {isConfirm ? (
            <button type="button" className="button button--danger" onClick={onConfirm}>
              确认删除
            </button>
          ) : (
            <button
              type="button"
              className="button button--primary"
              disabled={!value.trim()}
              onClick={onSave}
            >
              保存
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

export function EnterpriseBrainPage() {
  const [folders, setFolders] = useState(initialBrainFolders);
  const [documents, setDocuments] = useState(initialBrainDocuments);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>('company');
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    new Set(['content', 'founder', 'brand', 'assets', 'marketing']),
  );
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveState, setSaveState] = useState<'saved' | 'saving'>('saved');
  const [editorDraft, setEditorDraft] = useState<EditorDraft>({ title: '', content: '' });
  const [dialog, setDialog] = useState<BrainDialog>(null);
  const [dialogValue, setDialogValue] = useState('');

  const selectedFolderDocuments = useMemo(
    () => documents.filter((document) => document.folderId === selectedFolderId),
    [documents, selectedFolderId],
  );
  const selectedDocument = documents.find((document) => document.id === selectedDocumentId) ?? null;
  const currentFolderName = getFolderName(folders, selectedFolderId);

  const getCurrentDraftDocument = () => {
    if (!selectedDocument || selectedDocument.kind !== 'markdown' || !isEditing) {
      return null;
    }

    const title = editorDraft.title.trim() || selectedDocument.title;
    return {
      ...selectedDocument,
      title,
      fileName: getDocumentFileName(title),
      content: editorDraft.content,
      updatedAt: '刚刚',
    };
  };

  const persistCurrentDraft = () => {
    const draftDocument = getCurrentDraftDocument();
    if (!draftDocument) {
      return;
    }

    setDocuments((current) =>
      current.map((document) => (document.id === draftDocument.id ? draftDocument : document)),
    );
    setEditorDraft((current) => ({ ...current, title: draftDocument.title }));
    setSaveState('saved');
  };

  useEffect(() => {
    if (!selectedDocument || selectedDocument.kind !== 'markdown' || !isEditing || isSourceMode) {
      setSaveState('saved');
      return;
    }

    const title = editorDraft.title.trim() || selectedDocument.title;
    const hasChanges =
      title !== selectedDocument.title || editorDraft.content !== selectedDocument.content;
    if (!hasChanges) {
      setSaveState('saved');
      return;
    }

    setSaveState('saving');
    const timer = window.setTimeout(() => {
      setDocuments((current) =>
        current.map((document) =>
          document.id === selectedDocument.id
            ? {
                ...document,
                title,
                fileName: getDocumentFileName(title),
                content: editorDraft.content,
                updatedAt: '刚刚',
              }
            : document,
        ),
      );
      setEditorDraft((current) => ({ ...current, title }));
      setSaveState('saved');
    }, 650);

    return () => window.clearTimeout(timer);
  }, [editorDraft.content, editorDraft.title, isEditing, isSourceMode, selectedDocument]);

  const selectFolder = (folderId: string | null) => {
    persistCurrentDraft();
    setSelectedFolderId(folderId);
    setSelectedDocumentId(null);
    setIsEditing(false);
    setIsSourceMode(false);
    setSaveState('saved');
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolderIds((current) => {
      const next = new Set(current);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const openCreateFolderDialog = (parentId: string | null) => {
    if (parentId && getFolderDepth(folders, parentId) >= 3) {
      return;
    }
    setDialog({ kind: 'folder', mode: 'create', parentId, title: '新建文件夹' });
    setDialogValue('');
  };

  const openRenameFolderDialog = (folderId: string) => {
    setDialog({ kind: 'folder', mode: 'rename', folderId, title: '重命名文件夹' });
    setDialogValue(getFolderName(folders, folderId));
  };

  const openRenameDocumentDialog = (documentId: string) => {
    const document = documents.find((item) => item.id === documentId);
    if (!document) {
      return;
    }
    setDialog({ kind: 'document', documentId, title: '重命名文档' });
    setDialogValue(document.title);
  };

  const handleNewDocument = (folderId: string | null) => {
    persistCurrentDraft();
    const id = createId('doc');
    const newDocument: BrainDocument = {
      id,
      folderId,
      title: '未命名文档',
      fileName: '未命名文档.md',
      kind: 'markdown',
      content: '',
      updatedAt: '刚刚',
    };
    setDocuments((current) => [...current, newDocument]);
    setSelectedFolderId(folderId);
    setSelectedDocumentId(id);
    setEditorDraft({ title: newDocument.title, content: newDocument.content });
    setIsSourceMode(false);
    setIsEditing(true);
  };

  const handleUpload = (folderId: string | null, file: File) => {
    persistCurrentDraft();
    const isMarkdown = file.name.toLowerCase().endsWith('.md');
    const id = createId('file');
    const title = getDocumentTitle(file.name);
    const newDocument: BrainDocument = {
      id,
      folderId,
      title,
      fileName: file.name,
      kind: isMarkdown ? 'markdown' : 'file',
      content: isMarkdown ? '这是上传的 Markdown 文件内容。' : '',
      updatedAt: '刚刚',
    };
    setDocuments((current) => [...current, newDocument]);
    setSelectedFolderId(folderId);
    setSelectedDocumentId(isMarkdown ? id : null);
    setEditorDraft({ title: newDocument.title, content: newDocument.content });
    setIsEditing(isMarkdown);
    setIsSourceMode(false);
    setSaveState('saved');
  };

  const saveDialog = () => {
    const nextName = dialogValue.trim();
    if (!dialog || !nextName) {
      return;
    }

    if (dialog.kind === 'folder' && dialog.mode === 'create') {
      persistCurrentDraft();
      const id = createId('folder');
      setFolders((current) => [...current, { id, name: nextName, parentId: dialog.parentId }]);
      setSelectedFolderId(id);
      setSelectedDocumentId(null);
      setIsEditing(false);
      setIsSourceMode(false);
      setSaveState('saved');
      if (dialog.parentId) {
        setExpandedFolderIds((current) => new Set(current).add(dialog.parentId as string));
      }
    } else if (dialog.kind === 'folder' && dialog.mode === 'rename') {
      setFolders((current) =>
        current.map((folder) =>
          folder.id === dialog.folderId ? { ...folder, name: nextName } : folder,
        ),
      );
    } else if (dialog.kind === 'document') {
      setDocuments((current) =>
        current.map((document) =>
          document.id === dialog.documentId
            ? { ...document, title: nextName, fileName: getDocumentFileName(nextName) }
            : document,
        ),
      );
      if (selectedDocumentId === dialog.documentId) {
        setEditorDraft((current) => ({ ...current, title: nextName }));
      }
    }

    setDialog(null);
    setDialogValue('');
  };

  const requestDeleteFolder = (folderId: string) => {
    const ids = collectFolderIds(folders, folderId);
    const hasContents =
      ids.size > 1 || documents.some((document) => document.folderId && ids.has(document.folderId));
    const folder = folders.find((item) => item.id === folderId);
    if (!folder) {
      return;
    }
    setDialog({ kind: 'confirm-folder', folderId, title: folder.name, hasContents });
    setDialogValue('confirm');
  };

  const requestDeleteDocument = (documentId: string) => {
    const document = documents.find((item) => item.id === documentId);
    if (!document) {
      return;
    }
    setDialog({ kind: 'confirm-document', documentId, title: document.title });
    setDialogValue('confirm');
  };

  const confirmDelete = () => {
    if (!dialog) {
      return;
    }

    if (dialog.kind === 'confirm-folder') {
      const ids = collectFolderIds(folders, dialog.folderId);
      const folder = folders.find((item) => item.id === dialog.folderId);
      setFolders((current) => current.filter((item) => !ids.has(item.id)));
      setDocuments((current) =>
        current.filter((document) => !document.folderId || !ids.has(document.folderId)),
      );
      if (selectedFolderId && ids.has(selectedFolderId)) {
        selectFolder(folder?.parentId ?? null);
      }
      if (selectedDocumentId) {
        const selectedDocumentFolder = documents.find(
          (item) => item.id === selectedDocumentId,
        )?.folderId;
        if (selectedDocumentFolder && ids.has(selectedDocumentFolder)) {
          setSelectedDocumentId(null);
        }
      }
    } else if (dialog.kind === 'confirm-document') {
      setDocuments((current) => current.filter((document) => document.id !== dialog.documentId));
      if (selectedDocumentId === dialog.documentId) {
        setSelectedDocumentId(null);
        setIsEditing(false);
      }
    }

    setDialog(null);
    setDialogValue('');
  };

  const duplicateFolder = (folderId: string) => {
    const source = folders.find((folder) => folder.id === folderId);
    if (!source) {
      return;
    }
    const draftDocument = getCurrentDraftDocument();
    persistCurrentDraft();
    const documentsToClone = draftDocument
      ? documents.map((document) => (document.id === draftDocument.id ? draftDocument : document))
      : documents;

    const descendants = collectFolderIds(folders, folderId);
    const folderIdMap = new Map<string, string>();
    const clonedFolders: BrainFolder[] = [];
    const cloneFolder = (sourceId: string, parentId: string | null, isRoot: boolean) => {
      const original = folders.find((folder) => folder.id === sourceId);
      if (!original) {
        return null;
      }
      const id = createId('folder-copy');
      folderIdMap.set(sourceId, id);
      clonedFolders.push({
        id,
        parentId,
        name: isRoot ? `${original.name}副本` : original.name,
      });
      folders
        .filter((folder) => folder.parentId === sourceId)
        .forEach((child) => {
          cloneFolder(child.id, id, false);
        });
      return id;
    };

    const newRootId = cloneFolder(folderId, source.parentId, true);
    if (!newRootId) {
      return;
    }
    const clonedDocuments = documentsToClone
      .filter((document) => document.folderId && descendants.has(document.folderId))
      .map((document) => ({
        ...document,
        id: createId('doc-copy'),
        folderId: folderIdMap.get(document.folderId as string) ?? null,
        title: `${document.title}副本`,
        fileName:
          document.kind === 'markdown'
            ? getDocumentFileName(`${document.title}副本`)
            : `${document.title}副本${document.fileName.includes('.') ? document.fileName.slice(document.fileName.lastIndexOf('.')) : ''}`,
        updatedAt: '刚刚',
      }));

    setFolders((current) => [...current, ...clonedFolders]);
    setDocuments((current) => [...current, ...clonedDocuments]);
    setExpandedFolderIds((current) => new Set([...current, newRootId]));
    setSelectedFolderId(newRootId);
    setSelectedDocumentId(null);
  };

  const duplicateDocument = (documentId: string) => {
    persistCurrentDraft();
    const source = documents.find((document) => document.id === documentId);
    if (!source) {
      return;
    }
    const title = `${source.title}副本`;
    const copy: BrainDocument = {
      ...source,
      id: createId('doc-copy'),
      title,
      fileName:
        source.kind === 'markdown'
          ? getDocumentFileName(title)
          : `${title}${source.fileName.includes('.') ? source.fileName.slice(source.fileName.lastIndexOf('.')) : ''}`,
      updatedAt: '刚刚',
    };
    setDocuments((current) => [...current, copy]);
    setSelectedDocumentId(null);
    setEditorDraft({ title: '', content: '' });
    setIsEditing(false);
    setIsSourceMode(false);
    setSaveState('saved');
  };

  const downloadDocument = (documentId: string) => {
    const document = documents.find((item) => item.id === documentId);
    if (!document || document.kind !== 'markdown') {
      return;
    }
    const isSelectedMarkdown = selectedDocument?.id === documentId && isEditing;
    const title = isSelectedMarkdown ? editorDraft.title.trim() || document.title : document.title;
    const content = isSelectedMarkdown ? editorDraft.content : document.content;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement('a');
    anchor.href = url;
    anchor.download = getDocumentFileName(title);
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const toggleSource = () => {
    if (!selectedDocument || selectedDocument.kind !== 'markdown') {
      return;
    }

    if (!isSourceMode) {
      persistCurrentDraft();
      setIsEditing(false);
      setIsSourceMode(true);
      return;
    }

    setIsSourceMode(false);
    setIsEditing(true);
    setEditorDraft({ title: selectedDocument.title, content: selectedDocument.content });
  };

  return (
    <div className="app-shell app-shell--brain">
      <ProductSidebar activeModule="enterprise-brain" />
      <main className="app-main brain-app-main" id="enterprise-brain">
        <header className="topbar">
          <div className="breadcrumb" aria-label="当前位置">
            <span>企业大脑</span>
            <span aria-hidden="true">/</span>
            <strong>{currentFolderName}</strong>
          </div>
          <div className="topbar-account">
            <span className="account-avatar" aria-hidden="true">
              澄
            </span>
            <span>澄心健康</span>
          </div>
        </header>

        <div className="brain-layout">
          <KnowledgeTree
            folders={folders}
            documents={documents}
            selectedFolderId={selectedFolderId}
            expandedFolderIds={expandedFolderIds}
            onSelectFolder={selectFolder}
            onToggleFolder={toggleFolder}
            onNewFolder={openCreateFolderDialog}
            onNewDocument={handleNewDocument}
            onUpload={handleUpload}
            onRenameFolder={openRenameFolderDialog}
            onDuplicateFolder={duplicateFolder}
            onDeleteFolder={requestDeleteFolder}
          />

          <section className="brain-workspace">
            {!selectedDocument ? (
              <div className="brain-workspace__toolbar">
                <div>
                  <h1>{currentFolderName}</h1>
                  <p>{selectedFolderDocuments.length} 个文件</p>
                </div>
                {selectedFolderDocuments.length > 0 ? (
                  <span className="brain-workspace__count">
                    {selectedFolderDocuments.length} 个文件
                  </span>
                ) : null}
              </div>
            ) : null}

            <div className="brain-workspace__body">
              {selectedDocument ? (
                <DocumentReader
                  document={selectedDocument}
                  isEditing={isEditing}
                  isSourceMode={isSourceMode}
                  saveState={saveState}
                  draftTitle={editorDraft.title}
                  draftContent={editorDraft.content}
                  onToggleSource={toggleSource}
                  onDownload={() => downloadDocument(selectedDocument.id)}
                  onDraftTitleChange={(title) =>
                    setEditorDraft((current) => ({ ...current, title }))
                  }
                  onDraftContentChange={(content) =>
                    setEditorDraft((current) => ({ ...current, content }))
                  }
                />
              ) : (
                <DocumentList
                  documents={selectedFolderDocuments}
                  selectedDocumentId={selectedDocumentId}
                  onSelectDocument={(documentId) => {
                    persistCurrentDraft();
                    const document = documents.find((item) => item.id === documentId);
                    setSelectedDocumentId(documentId);
                    setEditorDraft({
                      title: document?.title ?? '',
                      content: document?.content ?? '',
                    });
                    setIsEditing(document?.kind === 'markdown');
                    setIsSourceMode(false);
                    setSaveState('saved');
                  }}
                  onRenameDocument={openRenameDocumentDialog}
                  onDuplicateDocument={duplicateDocument}
                  onDownloadDocument={downloadDocument}
                  onDeleteDocument={requestDeleteDocument}
                />
              )}
            </div>
          </section>
        </div>
      </main>

      <BrainDialogModal
        dialog={dialog}
        value={dialogValue}
        onChange={setDialogValue}
        onCancel={() => {
          setDialog(null);
          setDialogValue('');
        }}
        onSave={saveDialog}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
