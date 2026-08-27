import type { ReactNode } from 'react';
import type { BrainFolder } from '../enterpriseBrainTypes';

interface KnowledgeTreeItemProps {
  folder: BrainFolder;
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  isCreateMenuOpen: boolean;
  isMoreMenuOpen: boolean;
  hasChildren: boolean;
  documentCount: number;
  onSelect: () => void;
  onToggle: () => void;
  onToggleCreateMenu: () => void;
  onToggleMoreMenu: () => void;
  onCreateFolder: () => void;
  onCreateDocument: () => void;
  onUpload: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  children?: ReactNode;
}

export function KnowledgeTreeItem({
  folder,
  level,
  isExpanded,
  isSelected,
  isCreateMenuOpen,
  isMoreMenuOpen,
  hasChildren,
  documentCount,
  onSelect,
  onToggle,
  onToggleCreateMenu,
  onToggleMoreMenu,
  onCreateFolder,
  onCreateDocument,
  onUpload,
  onRename,
  onDuplicate,
  onDelete,
  children,
}: KnowledgeTreeItemProps) {
  const createFolderLabel = level === 1 ? '新建二级目录' : '新建三级目录';

  return (
    <div className="brain-tree-node">
      <div
        className={`brain-tree-row${isSelected ? ' brain-tree-row--selected' : ''}`}
        style={{ paddingLeft: `${8 + (level - 1) * 10}px` }}
        onClick={onSelect}
      >
        <button
          type="button"
          className="brain-tree-folder-icon"
          aria-label={hasChildren ? `${isExpanded ? '收起' : '展开'}${folder.name}` : undefined}
          aria-expanded={hasChildren ? isExpanded : undefined}
          onClick={(event) => {
            event.stopPropagation();
            if (hasChildren) {
              onToggle();
            }
          }}
        >
          {hasChildren ? (isExpanded ? '⌄' : '›') : ''}
        </button>
        <span className="brain-tree-row__name">{folder.name}</span>
        {documentCount > 0 ? <span className="brain-tree-row__count">{documentCount}</span> : null}
        <div className="brain-tree-row__actions">
          <button
            type="button"
            className="brain-icon-button"
            aria-label={`为${folder.name}添加内容`}
            onClick={(event) => {
              event.stopPropagation();
              onToggleCreateMenu();
            }}
          >
            +
          </button>
          <button
            type="button"
            className="brain-icon-button"
            aria-label={`管理${folder.name}`}
            onClick={(event) => {
              event.stopPropagation();
              onToggleMoreMenu();
            }}
          >
            …
          </button>
        </div>

        {isCreateMenuOpen ? (
          <div className="brain-tree-menu" onClick={(event) => event.stopPropagation()}>
            {level < 3 ? (
              <button type="button" onClick={onCreateFolder}>
                {createFolderLabel}
              </button>
            ) : null}
            <button type="button" onClick={onCreateDocument}>
              新建文档
            </button>
            <button type="button" onClick={onUpload}>
              上传文件
            </button>
          </div>
        ) : null}

        {isMoreMenuOpen ? (
          <div
            className="brain-tree-menu brain-tree-menu--more"
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" onClick={onRename}>
              重命名
            </button>
            <button type="button" onClick={onDuplicate}>
              创建副本
            </button>
            <button type="button" className="brain-menu-danger" onClick={onDelete}>
              删除
            </button>
          </div>
        ) : null}
      </div>
      {isExpanded ? children : null}
    </div>
  );
}
