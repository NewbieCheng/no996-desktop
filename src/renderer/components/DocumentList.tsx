import { useState } from 'react';
import type { BrainDocument } from '../enterpriseBrainTypes';
import { DocumentActionMenu } from './DocumentActionMenu';

interface DocumentListProps {
  documents: BrainDocument[];
  selectedDocumentId: string | null;
  onSelectDocument: (documentId: string) => void;
  onRenameDocument: (documentId: string) => void;
  onDuplicateDocument: (documentId: string) => void;
  onDownloadDocument: (documentId: string) => void;
  onDeleteDocument: (documentId: string) => void;
}

export function DocumentList({
  documents,
  selectedDocumentId,
  onSelectDocument,
  onRenameDocument,
  onDuplicateDocument,
  onDownloadDocument,
  onDeleteDocument,
}: DocumentListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (documents.length === 0) {
    return (
      <section className="brain-empty-state" aria-live="polite">
        <div className="brain-empty-state__icon" aria-hidden="true">
          □
        </div>
        <h2>当前文件为空</h2>
        <p>可以新建文档或上传文件</p>
      </section>
    );
  }

  return (
    <section className="brain-document-list" aria-label="当前目录文件列表">
      <div className="brain-document-list__header">
        <span>文件名</span>
        <span>修改时间</span>
        <span aria-hidden="true" />
      </div>
      <div className="brain-document-list__rows">
        {documents.map((document) => (
          <div
            key={document.id}
            className={`brain-document-row${selectedDocumentId === document.id ? ' brain-document-row--selected' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => onSelectDocument(document.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelectDocument(document.id);
              }
            }}
          >
            <div className="brain-document-row__name">
              <span className="brain-file-icon" aria-hidden="true">
                {document.kind === 'markdown' ? 'M' : '·'}
              </span>
              <span>
                <strong>{document.title}</strong>
                <small>{document.fileName}</small>
              </span>
            </div>
            <span className="brain-document-row__date">{document.updatedAt}</span>
            <DocumentActionMenu
              documentId={document.title}
              isOpen={openMenuId === document.id}
              canDownload={document.kind === 'markdown'}
              onToggle={() =>
                setOpenMenuId((current) => (current === document.id ? null : document.id))
              }
              onRename={() => {
                setOpenMenuId(null);
                onRenameDocument(document.id);
              }}
              onDuplicate={() => {
                setOpenMenuId(null);
                onDuplicateDocument(document.id);
              }}
              onDownload={() => {
                setOpenMenuId(null);
                onDownloadDocument(document.id);
              }}
              onDelete={() => {
                setOpenMenuId(null);
                onDeleteDocument(document.id);
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
