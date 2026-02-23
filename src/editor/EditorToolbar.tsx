import { Editor } from '@tiptap/react'
import React from 'react'
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
    AlignRight,
    Table as TableIcon,
    Plus,
    Trash2,
    ChevronRight,
    Type,
    Divide,
    Heading as HeadingIcon,
    Subscript as SubscriptIcon,
    Superscript as SuperscriptIcon,
    Palette,
    Image as ImageIcon,
    FileCode,
    Menu,
    X,
    Unlock,
    Shield, Loader2, Lock
} from 'lucide-react'

interface EditorToolbarProps {
    editor: Editor | null
    filename: string
    setFilename: (name: string) => void
    isProtected: boolean
    onToggleSecurity: (newState: "open" | "protected") => void
    isSaving: boolean;
    loading: boolean;
    isPasswordProtected: boolean;
    timeLeft: number;
    onToggleLock: () => void;
    count: { words: number; chars: number };
}

const useIsMobile = () => {
    const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768)
    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])
    return isMobile
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
    editor,
    filename,
    setFilename,
    isProtected,
    onToggleSecurity,
    isSaving,
    loading,
    isPasswordProtected,
    timeLeft,
    onToggleLock,
    count
}) => {
    const [isOpen, setIsOpen] = React.useState(true)
    const [activeGroup, setActiveGroup] = React.useState<string | null>(null)
    const [hoveredGrid, setHoveredGrid] = React.useState({ r: 0, c: 0 })
    const isMobile = useIsMobile()

    if (!editor) return null

    const SecuritySlider = () => (
        <div className="security-hud-wrapper">
            <div 
                className="security-slider-container" 
                data-state={isProtected ? "protected" : "open"}
                onClick={() => onToggleSecurity(isProtected ? "open" : "protected")}
                title={isProtected ? "Protected: Click to remove protection" : "Open: Click to protect file"}
            >
                <div className="security-slider-knob" />
                <div className="security-slider-track">
                    <Unlock className="security-slider-icon open" size={14} />
                    <Shield className="security-slider-icon protected" size={14} />
                </div>
            </div>

            <div className="security-status-indicator">
                {isSaving || loading ? (
                    <div className="status-badge saving">
                        <Loader2 size={14} className="animate-spin" />
                        {!isMobile && <span>Syncing</span>}
                    </div>
                ) : isPasswordProtected ? (
                    <div 
                        className={`status-badge protected ${timeLeft < 10 && timeLeft > 0 ? 'urgent' : ''}`}
                        onClick={onToggleLock}
                        title="File Protected. Click to lock now."
                    >
                        <Lock size={14} />
                        {timeLeft > 0 && <span className="timer-text">{timeLeft}s</span>}
                    </div>
                ) : (
                    <div 
                        className="status-badge open" 
                        onClick={onToggleLock}
                        title="File Open. Click to setup protection."
                    >
                        <Unlock size={14} style={{ opacity: 0.5 }} />
                    </div>
                )}
            </div>
            
            {!isMobile && (
                <div className="toolbar-stats">
                    <span className="stat"><span className="val">{count.words}</span> words</span>
                    <span className="stat"><span className="val">{count.chars}</span> chars</span>
                </div>
            )}
        </div>
    )

    const insertTable = (rows: number, cols: number) => {
        editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
        setActiveGroup(null)
    }

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

    const addImage = () => {
        const url = window.prompt('Image URL')
        if (url) {
            editor.chain().focus().setImage({ src: url }).run()
        }
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
            icon: Type,
            title: 'Typography & Layout',
            isGroup: true,
            id: 'alignment',
            children: [
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
                    icon: SubscriptIcon,
                    title: 'Subscript',
                    action: () => editor.chain().focus().toggleSubscript().run(),
                    isActive: () => editor.isActive('subscript'),
                },
                {
                    icon: SuperscriptIcon,
                    title: 'Superscript',
                    action: () => editor.chain().focus().toggleSuperscript().run(),
                    isActive: () => editor.isActive('superscript'),
                },
            ]
        },
        {
            icon: Palette,
            title: 'Text Color',
            action: () => {
                const color = window.prompt('Hex Color (e.g. #ff0000)')
                if (color) editor.chain().focus().setColor(color).run()
            },
            isActive: () => !!editor.getAttributes('textStyle').color,
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
            icon: TableIcon,
            title: 'Table Actions',
            isGroup: true,
            id: 'table',
            children: [
                {
                    isTableGrid: true,
                },
                {
                    icon: TableIcon,
                    title: 'Add Row Above',
                    action: () => editor.chain().focus().addRowBefore().run(),
                    isActive: () => false,
                },
                {
                    icon: TableIcon,
                    title: 'Add Row Below',
                    action: () => editor.chain().focus().addRowAfter().run(),
                    isActive: () => false,
                },
                {
                    icon: TableIcon,
                    title: 'Add Column Before',
                    action: () => editor.chain().focus().addColumnBefore().run(),
                    isActive: () => false,
                },
                {
                    icon: TableIcon,
                    title: 'Add Column After',
                    action: () => editor.chain().focus().addColumnAfter().run(),
                    isActive: () => false,
                },
                {
                    icon: Divide,
                    title: 'Merge/Split Cells',
                    action: () => editor.chain().focus().mergeOrSplit().run(),
                    isActive: () => false,
                },
                {
                    icon: HeadingIcon,
                    title: 'Toggle Header',
                    action: () => editor.chain().focus().toggleHeaderCell().run(),
                    isActive: () => false,
                },
                {
                    icon: Trash2,
                    title: 'Delete Table',
                    action: () => editor.chain().focus().deleteTable().run(),
                    isActive: () => false,
                },
            ]
        },
        {
            icon: Plus,
            title: 'Insert Media',
            isGroup: true,
            id: 'insert',
            children: [
                {
                    icon: ImageIcon,
                    title: 'Insert Image',
                    action: addImage,
                    isActive: () => false,
                },
                {
                    icon: Code,
                    title: 'Code Block',
                    action: () => editor.chain().focus().toggleCodeBlock().run(),
                    isActive: () => editor.isActive('codeBlock'),
                },
                {
                    icon: FileCode,
                    title: 'Pre-formatted',
                    action: () => editor.chain().focus().setHeading({ level: 1 }).run(),
                    isActive: () => false,
                },
            ]
        },
        {
            icon: LinkIcon,
            title: 'Link',
            action: setLink,
            isActive: () => editor.isActive('link'),
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
        <>
            <button
                className={`toolbar-burger glass ${isOpen ? 'active' : ''}`}
                onClick={() => {
                    if (isOpen) setActiveGroup(null)
                    setIsOpen(!isOpen)
                }}
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div
                className={`floating-toolbar ${isOpen ? 'toolbar-open' : ''}`}
                data-layout={isMobile ? "mobile" : "desktop"}
                onMouseLeave={() => setHoveredGrid({ r: 0, c: 0 })}
            >
                {isMobile ? (
                    <>
                        <div className="security-bubble glass">
                            <SecuritySlider />
                        </div>
                        <div className="toolbar-bubble glass">
                            <div className="toolbar-scroll-container">
                                {items.map((item, index) => (
                                    <ToolbarItem
                                        key={index}
                                        item={item}
                                        activeGroup={activeGroup}
                                        setActiveGroup={setActiveGroup}
                                        isOpen={isOpen}
                                        hoveredGrid={hoveredGrid}
                                        setHoveredGrid={setHoveredGrid}
                                        insertTable={insertTable}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="filename-bubble glass">
                            <div className="toolbar-filename">
                                <input
                                    value={filename}
                                    onChange={(e) => setFilename(e.target.value)}
                                    placeholder="Untitled"
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="security-bubble glass">
                            <SecuritySlider />
                        </div>
                        <div className="filename-bubble glass">
                            <div className="toolbar-filename">
                                <input
                                    value={filename}
                                    onChange={(e) => setFilename(e.target.value)}
                                    placeholder="Untitled"
                                />
                            </div>
                        </div>
                        <div className="toolbar-bubble glass">
                            <div className="toolbar-scroll-container">
                                {items.map((item, index) => (
                                    <ToolbarItem
                                        key={index}
                                        item={item}
                                        activeGroup={activeGroup}
                                        setActiveGroup={setActiveGroup}
                                        isOpen={isOpen}
                                        hoveredGrid={hoveredGrid}
                                        setHoveredGrid={setHoveredGrid}
                                        insertTable={insertTable}
                                    />
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    )
}

interface ToolbarItemProps {
    item: any
    activeGroup: string | null
    setActiveGroup: (id: string | null) => void
    isOpen: boolean
    hoveredGrid: { r: number; c: number }
    setHoveredGrid: (grid: { r: number; c: number }) => void
    insertTable: (r: number, c: number) => void
}

const ToolbarItem: React.FC<ToolbarItemProps> = ({
    item,
    activeGroup,
    setActiveGroup,
    isOpen,
    hoveredGrid,
    setHoveredGrid,
    insertTable
}) => {
    if ('isGroup' in item && item.isGroup) {
        const CurrentIcon = item.icon
        return (
            <div
                className={`toolbar-group ${activeGroup === item.id ? 'active' : ''}`}
                onMouseEnter={() => !isOpen && setActiveGroup(item.id!)}
                onMouseLeave={() => !isOpen && setActiveGroup(null)}
            >
                <button
                    className={`toolbar-btn ${activeGroup === item.id ? 'active' : ''}`}
                    title={item.title}
                    onClick={(e) => {
                        e.stopPropagation()
                        setActiveGroup(activeGroup === item.id ? null : item.id!)
                    }}
                >
                    <CurrentIcon size={18} />
                    <ChevronRight size={10} className="absolute bottom-1 right-1 opacity-40" />
                </button>
                <div className="toolbar-submenu shadow-xl">
                    {item.children?.map((child: any, cIdx: number) => {
                        if (child.isTableGrid) {
                            return (
                                <div key={cIdx} className="table-picker-container">
                                    <div className="table-picker-label">
                                        {hoveredGrid.r > 0 ? `${hoveredGrid.r} x ${hoveredGrid.c}` : 'Insert Table'}
                                    </div>
                                    <div className="table-picker-grid">
                                        {Array.from({ length: 100 }).map((_, i) => {
                                            const r = Math.floor(i / 10) + 1
                                            const c = (i % 10) + 1
                                            const isSelected = r <= hoveredGrid.r && c <= hoveredGrid.c
                                            return (
                                                <div
                                                    key={i}
                                                    className={`table-picker-cell ${isSelected ? 'selected' : ''}`}
                                                    onMouseEnter={() => setHoveredGrid({ r, c })}
                                                    onClick={() => insertTable(r, c)}
                                                />
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        }
                        return (
                            <button
                                key={cIdx}
                                onClick={() => {
                                    child.action()
                                    setActiveGroup(null)
                                }}
                                className={`submenu-btn ${child.isActive() ? 'active' : ''}`}
                                title={child.title}
                            >
                                <child.icon size={16} />
                                <span>{child.title}</span>
                            </button>
                        )
                    })}
                </div>
            </div>
        )
    }

    const ItemIcon = item.icon
    return (
        <button
            onClick={item.action}
            className={`toolbar-btn ${item.isActive() ? 'active' : ''}`}
            title={item.title}
        >
            <ItemIcon size={18} />
        </button>
    )
}
