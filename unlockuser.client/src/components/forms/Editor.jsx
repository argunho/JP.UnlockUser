import { useRef, useEffect, useState, useMemo } from 'react'; // 2026-10-25

// Installed
import { Box, InputLabel, Button, ToggleButtonGroup, Tooltip, ToggleButton, ClickAwayListener, Alert, LinearProgress } from '@mui/material'; // 2026-10-25
import {
    Clear, DeleteSweep, FormatAlignCenter, FormatAlignJustify, FormatAlignLeft, FormatAlignRight, FormatBold, FormatClear, Title, FormatSize,
    FormatItalic, FormatListBulleted, FormatListNumbered, ImageSearch, Image, Compare, FormatStrikethrough, FormatColorText, Square, FormatColorFill,
    FormatUnderlined, Link, ArrowDropDown, ArrowDropUp, Code, Undo, Redo, FontDownload, FontDownloadOff // 2026-11-11 14:01
} from '@mui/icons-material';
import axios from 'axios'; // 2026-10-25

// Components

// Functions
// start: 2026-10-25
import { TokenConfig } from '../../services/TokenConfig';
import { ErrorHandle } from '../../services/ErrorHandle';
// end

// Css
import './../../assets/css/editor.css';

const colorCodes = [
    "#FFFFFF",
    "#000000",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#00FFFF",
    "#FF00FF",
    "#808080",
    "#D3D3D3",
    "#FFA500",
    "#FFC0CB",
    "#800080",
    "#A52A2A",
    "#000080",
    "#008080",
    "#808000",
    "#800000",
    "#FF7F50"
];

const headings = ["h1", "h2", "h3", "h4", "h5", "h6"];
const numbers = Array.from({ length: 27 }, (_, i) => i + 4);
const sizes = [...numbers, ...[32, 36, 40, 44, 48, 52, 56, 60, 64, 68, 72, 76]];
// start: 2026-11-11 14:01
const standardFont = "Standard"; // Removes the inline font-family, the site font is used
const fonts = [standardFont, "Calibri", "Arial", "Segoe UI", "Verdana", "Tahoma", "Georgia", "Times New Roman", "Courier New"];
// end

const colorsTooltip = {
    secondary: "#9c27b0",
    primary: "#1976d2",
    info: "#0288d1",
    warning: "#ed6c02",
    error: "#d32f2f",
    success: "#2e7d32"
}

