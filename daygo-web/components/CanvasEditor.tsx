'use client'

import { useRef, useImperativeHandle, forwardRef, useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'

// Dynamic import to avoid SSR issues
const Excalidraw = dynamic(
  async () => (await import('@excalidraw/excalidraw')).Excalidraw,
  { ssr: false }
)

export interface CanvasEditorHandle {
  getSceneData: () => Record<string, unknown> | null
}

interface CanvasEditorProps {
  initialData?: Record<string, unknown>
  className?: string
}

export const CanvasEditor = forwardRef<CanvasEditorHandle, CanvasEditorProps>(
  function CanvasEditor({ initialData, className }, ref) {
    const excalidrawAPIRef = useRef<any>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
      setMounted(true)
    }, [])

    // Expose method to get scene data
    useImperativeHandle(ref, () => ({
      getSceneData: () => {
        if (excalidrawAPIRef.current) {
          const api = excalidrawAPIRef.current
          const elements = api.getSceneElements()
          const appState = api.getAppState()
          const files = api.getFiles()
          return {
            elements,
            appState: {
              viewBackgroundColor: appState.viewBackgroundColor,
              gridSize: appState.gridSize,
            },
            files,
          }
        }
        return null
      },
    }))

    // Callback to capture the Excalidraw API
    const handleExcalidrawAPI = useCallback((api: any) => {
      excalidrawAPIRef.current = api
    }, [])

    if (!mounted) {
      return (
        <div className={className} style={{ width: '100%', height: '100%', position: 'relative' }}>
          <div className="flex items-center justify-center h-full text-gray-400">
            Loading canvas...
          </div>
        </div>
      )
    }

    // Prepare initial data for Excalidraw
    const excalidrawInitialData = initialData && (initialData as any).elements
      ? {
          elements: (initialData as any).elements,
          appState: (initialData as any).appState,
          files: (initialData as any).files,
        }
      : undefined

    return (
      <div className={className} style={{ width: '100%', height: '100%', position: 'relative' }}>
        <Excalidraw
          excalidrawAPI={handleExcalidrawAPI}
          initialData={excalidrawInitialData}
          theme="dark"
          UIOptions={{
            canvasActions: {
              saveToActiveFile: false,
              loadScene: false,
              export: false,
              saveAsImage: false,
            },
          }}
        />
      </div>
    )
  }
)
