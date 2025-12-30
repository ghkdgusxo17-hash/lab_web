'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { useCallback, useEffect, useState } from 'react'
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Image as ImageIcon, Undo, Redo, Type, AlignJustify } from 'lucide-react'

interface RichTextEditorProps {
    content: string
    onChange: (html: string) => void
    placeholder?: string
    minHeight?: string
}

type LineSpacing = 'tight' | 'normal' | 'loose'

export function RichTextEditor({ content, onChange, placeholder = '내용을 입력하세요...', minHeight = '200px' }: RichTextEditorProps) {
    const [lineSpacing, setLineSpacing] = useState<LineSpacing>('normal')

    const spacingClasses = {
        tight: '[&>p]:my-0.5 [&>h2]:my-1 [&>ul]:my-0.5 [&>ol]:my-0.5',
        normal: '[&>p]:my-1.5 [&>h2]:my-2 [&>ul]:my-1 [&>ol]:my-1',
        loose: '[&>p]:my-3 [&>h2]:my-4 [&>ul]:my-2 [&>ol]:my-2',
    }

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [2, 3],
                },
            }),
            Image.configure({
                inline: true,
                allowBase64: true,
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-600 hover:underline',
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: `prose prose-sm prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[${minHeight}] px-4 py-3 ${spacingClasses[lineSpacing]}`,
            },
            handlePaste(view, event) {
                const items = event.clipboardData?.items
                if (!items) return false

                for (const item of items) {
                    if (item.type.startsWith('image/')) {
                        event.preventDefault()
                        const file = item.getAsFile()
                        if (file) {
                            handleImageUpload(file)
                        }
                        return true
                    }
                }
                return false
            },
            handleDrop(view, event) {
                const files = event.dataTransfer?.files
                if (!files || files.length === 0) return false

                for (const file of files) {
                    if (file.type.startsWith('image/')) {
                        event.preventDefault()
                        handleImageUpload(file)
                        return true
                    }
                }
                return false
            },
        },
    })

    // Sync content when it changes externally
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content)
        }
    }, [content, editor])

    const handleImageUpload = useCallback(async (file: File) => {
        if (!editor) return

        // Convert to base64 for immediate preview
        const reader = new FileReader()
        reader.onload = async (e) => {
            const base64 = e.target?.result as string

            // Insert base64 image immediately for preview
            editor.chain().focus().setImage({ src: base64 }).run()

            // Upload to server in background
            try {
                const formData = new FormData()
                formData.append('file', file)

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                })

                if (response.ok) {
                    const data = await response.json()
                    if (data.url) {
                        // Replace base64 with actual URL
                        const newContent = editor.getHTML().replace(base64, data.url)
                        editor.commands.setContent(newContent)
                        onChange(editor.getHTML())
                    }
                }
            } catch (error) {
                console.error('Image upload failed:', error)
                // Keep base64 version if upload fails
            }
        }
        reader.readAsDataURL(file)
    }, [editor, onChange])

    const addLink = useCallback(() => {
        if (!editor) return
        const url = window.prompt('URL을 입력하세요:')
        if (url) {
            editor.chain().focus().setLink({ href: url }).run()
        }
    }, [editor])

    const addImage = useCallback(() => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) {
                handleImageUpload(file)
            }
        }
        input.click()
    }, [handleImageUpload])

    if (!editor) return null

    return (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-wrap">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-2 rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
                    title="굵게 (Ctrl+B)"
                >
                    <Bold className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-2 rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
                    title="기울임 (Ctrl+I)"
                >
                    <Italic className="w-4 h-4" />
                </button>

                <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-2 rounded-lg transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
                    title="제목"
                >
                    <Type className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-2 rounded-lg transition-colors ${editor.isActive('bulletList') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
                    title="글머리 기호"
                >
                    <List className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-2 rounded-lg transition-colors ${editor.isActive('orderedList') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
                    title="번호 목록"
                >
                    <ListOrdered className="w-4 h-4" />
                </button>

                <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

                <button
                    type="button"
                    onClick={addLink}
                    className={`p-2 rounded-lg transition-colors ${editor.isActive('link') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
                    title="링크 추가"
                >
                    <LinkIcon className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={addImage}
                    className="p-2 rounded-lg transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                    title="이미지 추가 (또는 Ctrl+V로 붙여넣기)"
                >
                    <ImageIcon className="w-4 h-4" />
                </button>

                <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

                {/* Line Spacing Toggle */}
                <button
                    type="button"
                    onClick={() => {
                        const next: Record<LineSpacing, LineSpacing> = { tight: 'normal', normal: 'loose', loose: 'tight' }
                        setLineSpacing(next[lineSpacing])
                    }}
                    className="px-2 py-1 rounded-lg transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-medium flex items-center gap-1"
                    title={`줄간격: ${lineSpacing === 'tight' ? '좁게' : lineSpacing === 'normal' ? '보통' : '넓게'}`}
                >
                    <AlignJustify className="w-4 h-4" />
                    <span className="hidden sm:inline">
                        {lineSpacing === 'tight' ? '좁게' : lineSpacing === 'normal' ? '보통' : '넓게'}
                    </span>
                </button>

                <div className="flex-1" />

                <button
                    type="button"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    className="p-2 rounded-lg transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-30"
                    title="실행 취소 (Ctrl+Z)"
                >
                    <Undo className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    className="p-2 rounded-lg transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-30"
                    title="다시 실행 (Ctrl+Y)"
                >
                    <Redo className="w-4 h-4" />
                </button>
            </div>

            {/* Editor Content */}
            <EditorContent editor={editor} className="min-h-[200px]" />

            {/* Helper text */}
            <div className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800">
                💡 이미지를 Ctrl+V로 붙여넣거나 드래그하여 삽입할 수 있습니다
            </div>
        </div>
    )
}