const buttons = [
    // start: 2026-11-11 13:50
    { cmd: "undo", icon: <Undo />, tip: "Ångra (Ctrl+Z)", skip: true },
    { cmd: "redo", icon: <Redo />, tip: "Gör om (Ctrl+Y)", skip: true },
    // end
    { cmd: "bold", key: "strong", icon: <FormatBold /> },
    { cmd: "italic", key: "em", icon: <FormatItalic /> },
    { cmd: "underline", key: "u", icon: <FormatUnderlined /> },
    { cmd: "strikethrough", key: "del", icon: <FormatStrikethrough /> },
    { cmd: "paragraph", key: "paragraph", icon: <Title />, tip: "h1,h2,h3,h4,h5,h6", models: headings, skip: true },
    { cmd: "fontSize", key: "formatSize", icon: <FormatSize />, tip: "Font size", models: sizes, skip: true },
    { cmd: "fontFamily", icon: <FontDownload />, tip: "Typsnitt (markerad text eller hela texten)", models: fonts, skip: true, fonts: true }, // 2026-11-11 14:01
    { cmd: "resetFontFamily", icon: <FontDownloadOff />, tip: "Standardtypsnitt (markerad text eller hela texten)", skip: true }, // 2026-11-11 14:01
    { cmd: "justifyLeft", icon: <FormatAlignLeft /> },
    { cmd: "justifyCenter", icon: <FormatAlignCenter /> },
    { cmd: "justifyRight", icon: <FormatAlignRight /> },
    { cmd: "justifyFull", icon: <FormatAlignJustify /> },
    { cmd: "insertOrderedList", key: "ol", icon: <FormatListNumbered /> },
    { cmd: "insertUnorderedList", key: "ul", icon: <FormatListBulleted /> },
    { cmd: "backColor", icon: <FormatColorFill color="primary" />, color: "primary", tip: "Bakgrundsfärg", models: colorCodes, skip: true, colors: true }, // 2026-10-25
    { cmd: "foreColor", icon: <FormatColorText color="secondary" />, color: "secondary", tip: "Textfärg", models: colorCodes, skip: true, colors: true }, // 2026-10-25
    { cmd: "image", icon: <Image color="info" />, color: "info", tip: "Bild 100% i bredd", width: "100%", }, // 2026-10-25
    { cmd: "image", icon: <Compare color="inherit" />, color: "inherit", tip: "Bild 50% i bredd", width: "50%" }, // 2026-10-25
    { cmd: "image", icon: <ImageSearch color="secondary" />, color: "secondary", tip: "Bild max 300px i bredd och zoombar", width: "300px" }, // 2026-10-25
    { cmd: "createLink", key: "a", icon: <Link color="success" />, color: "success", tip: "Länk" },
    { cmd: "clear", icon: <FormatClear color="inherit" />, color: "inherit", tip: "Rensa från formatering", skip: true },
    { cmd: "erase", icon: <Clear color="warning" />, color: "warning", tip: "Radera markerad text", skip: true },
    { cmd: "remove", icon: <DeleteSweep color="error" />, color: "error", tip: "Radera hela texten", skip: true }, // 2026-10-25
    { cmd: "html", icon: <Code color="inherit" />, color: "inherit", tip: "Visa/dölj HTML-kod", skip: true } // 2026-10-25
];

// start: 2026-10-25
const transmarkRegex = /<span id="transmark"[^>]*><\/span>/g;

// Elements that are allowed to be empty (void or media elements, table cells)
const keepEmptyTags = ["BR", "IMG", "HR", "VIDEO", "AUDIO", "SOURCE", "TD", "TH"];

// Elements that are never allowed in the saved html
const unsafeTags = "script, style, iframe, object, embed, link, meta, base";
const urlAttributes = ["href", "src", "xlink:href", "action", "formaction"];

function cleanHtml(html) {
    if (!html) return "";

    // Replace empty paragraphs with line breaks before parsing
    html = html.replaceAll("<div><p></p></div>", "<br/>").replaceAll("<p></p>", "<br/>");

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Remove unsafe elements
    doc.body.querySelectorAll(unsafeTags).forEach(el => el.remove());

    // Remove event handlers (onclick, onerror...) and javascript: urls
    doc.body.querySelectorAll('*').forEach(el => {
        [...el.attributes].forEach(attr => {
            const attrName = attr.name.toLowerCase();
            const attrValue = attr.value.replace(/\s/g, "").toLowerCase();

            if (attrName.startsWith("on") || (urlAttributes.includes(attrName) && attrValue.startsWith("javascript:")))
                el.removeAttribute(attr.name);
        });
    });

    // Remove empty divs, spans, etc. (children first, so emptied parents are removed too)
    [...doc.body.querySelectorAll('*')].reverse().forEach(el => {
        if (!keepEmptyTags.includes(el.tagName) && el.innerHTML.trim() === '')
            el.remove();
    });

    return doc.body.innerHTML;
}

const maxImageSize = 10 * 1024 * 1024; // Same limit as the server (api/images/editor)

// start: 2026-11-11 13:50
// Undo/redo history
const maxHistory = 100;
const historyMergeMs = 800; // Typing within this time is one undo step
const typingInputRegex = /^(insertText|insertCompositionText|deleteContent)/;

