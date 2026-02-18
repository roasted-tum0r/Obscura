import { Route, Routes } from "react-router-dom"
import { MainEditor } from "./editor/Maineditor"

export const RoutePage = () => {
    return (
        <>
            <Routes location={location}>
                <Route path="/" element={<MainEditor />} />
            </Routes>
        </>
    )
}