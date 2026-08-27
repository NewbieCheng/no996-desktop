import type { ReactNode } from 'react';
import type { BrainDocument } from '../enterpriseBrainTypes';
import { DocumentEditor } from './DocumentEditor';

interface DocumentReaderProps {
  document: BrainDocument;
  isEditing: boolean;
  isSourceMode: boolean;
  saveState: 'saved' | 'saving';
  draftTitle: string;
  draftContent: string;
  onToggleSource: () => void;
  onDownload: () => void;
  onDraftTitleChange: (title: string) => void;
  onDraftContentChange: (content: string) => void;
}

function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function isMarkdownBlockStart(line: string) {
  return /^(#{1,3}\s|[-*]\s|>\s?|---+$)/.test(line.trim());
}

export function MarkdownPreview({ content }: { content: string }) {
  const lines = content.split('\n');
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trimEnd();
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const Heading = `h${headingMatch[1].length}` as 'h1' | 'h2' | 'h3';
      blocks.push(<Heading key={`heading-${index}`}>{renderInline(headingMatch[2])}</Heading>);
      index += 1;
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      blocks.push(<hr key={`rule-${index}`} />);
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line.trim())) {
      const listItems: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        listItems.push(lines[index].trim().replace(/^[-*]\s+/, ''));
        index += 1;
      }
      blocks.push(
        <ul key={`list-${index}`}>
          {listItems.map((item, itemIndex) => (
            <li key={`${item}-${itemIndex}`}>{renderInline(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^>\s?/.test(line.trim())) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ''));
        index += 1;
      }
      blocks.push(<blockquote key={`quote-${index}`}>{quoteLines.join(' ')}</blockquote>);
      continue;
    }

    const paragraphLines = [line.trim()];
    index += 1;
    while (index < lines.length && lines[index].trim() && !isMarkdownBlockStart(lines[index])) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }
    blocks.push(<p key={`paragraph-${index}`}>{renderInline(paragraphLines.join(' '))}</p>);
  }

  return <div className="markdown-body">{blocks}</div>;
}

export function DocumentReader({
  document,
  isEditing,
  isSourceMode,
  saveState,
  draftTitle,
  draftContent,
  onToggleSource,
  onDownload,
  onDraftTitleChange,
  onDraftContentChange,
}: DocumentReaderProps) {
  return (
    <section className="brain-reader" aria-label="Markdown 文档工作区">
      <div className="brain-reader__actions">
        {document.kind === 'markdown' ? (
          <>
            {isEditing ? (
              <span className={`brain-reader__save-state brain-reader__save-state--${saveState}`}>
                {saveState === 'saving' ? '保存中' : '自动保存已开启'}
              </span>
            ) : null}
            <button type="button" className="button button--secondary" onClick={onToggleSource}>
              {isSourceMode ? '返回编辑' : '查看源码'}
            </button>
            <button type="button" className="button button--secondary" onClick={onDownload}>
              下载 .md
            </button>
          </>
        ) : null}
      </div>

      {document.kind === 'markdown' ? (
        isSourceMode ? (
          <pre className="markdown-source">{document.content}</pre>
        ) : isEditing ? (
          <DocumentEditor
            key={document.id}
            title={draftTitle}
            content={draftContent}
            saveState={saveState}
            onTitleChange={onDraftTitleChange}
            onContentChange={onDraftContentChange}
          />
        ) : (
          <MarkdownPreview content={document.content} />
        )
      ) : (
        <div className="brain-file-preview">
          <span className="brain-file-preview__icon" aria-hidden="true">
            ·
          </span>
          <h2>暂不支持预览</h2>
          <p>当前版本只展示普通文件记录，Markdown 文件可以进入阅读区。</p>
        </div>
      )}
    </section>
  );
}
