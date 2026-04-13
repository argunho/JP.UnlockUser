import { useRef, useEffect, useState } from 'react';

// Installed
import { Box, InputLabel, Button, ToggleButtonGroup, Tooltip, ToggleButton, ClickAwayListener } from '@mui/material';
import {
    Clear, DeleteSweep, FormatAlignCenter, FormatAlignJustify, FormatAlignLeft, FormatAlignRight, FormatBold, FormatClear, Title, FormatSize,
    FormatItalic, FormatListBulleted, FormatListNumbered, ImageSearch, Image, Compare, FormatStrikethrough, FormatColorText, Square, FormatColorFill,
    FormatUnderlined, Link, ArrowDropDown, ArrowDropUp
} from '@mui/icons-material';

// Components

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
    { cmd: "backColor", icon: <FormatColorFill color="primary" />, color: "primary", tip: "Bakgrund färg", models: colorCodes, skip: true, colors: true },
    { cmd: "foreColor", icon: <FormatColorText color="secondary" />, color: "secondary", tip: "Text färg", models: colorCodes, skip: true, colors: true },
    { cmd: "image", icon: <Image color="info" />, color: "info", tip: "Bild 100% i bred", width: "100%", },
    { cmd: "image", icon: <Compare color="inherit" />, color: "inherit", tip: "Bild 50% i bred", width: "50%" },
    { cmd: "image", icon: <ImageSearch color="secondary" />, color: "secondary", tip: "Bild max 300px i bred och zoombar", width: "300px" },
    { cmd: "createLink", key: "a", icon: <Link color="success" />, color: "success", tip: "Länk" },
    { cmd: "clear", icon: <FormatClear color="inherit" />, color: "inherit", tip: "Rensa från formatering", skip: true },
    { cmd: "erase", icon: <Clear color="warning" />, color: "warning", tip: "Radera markerad text", skip: true },
    { cmd: "remove", icon: <DeleteSweep color="error" />, color: "error", tip: "Redera hela text", skip: true }
];

function Editor({ label = "Text", name = "text", defaultValue, required, disabled: pending, onSave, onCancel, ref }) {

    const [value, setValue] = useState(defaultValue ?? "");
    const [colorCommand, setColorCommand] = useState(null);
    // const [formats, setFormats] = useState([]);
    const [openIndex, setOpenIndex] = useState(-1);
    const [imageWidth, setImageWidth] = useState(null)

    const refEditor = useRef(null);
    const refUpload = useRef();

    useEffect(() => {
        if (defaultValue)
            refEditor.current.innerHTML = defaultValue;
    }, [defaultValue])

    function cleanHtml(html) {
        if (html === null || html === "") return;
        console.log("html", html)
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        html = html.replaceAll("<div><p></p></div>", "<br/>").replaceAll("<p></p>", "<br/>");

        // Remove empty divs, spans, etc.
        doc.querySelectorAll('*').forEach(el => {
            const isEmpty =
                el.innerHTML.trim() === '' &&
                el.tagName !== 'BR';

            if (isEmpty) {
                el.remove();
            }
        });

        // Replace empty <p> with <br>

        // doc.querySelectorAll('p').forEach(p => {
        //     const text = p.textContent.replace(/\u00A0/g, '').trim(); // handles &nbsp;

        //     if (!text && p.querySelectorAll('img,video,iframe').length === 0) {
        //         p.replaceWith(document.createElement('br'));
        //     }
        // });

        return doc.body.innerHTML;
    }

    function saveItem() {
        const htmlValue = refEditor.current?.innerHTML?.replaceAll(/<span id="transmark"[^>]*><\/span>/g, "");
        if (htmlValue == null || htmlValue?.length === 0)
            return;

        refEditor.current.innerHTML = "";
        onSave?.(cleanHtml(htmlValue));
        setValue(null);
    }

    function onChange(e) {
        e.preventDefault();
        let htmlValue = e.target?.innerHTML;
        console.log(htmlValue)
        let value = htmlValue?.replaceAll(/<span id="transmark"[^>]*><\/span>/g, "");

        if (!value || value === "<br/>" || value === "<br>")
            value = "";

        setValue(value);
    }

    function onPaste(e) {
        e.preventDefault();

        const html =
            e.clipboardData.getData("text/html") ||
            e.clipboardData.getData("text/plain");

        // Insert HTML into cursor position
        document.execCommand("insertHTML", false, html);

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
        };


        function alignSelection(alignment) {
            if (!str) return false;

            const range = selection.getRangeAt(0);
            let el = range.startContainer;

            // Move up to element node
            if (el.nodeType === 3) el = el.parentElement;

            // Find closest block
            let block = el.closest("p, div, h1, h2, h3, h4, h5, h6, li");

            if (block) {
                block.style.textAlign = alignment;
                block.style.width = "100%";
                return true;
            }

            return false;
        }

        switch (true) {
            case ["justifyLeft", "justifyCenter", "justifyRight", "justifyFull"].includes(key):
                if (!alignSelection(key.replace("justify", "").toLowerCase())) {
                    console.log(key)
                    document.execCommand(key);
                }
                // refEditor.current.style.textAlign = key;
                break;
            case key === "createLink":
                if (str) {
                    let url = prompt("Skriva din län här: ", "https://");
                    document.execCommand(key, false, url);
                }
                break;
            case sizes.includes(key):
                if (key) applyFontSizePx(Number(key))
                break;
            case colorCodes.includes(key):
                document.execCommand(colorCommand, false, key);
                break;
            case key === "image":
                refUpload?.current?.click();
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
                if (defaultValue && onCancel)
                    onCancel();
                // setFormats([]);
                break;
            case key === "clear":
                refEditor.current.innerHTML = refEditor.current.innerText;
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
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target.result;
                const imgTag = imageWidth === 300
                    ? `<img src="${base64}" style="max-width:${imageWidth};display:block;object-fit:contain;margin:8px 0;" />`
                    : `<div class="zoomable-img-wrap" style="max-width:${imageWidth}">
                                    <img src="${base64}" width="100%" style="display:block;" tabindex="0"/></div>`;

                document.execCommand("insertHTML", false, imgTag);
                // document.execCommand("insertImage", false, e.target.result);
            }
            reader.readAsDataURL(file); // Base64 image
        }
    }

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
                                            {...(!item?.skip ? { value: item } : null)}
                                            aria-label={item?.cmd}
                                            style={{ position: "relative" }}
                                            onClick={() => handleAction(item, index)}>
                                            {item?.icon}
                                            {item?.models && <>
                                                {openIndex === index ? <ArrowDropUp /> : <ArrowDropDown />}
                                                {openIndex === index && <div className="d-column jc-start editor-dropdown">
                                                    {item?.models?.map((m) => (
                                                        <Button
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

                    {/* Editor */}
                    <div className="editor-wrapper">
                        {/* Textarea */}
                        <div
                            ref={refEditor}
                            role="textbox"
                            aria-multiline="true"
                            contentEditable={!pending}
                            data-placeholder="Start typing..."
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
            {!onSave && <input type="hidden" name={name} value={cleanHtml(value)} />}

            {/* Image input */}
            <input type="file" accept="image/*" name="file" onChange={onFileChange} className="none" ref={refUpload} />
        </>
    )
}

export default Editor;