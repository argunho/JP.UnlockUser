// Installed
import { LiveHelp, Logout, FactCheck, Settings, School, WorkHistory, ErrorOutline, BarChart, Home, MenuBook, UploadFile, Info, ForwardToInbox } from '@mui/icons-material';

export const Links = [
    { label: "Hem", url: "/search", icon: Home, access: false },
    { label: "Mina behörigheter", url: "/view/my/permissions", icon: FactCheck, access: false },
    { label: "Webapp-manual", url: "/web/manual", icon: MenuBook, access: true, blink: true },
    { label: "Informations artiklar", url: "/web/articles", icon: Info, access: false, blink: true },
    { label: "Behöriga användare", url: "/moderators", icon: Settings, access: true },
    { label: "Skolor/Utbildningsanstalt", url: "/catalog/schools", icon: School, access: true },
    { label: "Statistik", url: "/catalog/statistics", icon: BarChart, access: true },
    { label: "Historik", url: "/catalog/history", icon: WorkHistory, access: true },
    { label: "Loggfiler", url: "/catalog/errors", icon: ErrorOutline, access: true },
    { label: "Skicka mail", url: "/send/email", icon: ForwardToInbox, access: true },
    { label: "Google-tjänstkonto", url: "/service/configuration", icon: UploadFile, access: true },
    { label: "Kontakta support", url: "/contact", icon: LiveHelp, access: false },
    { label: "Logga ut", url: "/session/logout", icon: Logout, access: false }
];