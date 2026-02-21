import { Editor } from '@tiptap/react'
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Quote,
    Code,
    Heading1,
    Heading2,
    Undo,
    Redo,
    Highlighter,
    CheckSquare,
    Underline as UnderlineIcon,
    Share2,
    Link as LinkIcon,
    AlignLeft,
    AlignCenter,
    AlignRight
} from 'lucide-react'

interface EditorToolbarProps {
    editor: Editor | null
}

export const EditorToolbar = ({ editor }: EditorToolbarProps) => {
    if (!editor) return null

    const copyShareLink = () => {
        const hash = window.location.hash
        if (hash) {
            navigator.clipboard.writeText(window.location.href)
            alert('Share link copied to clipboard!')
        }
    }

    const setLink = () => {
        const url = window.prompt('URL')
        if (url) editor.chain().focus().setLink({ href: url }).run()
    }

    const items = [
        {
            icon: Heading1,
            title: 'Heading 1',
            action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
            isActive: () => editor.isActive('heading', { level: 1 }),
        },
        {
            icon: Heading2,
            title: 'Heading 2',
            action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
            isActive: () => editor.isActive('heading', { level: 2 }),
        },
        {
            icon: Bold,
            title: 'Bold',
            action: () => editor.chain().focus().toggleBold().run(),
            isActive: () => editor.isActive('bold'),
        },
        {
            icon: Italic,
            title: 'Italic',
            action: () => editor.chain().focus().toggleItalic().run(),
            isActive: () => editor.isActive('italic'),
        },
        {
            icon: UnderlineIcon,
            title: 'Underline',
            action: () => editor.chain().focus().toggleUnderline().run(),
            isActive: () => editor.isActive('underline'),
        },
        {
            icon: Highlighter,
            title: 'Highlight',
            action: () => editor.chain().focus().toggleHighlight().run(),
            isActive: () => editor.isActive('highlight'),
        },
        {
            icon: LinkIcon,
            title: 'Link',
            action: setLink,
            isActive: () => editor.isActive('link'),
        },
        {
            icon: AlignLeft,
            title: 'Align Left',
            action: () => editor.chain().focus().setTextAlign('left').run(),
            isActive: () => editor.isActive({ textAlign: 'left' }),
        },
        {
            icon: AlignCenter,
            title: 'Align Center',
            action: () => editor.chain().focus().setTextAlign('center').run(),
            isActive: () => editor.isActive({ textAlign: 'center' }),
        },
        {
            icon: AlignRight,
            title: 'Align Right',
            action: () => editor.chain().focus().setTextAlign('right').run(),
            isActive: () => editor.isActive({ textAlign: 'right' }),
        },
        {
            icon: List,
            title: 'Bullet List',
            action: () => editor.chain().focus().toggleBulletList().run(),
            isActive: () => editor.isActive('bulletList'),
        },
        {
            icon: ListOrdered,
            title: 'Ordered List',
            action: () => editor.chain().focus().toggleOrderedList().run(),
            isActive: () => editor.isActive('orderedList'),
        },
        {
            icon: CheckSquare,
            title: 'Task List',
            action: () => editor.chain().focus().toggleTaskList().run(),
            isActive: () => editor.isActive('taskList'),
        },
        {
            icon: Quote,
            title: 'Blockquote',
            action: () => editor.chain().focus().toggleBlockquote().run(),
            isActive: () => editor.isActive('blockquote'),
        },
        {
            icon: Code,
            title: 'Code Block',
            action: () => editor.chain().focus().toggleCodeBlock().run(),
            isActive: () => editor.isActive('codeBlock'),
        },
        {
            icon: Share2,
            title: 'Copy Share Link',
            action: copyShareLink,
            isActive: () => false,
        },
        {
            icon: Undo,
            title: 'Undo',
            action: () => editor.chain().focus().undo().run(),
            isActive: () => false,
        },
        {
            icon: Redo,
            title: 'Redo',
            action: () => editor.chain().focus().redo().run(),
            isActive: () => false,
        },
    ]

    return (
        <div className="floating-toolbar">
            {items.map((item, index) => (
                <button
                    key={index}
                    onClick={item.action}
                    className={`toolbar-btn ${item.isActive() ? 'active' : ''}`}
                    title={item.title}
                >
                    <item.icon size={18} />
                </button>
            ))}
        </div>
    )
}
