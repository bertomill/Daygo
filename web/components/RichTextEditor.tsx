'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { Bold, Highlighter, List } from 'lucide-react'
import { useEffect } from 'react'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
}

const COLORS = [
  { name: 'Default', value: null },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
]

const HIGHLIGHT_COLORS = [
  { name: 'None', value: null },
  { name: 'Yellow', value: '#fef08a' },
  { name: 'Green', value: '#bbf7d0' },
  { name: 'Blue', value: '#bfdbfe' },
  { name: 'Pink', value: '#fbcfe8' },
  { name: 'Purple', value: '#e9d5ff' },
]

export function RichTextEditor({ content, onChange, placeholder, className }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // Disable features we don't need
        heading: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[100px] px-4 py-3',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) {
    return null
  }

  return (
    <div className={`border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800">
        {/* Bold */}
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded-lg transition-colors ${
            editor.isActive('bold')
              ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
              : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-400'
          }`}
          title="Bold (Ctrl+B)"
          type="button"
        >
          <Bold className="w-4 h-4" />
        </button>

        {/* Bullet List */}
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-lg transition-colors ${
            editor.isActive('bulletList')
              ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
              : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-400'
          }`}
          title="Bullet List"
          type="button"
        >
          <List className="w-4 h-4" />
        </button>

        {/* Separator */}
        <div className="w-px h-6 bg-gray-200 dark:bg-slate-600 mx-1" />

        {/* Text Colors */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400 dark:text-slate-500 px-1">Color:</span>
          {COLORS.map((color) => (
            <button
              key={color.name}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (color.value) {
                  editor.chain().focus().setColor(color.value).run()
                } else {
                  editor.chain().focus().unsetColor().run()
                }
              }}
              className={`w-5 h-5 rounded-full border-2 transition-all ${
                (color.value && editor.isActive('textStyle', { color: color.value })) ||
                (!color.value && !editor.isActive('textStyle'))
                  ? 'border-blue-500 scale-110'
                  : 'border-transparent hover:scale-110'
              }`}
              style={{
                backgroundColor: color.value || 'transparent',
                ...(color.value === null && {
                  background: 'linear-gradient(135deg, #374151 50%, #9ca3af 50%)',
                }),
              }}
              title={color.name}
              type="button"
            />
          ))}
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-gray-200 dark:bg-slate-600 mx-1" />

        {/* Highlight Colors */}
        <div className="flex items-center gap-1">
          <Highlighter className="w-4 h-4 text-gray-400 dark:text-slate-500" />
          {HIGHLIGHT_COLORS.map((color) => (
            <button
              key={color.name}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (color.value) {
                  editor.chain().focus().toggleHighlight({ color: color.value }).run()
                } else {
                  editor.chain().focus().unsetHighlight().run()
                }
              }}
              className={`w-5 h-5 rounded border-2 transition-all ${
                (color.value && editor.isActive('highlight', { color: color.value }))
                  ? 'border-blue-500 scale-110'
                  : 'border-gray-300 dark:border-slate-500 hover:scale-110'
              }`}
              style={{
                backgroundColor: color.value || 'transparent',
              }}
              title={color.name}
              type="button"
            />
          ))}
        </div>
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="text-gray-900 dark:text-white [&_.ProseMirror]:whitespace-pre-wrap [&_.ProseMirror_p]:m-0"
      />

      {/* Placeholder */}
      {editor.isEmpty && placeholder && (
        <div className="absolute top-[52px] left-4 text-gray-400 dark:text-slate-400 pointer-events-none">
          {placeholder}
        </div>
      )}
    </div>
  )
}
