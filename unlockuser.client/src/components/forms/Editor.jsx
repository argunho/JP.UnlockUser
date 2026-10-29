import { useRef, useEffect, useState, useMemo } from 'react'; // 2026-10-25

// Installed
import { Box, InputLabel, Button, ToggleButtonGroup, Tooltip, ToggleButton, ClickAwayListener, Alert, LinearProgress } from '@mui/material'; // 2026-10-25
import {
    Clear, DeleteSweep, FormatAlignCenter, FormatAlignJustify, FormatAlignLeft, FormatAlignRight, FormatBold, FormatClear, Title, FormatSize,
    FormatItalic, FormatListBulleted, FormatListNumbered, ImageSearch, Image, Compare, FormatStrikethrough, FormatColorText, Square, FormatColorFill,
    FormatUnderlined, Link, ArrowDropDown, ArrowDropUp, Code // 2026-10-25
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

const colorsTooltip = {
    secondary: "#9c27b0",
    primary: "#1976d2",
    info: "#0288d1",
    warning: "#ed6c02",
    error: "#d32f2f",
    success: "#2e7d32"
}

const buttons = [
    { cmd: "bold", key: "strong", icon: <FormatBold /> },
    { cmd: "italic", key: "em", icon: <FormatItalic /> },
    { cmd: "underline", key: "u", icon: <FormatUnderlined /> },
    { cmd: "strikethrough", key: "del", icon: <FormatStrikethrough /> },
    { cmd: "paragraph", key: "paragraph", icon: <Title />, tip: "h1,h2,h3,h4,h5,h6", models: headings, skip: true },
    { cmd: "fontSize", key: "formatSize", icon: <FormatSize />, tip: "Font size", models: sizes, skip: true },
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

    const cleanValue = useMemo(() => cleanHtml(value), [value]);

    useEffect(() => {
        if (defaultValue) {
            refEditor.current.innerHTML = defaultValue;
            setValue(defaultValue);
        }
    }, [defaultValue])

    // Keep the state in sync with the editor after programmatic DOM changes (they don't fire onInput)
    function syncValue() {
        const htmlValue = refEditor.current?.innerHTML?.replaceAll(transmarkRegex, "") ?? "";
        setValue(htmlValue === "<br/>" || htmlValue === "<br>" ? "" : htmlValue);
    }

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
    }

    function onChange() {
        syncValue();
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
                document.execCommand("formatBlock", false, key.toUpperCase());
                break;
            case key === "erase":
                if (str?.length > 0)
                    selection.deleteFromDocument();
                break;
            case key === "remove":
                refEditor.current.innerHTML = "";
                setValue(""); // 2026-10-25
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
                                            style={{ position: "relative" }}
                                            onClick={() => handleAction(item, index)}>
                                            {item?.icon}
                                            {item?.models && <>
                                                {openIndex === index ? <ArrowDropUp /> : <ArrowDropDown />}
                                                {openIndex === index && <div className="d-column jc-start editor-dropdown">
                                                    {item?.models?.map((m) => (
                                                        <Button
                                                            component="div" // 2026-10-25 - avoids <button> inside <button>
                                                            key={m}
                                                            value={m}
                                                            aria-label={m}
                                                            className="w-100"
                                                            onClick={() => handleChange(m)}>
                                                            {item?.colors ? <Square style={{ color: m }} /> : m}
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