// Elements that end a line of text (used to find the line around the cursor)
const lineBreakTags = ["BR", "P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "LI", "UL", "OL", "BLOCKQUOTE", "TABLE", "HR"];
const headingBlockSelector = "p, div, h1, h2, h3, h4, h5, h6, li, blockquote";

function isLineBreak(node) {
    return node?.nodeType === 1 && lineBreakTags.includes(node.tagName);
}
// end

// start: 2026-11-11 13:57
const headingStyleProps = ["font-size", "font-weight", "font-family", "font-style", "line-height"];

// Remove inline font styles (e.g. from pasted text), so the h1-h6 size is used
function clearFontStyles(heading) {
    [heading, ...heading.querySelectorAll("[style]")].forEach(el => {
        headingStyleProps.forEach(prop => el.style.removeProperty(prop));
        if (!el.getAttribute("style")?.trim())
            el.removeAttribute("style");
    });
}
// end

// Line breaks after block elements, makes the html code readable
function formatHtml(html) {
    return (html ?? "").replace(/(<\/(p|div|h[1-6]|li|ul|ol|blockquote)>|<br\s*\/?>)(?!\n)/gi, "$1\n");
}
// end

function Editor({ label = "Text", name = "text", defaultValue, required, disabled: pending, onSave, onCancel, ref }) {

    const [value, setValue] = useState(defaultValue ?? "");
    const [colorCommand, setColorCommand] = useState(null);
    // const [formats, setFormats] = useState([]);
    const [openIndex, setOpenIndex] = useState(-1);
    const [imageWidth, setImageWidth] = useState(null)

    const refEditor = useRef(null);
    const refUpload = useRef();

    // start: 2026-10-25
    const [showHtml, setShowHtml] = useState(false);
    const [htmlSource, setHtmlSource] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);

    // Cursor position before the file dialog opens, the image is inserted there after upload
    const refRange = useRef(null);

    // start: 2026-11-11 13:50
    // Snapshots of the editor html for undo/redo (programmatic DOM changes break the browser's own undo)
    const refHistory = useRef({ stack: [defaultValue ?? ""], index: 0, time: 0 });
    // end

    const cleanValue = useMemo(() => cleanHtml(value), [value]);

    useEffect(() => {
        if (defaultValue) {
            refEditor.current.innerHTML = defaultValue;
            setValue(defaultValue);
            refHistory.current = { stack: [defaultValue], index: 0, time: 0 }; // 2026-11-11 13:50
        }
    }, [defaultValue])

    // Keep the state in sync with the editor after programmatic DOM changes (they don't fire onInput)
    function syncValue(merge = false) { // 2026-11-11 13:50
        const htmlValue = refEditor.current?.innerHTML?.replaceAll(transmarkRegex, "") ?? "";
        setValue(htmlValue === "<br/>" || htmlValue === "<br>" ? "" : htmlValue);
        recordHistory(refEditor.current?.innerHTML ?? "", merge); // 2026-11-11 13:50
    }

    // start: 2026-11-11 13:50
    // Save a snapshot, typing in a row is merged into one step
    function recordHistory(html, merge) {
        const history = refHistory.current;
        if (history.stack[history.index] === html)
            return;

        const now = Date.now();
        history.stack = history.stack.slice(0, history.index + 1); // A new change removes the redo steps

        if (merge && history.index > 0 && now - history.time < historyMergeMs)
            history.stack[history.index] = html;
        else {
            history.stack.push(html);
            if (history.stack.length > maxHistory)
                history.stack.shift();
            history.index = history.stack.length - 1;
        }

        history.time = merge ? now : 0;
    }

    // step: -1 = undo, 1 = redo
    function restoreHistory(step) {
        const history = refHistory.current;
        const index = history.index + step;
        if (index < 0 || index >= history.stack.length || !refEditor.current)
            return;

        history.index = index;
        history.time = 0;

        const html = history.stack[index];
        refEditor.current.innerHTML = html;
        setValue(html === "<br/>" || html === "<br>" ? "" : html.replaceAll(transmarkRegex, ""));
        placeCaret(refEditor.current);
    }

    // Put the cursor at the end of the element
    function placeCaret(element) {
        const selection = window.getSelection();
        if (!selection || !element) return;

        const range = document.createRange();
        range.selectNodeContents(element);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    }

    // Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z use the editor history instead of the browser undo
    function onKeyDown(e) {
        if (!(e.ctrlKey || e.metaKey))
            return;

        const key = e.key?.toLowerCase();
        if (key === "z" && !e.shiftKey) {
            e.preventDefault();
            restoreHistory(-1);
        } else if (key === "y" || (key === "z" && e.shiftKey)) {
            e.preventDefault();
            restoreHistory(1);
        }
    }

    // Change the block around the cursor to a heading (h1-h6), the same heading again turns it back to a paragraph.
    // execCommand("formatBlock") did not work reliably here, so the DOM is changed directly.
    // start: 2026-11-11 13:59
    // Remove the inline font-family (e.g. from pasted text) so the standard font is used.
    // Selected text: only the selection (and its parent elements), nothing selected: the whole text.
    // start: 2026-11-11 14:01
    // Set the font-family on the selected text, nothing selected: on the whole text
    function applyFontFamily(font) {
        if (font === standardFont) {
            resetFontFamily();
            return;
        }

        const editor = refEditor.current;
        const selection = window.getSelection();
        if (!editor || !selection)
            return;

        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        const hasSelection = range && !range.collapsed && editor.contains(range.commonAncestorContainer);

        // Nothing selected -> select the whole text
        if (!hasSelection) {
            const allRange = document.createRange();
            allRange.selectNodeContents(editor);
            selection.removeAllRanges();
            selection.addRange(allRange);
        }

        document.execCommand("fontName", false, font);

        // execCommand creates <font face="...">, use css instead (the face attribute is obsolete).
        // The <font> element is kept, it can also have a color from the text color button.
        // "!important" is needed: index.css sets font-family with !important on div, p, span, h1-h6, li...
        editor.querySelectorAll("font[face]").forEach(el => {
            const face = el.getAttribute("face");
            el.removeAttribute("face");
            el.style.setProperty("font-family", face, "important");

            // Inner elements (span, p...) would get the site font from index.css or their own pasted font
            if (face === font)
                el.querySelectorAll("*").forEach(child => child.style?.setProperty("font-family", "inherit", "important"));
        });

        if (!hasSelection)
            placeCaret(editor);

        syncValue();
    }
    // end

    function resetFontFamily() {
        const editor = refEditor.current;
        if (!editor)
            return;

        const selection = window.getSelection();
        const range = selection?.rangeCount > 0 ? selection.getRangeAt(0) : null;
        const hasSelection = range && !range.collapsed && editor.contains(range.commonAncestorContainer);

        let elements = [...editor.querySelectorAll("*")];
        if (hasSelection) {
            elements = elements.filter(el => range.intersectsNode(el));

            // Parent elements around the selection can also have a font-family
            let parent = range.commonAncestorContainer;
            if (parent.nodeType === 3)
                parent = parent.parentElement;
            while (parent && parent !== editor) {
                elements.push(parent);
                parent = parent.parentElement;
            }
        }

        elements.forEach(el => {
            el.style?.removeProperty("font-family");
            if (el.hasAttribute("style") && !el.getAttribute("style").trim())
                el.removeAttribute("style");
            if (el.tagName === "FONT")
                el.removeAttribute("face");
        });

        syncValue();
    }
    // end

    function applyHeading(tag) {
        const editor = refEditor.current;
        const selection = window.getSelection();
        if (!editor || !selection || selection.rangeCount === 0)
            return;

        const range = selection.getRangeAt(0);
        if (!editor.contains(range.commonAncestorContainer))
            return;

        let node = range.startContainer;
        if (node.nodeType === 3)
            node = node.parentElement;

        const block = node?.closest(headingBlockSelector);
        let heading;

        if (block && block !== editor && editor.contains(block) && block.tagName !== "LI") {
            // Replace the block tag, keep its attributes (alignment etc.) and content
            heading = document.createElement(block.tagName.toLowerCase() === tag ? "p" : tag);
            [...block.attributes].forEach(attr => heading.setAttribute(attr.name, attr.value));
            heading.append(...block.childNodes);
            block.replaceWith(heading);
        } else if (!range.collapsed) {
            // Selected text directly in the editor (or in a list item)
            heading = document.createElement(tag);
            heading.append(range.extractContents());
            range.insertNode(heading);
        } else {
            // Cursor directly in the editor (or in a list item), wrap the whole line around the cursor
            heading = document.createElement(tag);
            const parent = block?.tagName === "LI" ? block : editor;

            let top = range.startContainer === parent
                ? (parent.childNodes[range.startOffset] ?? parent.lastChild)
                : range.startContainer;
            while (top && top.parentNode !== parent)
                top = top.parentNode;

            if (!top || isLineBreak(top)) {
                heading.append(document.createElement("br"));
                if (top) parent.insertBefore(heading, top);
                else parent.append(heading);
            } else {
                let first = top, last = top;
                while (first.previousSibling && !isLineBreak(first.previousSibling))
                    first = first.previousSibling;
                while (last.nextSibling && !isLineBreak(last.nextSibling))
                    last = last.nextSibling;

                parent.insertBefore(heading, first);
                let current = first;
                while (current) {
                    const next = current === last ? null : current.nextSibling;
                    heading.append(current);
                    current = next;
                }

                // The heading is a block, the line break after it is not needed
                if (heading.nextSibling?.nodeName === "BR")
                    heading.nextSibling.remove();
            }
        }

        clearFontStyles(heading); // 2026-11-11 13:57
        placeCaret(heading);
        syncValue();
    }
    // end

    // Switch between the visual editor and the html code
    function toggleHtml() {
        if (!showHtml) {
            setHtmlSource(formatHtml(refEditor.current?.innerHTML?.replaceAll(transmarkRegex, "")));
            setShowHtml(true);
            return;
        }

        applyHtmlSource();
        setShowHtml(false);
    }

    function applyHtmlSource() {
        refEditor.current.innerHTML = cleanHtml(htmlSource);
        syncValue();
    }

    function onHtmlSourceChange(e) {
        setHtmlSource(e.target.value);
        setValue(e.target.value);
    }

    function saveItem() {
        if (showHtml) {
            applyHtmlSource();
            setShowHtml(false);
        }

        const htmlValue = refEditor.current?.innerHTML?.replaceAll(transmarkRegex, "");
        if (htmlValue == null || htmlValue?.length === 0)
            return;

        refEditor.current.innerHTML = "";
        onSave?.(cleanHtml(htmlValue));
        setValue("");
        refHistory.current = { stack: [""], index: 0, time: 0 }; // 2026-11-11 13:50
    }

    function onChange(e) { // 2026-11-11 13:50
        syncValue(typingInputRegex.test(e?.nativeEvent?.inputType ?? "")); // 2026-11-11 13:50
    }

    function onPaste(e) {
        e.preventDefault();

        const html = e.clipboardData.getData("text/html");

        // Insert sanitized HTML into cursor position, plain text is inserted as text
        if (html)
            document.execCommand("insertHTML", false, cleanHtml(html));
        else
            document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
        // end

        // setTimeout(() => {
        //     renderHtmlFromText();
        // }, 100);
    }

    // function renderHtmlFromText() {
    //     const editor = refEditor.current;
    //     if (!editor) return;

    //     const text = editor.innerText; // IMPORTANT: innerText, not innerHTML
    //     editor.innerHTML = text;        // ← THIS converts text → UI
    // }


    // Action buttons handle
    function handleChange(key) {

        let selection = window.getSelection();
        const str = (!selection || selection.rangeCount === 0) ? null : selection?.toString();


        // helper: use font size in px using execCommand + postprocess
        const applyFontSizePx = (px) => {

            if (!selection || !str) return;

            // Temporarily use fontSize (1–7), selecting the closest value (1–7) based on px.
            const mapPxToHtmlSize = (pxVal) => {
                if (pxVal <= 10) return 1;
                if (pxVal <= 13) return 2;
                if (pxVal <= 16) return 3;
                if (pxVal <= 18) return 4;
                if (pxVal <= 24) return 5;
                if (pxVal <= 32) return 6;
                return 7;
            };

            const htmlSize = mapPxToHtmlSize(px);
            document.execCommand("fontSize", false, String(htmlSize));

            // 2) Change <font size="X"> to <span style="font-size: ...px">
            const editor = refEditor.current;
            if (!editor) return;

            // Only consider <font> elements created by the fontSize command.
            const fonts = editor.querySelectorAll(`font[size="${htmlSize}"]`);
            fonts.forEach((fontEl) => {
                const span = document.createElement("span");
                span.style.fontSize = `${px}px`;
                span.innerHTML = fontEl.innerHTML; // Save included formats
                fontEl.replaceWith(span);
            });

            syncValue(); // 2026-10-25
        };


        function alignSelection(alignment) {
            if (!str) return false;

            const range = selection.getRangeAt(0);
            let el = range.startContainer;

            // start: 2026-10-25
            // Ignore selections outside the editor
            const editor = refEditor.current;
            if (!editor || !editor.contains(range.commonAncestorContainer)) return true;
            // end

            // Move up to element node
            if (el.nodeType === 3) el = el.parentElement;

            // Find closest block
            let block = el.closest("p, div, h1, h2, h3, h4, h5, h6, li");

            // start: 2026-10-25
            // The editor itself is not a block of the content (its style is not saved), let execCommand wrap the text instead
            if (block && block !== editor && editor.contains(block)) {
                block.style.textAlign = alignment;
                block.style.width = "100%";
                syncValue();
                return true;
            }
            // end

            return false;
        }

        switch (true) {
            case ["justifyLeft", "justifyCenter", "justifyRight", "justifyFull"].includes(key):
                if (!alignSelection(key.replace("justify", "").toLowerCase())) {
                    document.execCommand(key);
                }
                // refEditor.current.style.textAlign = key;
                break;
            case key === "createLink":
                if (str) {
                    // start: 2026-10-25
                    const url = prompt("Skriv din länk här: ", "https://")?.trim();
                    if (url && /^(https?:|mailto:|tel:)/i.test(url))
                        document.execCommand(key, false, url);
                    // end
                }
                break;
            case sizes.includes(key):
                if (key) applyFontSizePx(Number(key))
                break;
            case colorCodes.includes(key):
                document.execCommand(colorCommand, false, key);
                break;
            case key === "image":
                // start: 2026-10-25
                refRange.current = (selection?.rangeCount > 0 && refEditor.current?.contains(selection.getRangeAt(0).commonAncestorContainer))
                    ? selection.getRangeAt(0).cloneRange()
                    : null;
                // end
                refUpload?.current?.click();
                break;
            case key === "html":
                toggleHtml(); // 2026-10-25
                break;
            case headings.includes(key):
                applyHeading(key); // 2026-11-11 13:50
                break;
            // start: 2026-11-11 13:50
            case key === "undo":
                restoreHistory(-1);
                break;
            case key === "redo":
                restoreHistory(1);
                break;
            // start: 2026-11-11 14:01
            case fonts.includes(key):
                applyFontFamily(key);
                break;
            case key === "resetFontFamily":
                resetFontFamily();
                break;
            // end
            // end
            case key === "erase":
                if (str?.length > 0)
                    selection.deleteFromDocument();
                break;
            case key === "remove":
                refEditor.current.innerHTML = "";
                syncValue(); // 2026-11-11 13:50 - also saves an undo step
                if (defaultValue && onCancel)
                    onCancel();
                // setFormats([]);
                break;
            case key === "clear":
                // start: 2026-10-25
                // innerText setter keeps the text as text (no html parsing) and turns line breaks into <br>
                refEditor.current.innerText = refEditor.current.innerText;
                syncValue();
                // end
                break;
            default:
                document.execCommand(key, false, null);
                break;
        }
    }

    function onFileChange(ev) {
        ev.preventDefault();

        if (!ev.target.files || ev.target.files?.length === 0)
            return;

        const file = ev.target.files[0];
        ev.target.value = ""; // 2026-10-25 - allows choosing the same file again
        // start: 2026-10-25
        if (file)
            uploadImage(file, imageWidth);
    }

    // Upload the image to the server and insert it by url (instead of base64 in the html)
    async function uploadImage(file, width) {
        setUploadError(null);

        if (file.size > maxImageSize) {
            setUploadError("Bilden är för stor (max 10 MB).");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        setUploading(true);
        try {
            const res = await axios.post("api/images/editor", formData, TokenConfig());
            const url = res?.data?.url ?? res?.data?.Url;
            if (!url)
                throw new Error("Servern returnerade ingen bildlänk.");

            // 300px images are zoomable (see .zoomable-img-wrap in editor.css), others take the chosen width
            const imgTag = width === "300px"
                ? `<div class="zoomable-img-wrap" style="max-width:${width}">
                                    <img src="${url}" width="100%" style="display:block;" tabindex="0"/></div>`
                : `<img src="${url}" style="width:${width};max-width:100%;display:block;object-fit:contain;margin:8px 0;" />`;

            insertHtmlAtSavedRange(imgTag);
        } catch (error) {
            // BadRequest("...") from the server is a plain string, ErrorHandle expects validation errors for 400
            const data = error?.response?.data;
            let res = (typeof data === "string" && data) ? data : null;
            try { res ??= ErrorHandle(error); } catch { /* keep default message */ }
            setUploadError(res?.msg ?? (typeof res === "string" ? res : "Bilden kunde inte laddas upp."));
        } finally {
            setUploading(false);
        }
    }

    // Restore the cursor position saved before the file dialog (or the end of the text) and insert html there
    function insertHtmlAtSavedRange(html) {
        const editor = refEditor.current;
        if (!editor) return;

        editor.focus();
        const selection = window.getSelection();
        let range = refRange.current;

        if (!range || !editor.contains(range.commonAncestorContainer)) {
            range = document.createRange();
            range.selectNodeContents(editor);
            range.collapse(false);
        }

        selection.removeAllRanges();
        selection.addRange(range);
        refRange.current = null;

        document.execCommand("insertHTML", false, html);
        syncValue();
    }
    // end

    function handleAction(item, index) {
        refEditor.current?.focus();

        if (item?.models) {
            if (item?.colors)
                setColorCommand(item?.cmd)
            setOpenIndex(openIndex == index ? -1 : index);
        }
        else {
            if (item?.width)
                setImageWidth(item?.width);
            handleChange(item?.cmd);
        }
    }

    // function onFormatsChange(ev, values) {
    //     handleClickAway();
    //     if (values[values.length - 1] === undefined)
    //         return;

    //     setFormats(values);
    // }

    function handleClickAway() {
        if (openIndex === -1)
            return;

        setOpenIndex(-1);
    }


    return (
        <>
            <div className="w-100 editor-container" ref={ref}>
                <InputLabel className='editor-label' required={required}>{label ?? "TextEditor"}</InputLabel>

                <Box className='w-100 editor-box'>
                    <ClickAwayListener onClickAway={handleClickAway}>
                        {/* Tools */}
                        <div className='d-row ai-start editor-tools-panel w-100'>
                            <ToggleButtonGroup
                                // value={formats}
                                // onChange={onFormatsChange}
                                aria-label="text formatting"
                            >
                                {/* Loop buttons */}
                                {buttons.map((item, index) => {
                                    return <Tooltip key={index} title={item?.tip ?? ""}
                                        classes={{
                                            tooltip: "tooltip-default",
                                        }}
                                        PopperProps={{
                                            sx: {
                                                '& .MuiTooltip-tooltip': {
                                                    backgroundColor: colorsTooltip[item?.color]
                                                },
                                                '& .MuiTooltip-arrow': {
                                                    color: colorsTooltip[item?.color]
                                                }
                                            }
                                        }}
                                        placement="right"
                                        disableHoverListener={!item?.tip}
                                        enterDelay={1000}
                                        leaveDelay={0}
                                        arrow>
                                        <ToggleButton
                                            value={index} // 2026-10-25
                                            selected={item?.cmd === "html" && showHtml} // 2026-10-25
                                            disabled={(showHtml && item?.cmd !== "html") || (uploading && item?.cmd === "image")} // 2026-10-25
                                            aria-label={item?.cmd}
                                            onMouseDown={(e) => e.preventDefault()} // 2026-11-11 13:50 - keeps the focus and the selection in the editor
                                            style={{ position: "relative" }}
                                            onClick={() => handleAction(item, index)}>
                                            {item?.icon}
                                            {item?.models && <>
                                                {openIndex === index ? <ArrowDropUp /> : <ArrowDropDown />}
                                                {openIndex === index && <div className={`d-column jc-start editor-dropdown${item?.fonts ? " editor-dropdown-fonts" : ""}`} /* 2026-11-11 14:01 */>
                                                    {item?.models?.map((m) => (
                                                        <Button
                                                            component="div" // 2026-10-25 - avoids <button> inside <button>
                                                            key={m}
                                                            value={m}
                                                            aria-label={m}
                                                            className="w-100"
                                                            onClick={() => handleChange(m)}>
                                                            {/* start: 2026-11-11 14:01 */}
                                                            {item?.colors
                                                                ? <Square style={{ color: m }} />
                                                                : item?.fonts
                                                                    ? <span ref={el => m !== standardFont && el?.style.setProperty("font-family", `'${m}'`, "important")}>{m}</span>
                                                                    : m}
                                                            {/* end */}
                                                        </Button>

                                                    ))}
                                                </div>}
                                            </>}
                                        </ToggleButton>
                                    </Tooltip>
                                })}
                            </ToggleButtonGroup>
                        </div>
                    </ClickAwayListener>

                    {/* start: 2026-10-25 */}
                    {uploading && <LinearProgress />}
                    {uploadError && <Alert severity="error" onClose={() => setUploadError(null)}>{uploadError}</Alert>}
                    {/* end */}

                    {/* Editor */}
                    <div className="editor-wrapper">
                        {/* start: 2026-10-25 */}
                        {/* Html code */}
                        {showHtml && <textarea
                            className="w-100 editor-textarea editor-html-source"
                            value={htmlSource}
                            onChange={onHtmlSourceChange}
                            disabled={pending}
                            spellCheck={false}
                            aria-label="HTML-kod"
                        />}
                        {/* end */}

                        {/* Textarea */}
                        <div
                            hidden={showHtml} // 2026-10-25 - stays mounted, keeps the content while the html code is shown
                            ref={refEditor}
                            role="textbox"
                            aria-multiline="true"
                            contentEditable={!pending}
                            data-placeholder="Börja skriva..." // 2026-10-25
                            suppressContentEditableWarning={!pending}
                            className='w-100 editor-textarea'
                            onInput={onChange}
                            onPaste={onPaste}
                            onKeyDown={onKeyDown} // 2026-11-11 13:50
                        >
                        </div>

                        {/* Save button */}
                        {!!onSave && <div className="d-row jc-end w-100 button-wrapper">
                            <Button variant={value?.length > 0 ? "contained" : "outlined"}
                                onClick={saveItem}
                                disabled={value?.length === 0}
                                key={value?.length}>
                                Spara {label}
                            </Button>

                        </div>}
                    </div>
                </Box>
            </div>


            {/* Hidden */}
            {!onSave && <input type="hidden" name={name} value={cleanValue} /* 2026-10-25 */ />}

            {/* Image input */}
            <input type="file" accept="image/*" name="file" onChange={onFileChange} className="none" ref={refUpload} />
        </>
    )
}

export default Editor;