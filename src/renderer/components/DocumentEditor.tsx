import { useEffect, useRef, useState } from 'react';

type SaveState = 'saved' | 'saving';

interface DocumentEditorProps {
  title: string;
  content: string;
  saveState: SaveState;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderInlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/~~([^~]+)~~/g, '<s>$1</s>')
    .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>');
}

export function markdownToHtml(markdown: string) {
  const lines = markdown.split('\n');
  const blocks: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (listType) {
      blocks.push(`</${listType}>`);
      listType = null;
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    const ordered = trimmed.match(/^\d+\.\s+(.+)$/);

    if (!trimmed) {
      closeList();
      return;
    }

    if (heading) {
      closeList();
      blocks.push(
        `<h${heading[1].length}>${renderInlineMarkdown(heading[2])}</h${heading[1].length}>`,
      );
      return;
    }

    if (/^---+$/.test(trimmed)) {
      closeList();
      blocks.push('<hr>');
      return;
    }

    if (/^>\s?/.test(trimmed)) {
      closeList();
      blocks.push(`<blockquote>${renderInlineMarkdown(trimmed.replace(/^>\s?/, ''))}</blockquote>`);
      return;
    }

    if (bullet || ordered) {
      const nextListType = bullet ? 'ul' : 'ol';
      if (listType !== nextListType) {
        closeList();
        listType = nextListType;
        blocks.push(`<${listType}>`);
      }
      blocks.push(`<li>${renderInlineMarkdown((bullet ?? ordered)?.[1] ?? '')}</li>`);
      return;
    }

    closeList();
    blocks.push(`<p>${renderInlineMarkdown(trimmed)}</p>`);
  });

  closeList();
  return blocks.join('');
}

function inlineNodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? '';
  }
  if (!(node instanceof HTMLElement)) {
    return '';
  }

  const content = Array.from(node.childNodes).map(inlineNodeToMarkdown).join('');
  switch (node.tagName) {
    case 'STRONG':
    case 'B':
      return `**${content}**`;
    case 'EM':
    case 'I':
      return `*${content}*`;
    case 'S':
    case 'DEL':
      return `~~${content}~~`;
    case 'BR':
      return '\n';
    default:
      return content;
  }
}

function blockToMarkdown(node: Element, listIndex = 1): string {
  const content = Array.from(node.childNodes).map(inlineNodeToMarkdown).join('').trim();
  switch (node.tagName) {
    case 'H1':
    case 'H2':
    case 'H3':
      return `${'#'.repeat(Number(node.tagName.slice(1)))} ${content}\n\n`;
    case 'P':
    case 'DIV':
      return `${content}\n\n`;
    case 'BLOCKQUOTE':
      return `> ${content}\n\n`;
    case 'HR':
      return '---\n\n';
    case 'LI':
      return `${content}\n`;
    case 'UL':
      return `${Array.from(node.children)
        .map((child) => `- ${blockToMarkdown(child)}\n`)
        .join('')}\n`;
    case 'OL':
      return `${Array.from(node.children)
        .map((child, index) => `${index + listIndex}. ${blockToMarkdown(child)}\n`)
        .join('')}\n`;
    default:
      return `${content}\n\n`;
  }
}

export function htmlToMarkdown(html: string) {
  const container = document.createElement('div');
  container.innerHTML = html;
  if (!container.children.length) {
    return container.textContent?.trim() ?? '';
  }
  return Array.from(container.children)
    .map((child) => blockToMarkdown(child))
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function EditorToolButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="brain-editor-tool"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function DocumentEditor({
  title,
  content,
  saveState,
  onTitleChange,
  onContentChange,
}: DocumentEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!editorRef.current || isFocused) {
      return;
    }

    const nextHtml = markdownToHtml(content);
    if (editorRef.current.innerHTML !== nextHtml) {
      editorRef.current.innerHTML = nextHtml;
    }
  }, [content, isFocused]);

  const runCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    onContentChange(htmlToMarkdown(editorRef.current?.innerHTML ?? ''));
  };

  return (
    <div className="brain-editor">
      <div className="brain-editor__topbar">
        <label className="brain-editor__filename">
          <span>文档标题</span>
          <input
            aria-label="文档标题"
            value={title}
            placeholder="请输入文档标题"
            onChange={(event) => onTitleChange(event.target.value)}
          />
          <small>.md</small>
        </label>
        <span className={`brain-autosave brain-autosave--${saveState}`}>
          <span aria-hidden="true" />
          {saveState === 'saving' ? '保存中' : '已保存'}
        </span>
      </div>

      <div className="brain-editor__toolbar" role="toolbar" aria-label="Markdown 编辑工具栏">
        <EditorToolButton label="标题" onClick={() => runCommand('formatBlock', 'h2')} />
        <EditorToolButton label="加粗" onClick={() => runCommand('bold')} />
        <EditorToolButton label="斜体" onClick={() => runCommand('italic')} />
        <EditorToolButton label="删除线" onClick={() => runCommand('strikeThrough')} />
        <span className="brain-editor__separator" aria-hidden="true" />
        <EditorToolButton label="分割线" onClick={() => runCommand('insertHorizontalRule')} />
        <EditorToolButton label="引用" onClick={() => runCommand('formatBlock', 'blockquote')} />
        <EditorToolButton label="项目符号" onClick={() => runCommand('insertUnorderedList')} />
        <EditorToolButton label="编号" onClick={() => runCommand('insertOrderedList')} />
      </div>

      <div
        ref={editorRef}
        className="brain-editor__canvas"
        contentEditable
        role="textbox"
        aria-label="Markdown 可渲染编辑区"
        aria-multiline="true"
        spellCheck={false}
        suppressContentEditableWarning
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onInput={(event) => onContentChange(htmlToMarkdown(event.currentTarget.innerHTML))}
      />
    </div>
  );
}
