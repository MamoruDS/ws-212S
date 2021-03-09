namespace Scriptable {
    export interface Color {
        readonly hex: string
        readonly red: number
        readonly green: number
        readonly blue: number
        readonly alpha: number
        new (hex: string, alpha: number): Color
        dynamic(lightColor: Color, darkColor: Color): Color
    }
    export interface FileManager {
        local(): FileManager
        libraryDirectory(): string
        readString(path: string): string
        writeString(path: string, content: string): string
    }
    export interface Request {
        new (url: string): Request
        loadString(): Promise<string>
    }
    export interface Safari {
        open(url: string): void
    }
    export interface UITable {
        showSeparators: boolean
        new (): UITable
        addRow(row: UITableRow): void
        removeRow(row: UITableRow): void
        removeAllRows(): void
        reload(): void
        present(fullscreen?: boolean): void
    }
    export interface UITableCell {
        new (): UITableCell
    }
    export interface UITableRow {
        callSpacing: number
        height: number
        isHeader: boolean
        dismissOnSelect: boolean
        backgroundColor: Color
        onSelect: (num: number) => void
        new (): UITableRow
        addText(title: string, subtitle?: string): UITableCell
    }
}

declare global {
    const Safari: Scriptable.Safari
    const FileManager: Scriptable.FileManager
    const Request: Scriptable.Request
    const UITable: Scriptable.UITable
    const UITableRow: Scriptable.UITableRow
    const log: (msg: string) => void
}

export {}