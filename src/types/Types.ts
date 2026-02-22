export interface INoteAppSettings {
    v: number,
    mode: "open" | "protected",
    accesibility: "editable" | "read-only",
    fileName: string,
    d: string
    iv: string,
    s: string
}