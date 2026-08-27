interface DocumentActionMenuProps {
  documentId: string;
  isOpen: boolean;
  onToggle: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDownload: () => void;
  onDelete: () => void;
  canDownload: boolean;
}

export function DocumentActionMenu({
  documentId,
  isOpen,
  onToggle,
  onRename,
  onDuplicate,
  onDownload,
  onDelete,
  canDownload,
}: DocumentActionMenuProps) {
  return (
    <div className="brain-document-actions">
      <button
        type="button"
        className="brain-icon-button"
        aria-label={`管理文档 ${documentId}`}
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
      >
        …
      </button>
      {isOpen ? (
        <div className="brain-document-menu" onClick={(event) => event.stopPropagation()}>
          <button type="button" onClick={onRename}>
            重命名
          </button>
          <button type="button" onClick={onDuplicate}>
            创建副本
          </button>
          {canDownload ? (
            <button type="button" onClick={onDownload}>
              下载 .md
            </button>
          ) : null}
          <button type="button" className="brain-menu-danger" onClick={onDelete}>
            删除
          </button>
        </div>
      ) : null}
    </div>
  );
}
