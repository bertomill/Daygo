'use client'

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { Tldraw, Editor, TLRecord, TLStoreSnapshot } from 'tldraw'
import 'tldraw/tldraw.css'

export interface CanvasEditorHandle {
  getSceneData: () => any | null
}

interface CanvasEditorProps {
  initialData?: any
  className?: string
}

export const CanvasEditor = forwardRef<CanvasEditorHandle, CanvasEditorProps>(
  function CanvasEditor({ initialData, className }, ref) {
    const editorRef = useRef<Editor | null>(null)

    // Expose method to get scene data
    useImperativeHandle(ref, () => ({
      getSceneData: () => {
        if (editorRef.current) {
          const snapshot = editorRef.current.getSnapshot()
          return snapshot
        }
        return null
      },
    }))

    const handleMount = (editor: Editor) => {
      editorRef.current = editor

      // Load initial data if provided
      if (initialData && Object.keys(initialData).length > 0) {
        try {
          editor.loadSnapshot(initialData)
        } catch (error) {
          console.error('Error loading initial data:', error)
        }
      }
    }

    return (
      <div className={className} style={{ width: '100%', height: '100%', position: 'relative' }}>
        <Tldraw onMount={handleMount} />
      </div>
    )
  }
)
