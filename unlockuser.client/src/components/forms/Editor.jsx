import { useRef, useEffect, useState } from 'react';

// Installed
import { AppBar, Box, IconButton, InputLabel, Tooltip, Button } from '@mui/material';
import {
    Clear, DeleteSweep, FormatAlignCenter, FormatAlignJustify, FormatAlignLeft, FormatAlignRight, FormatBold, FormatClear,
    FormatItalic, FormatListBulleted, FormatListNumbered, Image, Compare, FormatStrikethrough, FormatColorText, Square, Close, FormatColorFill,
    FormatUnderlined, Link
} from '@mui/icons-material';

// Components

// Css
import './../../assets/css/editor.css';

const colors = {
    white: "#FFFFFF",
    black: "#000000",
    red: "#FF0000",
    green: "#00FF00",
    blue: "#0000FF",
    yellow: "#FFFF00",
    cyan: "#00FFFF",
    magenta: "#FF00FF",
    gray: "#808080",
    lightGray: "#D3D3D3",
    orange: "#FFA500",
    pink: "#FFC0CB",
    purple: "#800080",
    brown: "#A52A2A",
    navy: "#000080",
    teal: "#008080",
    lime: "#00FF00",
    olive: "#808000",
    maroon: "#800000",
    coral: "#FF7F50"
}

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
    { cmd: "left", icon: <FormatAlignLeft /> },
    { cmd: "center", icon: <FormatAlignCenter /> },
    { cmd: "right", icon: <FormatAlignRight /> },
    { cmd: "justify", icon: <FormatAlignJustify /> },
    { cmd: "insertOrderedList", key: "ol", icon: <FormatListNumbered /> },
    { cmd: "insertUnorderedList", key: "ul", icon: <FormatListBulleted /> },
    { cmd: "backColor", icon: <FormatColorFill />, color: "primary", title: "Bakgrund färg", sub: colors },
    { cmd: "foreColor", icon: <FormatColorText />, color: "secondary", title: "Text färg", sub: colors },
    { cmd: "image", color: "info", icon: <Image />, title: "Bild 100% i bred", width: "100%", clickKey: "image" },
    { cmd: "image", color: "inherit", icon: <Compare />, title: "Bild 50% i bred", width: "50%", clickKey: "image" },
    { cmd: "createLink", key: "a", icon: <Link />, color: "success", title: "Länk" },
    { cmd: "clear", icon: <FormatClear />, color: "inherit", title: "Rensa från formatering" },
    { cmd: "erase", icon: <Clear />, color: "warning", title: "Radera markerad text" },
    { cmd: "remove", icon: <DeleteSweep />, color: "error", title: "Redera hela text" }
];

function Editor({ label = "Text", name = "text", defaultValue, required, disabled: pending, onSave, onCancel, ref }) {

    const [value, setValue] = useState(defaultValue ?? "");
    const [sub, setSub] = useState();
    const [action, setAction] = useState();

    const refEditor = useRef(null);
    const refUpload = useRef();

    useEffect(() => {
        if (defaultValue)
            refEditor.current.innerHTML = defaultValue;
    }, [defaultValue])

    function saveItem() {
        const htmlValue = refEditor.current?.innerHTML?.replaceAll(/<span id="transmark"[^>]*><\/span>/g, "");
        if (htmlValue == null || htmlValue?.length === 0)
            return;

        refEditor.current.innerHTML = "";
        onSave?.(htmlValue);
        setValue(null);
    }

    function onChange(e) {
        e.preventDefault();
        let htmlValue = e.target?.innerHTML;
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


    function clickHandle(key) {
        switch (key) {
            case "image":
                refUpload?.current?.click();
                break;
            default:
                break;
        }
    }

    // Action buttons handle
    function handleChange(key) {
        if (sub)
            setSub();
        let selection = window.getSelection();
        let str = selection?.toString() ?? null;

        switch (key) {
            case "left":
            case "center":
            case "right":
            case "justify":
                refEditor.current.style.textAlign = key;
                break;
            case "createLink":
                if (str) {
                    let url = prompt("Skriva din län här: ", "https://");
                    document.execCommand(key, false, url);
                }
                break;
            case "white":
            case "black":
            case "red":
            case "green":
            case "blue":
            case "yellow":
            case "cyan":
            case "magenta":
            case "gray":
            case "lightGray":
            case "orange":
            case "pink":
            case "purple":
            case "brown":
            case "navy":
            case "teal":
            case "lime":
            case "olive":
            case "maroon":
            case "coral":
                if (sub && str?.length > 0)
                    document.execCommand(sub?.cmd, false, colors[key]);
                break;
            case "erase":
                if (str?.length > 0)
                    selection.deleteFromDocument();
                break;
            case "remove":
                refEditor.current.innerHTML = "";
                if (defaultValue && onCancel)
                    onCancel();
                break;
            case "clear":
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
                const imgTag = `<img src="${base64}" style="max-width:${action?.width};height:auto;border-radius:8px;display:block;object-fit:contain;margin:8px 0;" />`;

                document.execCommand("insertHTML", false, imgTag);
                // document.execCommand("insertImage", false, e.target.result);
            }
            reader.readAsDataURL(file); // Base64 image
        }
    }

    function handleAction(item) {
        refEditor.current?.focus();
        if (item?.clickKey) {
            clickHandle(item?.clickKey);
            setAction(item);
        }
        else if (item?.sub) {
            setSub(item);
            setAction(item);
        }
        else
            handleChange(item?.cmd);
    }

    return (
        <>
            <div className="w-100" ref={ref}>
                <InputLabel className='editor-label' required={required}>{label ?? "TextEditor"}</InputLabel>
                <Box className='w-100 editor-container'>
                    <AppBar position='static' variant='elevation' color='default' className='d-row ai-start editor-tools-panel w-100'>
                        <div className={`d-row ai-start${sub ? " view-wrapper" : ""}`}>
                            {/* Primary actions */}
                            {!sub && buttons?.map((b, ind) => {
                                return <Tooltip key={ind} title={b?.title ?? ""}
                                    classes={{
                                        tooltip: "tooltip-default",
                                    }}
                                    PopperProps={{
                                        sx: {
                                            '& .MuiTooltip-tooltip': {
                                                backgroundColor: colorsTooltip[b?.color]
                                            },
                                            '& .MuiTooltip-arrow': {
                                                color: colorsTooltip[b?.color]
                                            }
                                        }
                                    }}
                                    placement="right"
                                    disableHoverListener={!b?.title}
                                    enterDelay={1000}
                                    leaveDelay={0}
                                    arrow>
                                    <IconButton
                                        key={ind}
                                        type="button"
                                        color={b?.color ?? "inherit"}
                                        onClick={() => handleAction(b)}>
                                        {b.icon}
                                    </IconButton>
                                </Tooltip>;
                            })}

                            {/* Secondary actions, sub action of primary actions */}
                            {sub && <>
                                {Object.keys(sub?.sub)?.map((key, ind) => {
                                    return <IconButton
                                        key={ind}
                                        type="button"
                                        style={{ color: colors[key] }}
                                        onClick={() => handleChange(key)}>
                                        <Square />
                                    </IconButton>;
                                })}
                                <IconButton color="error" type="button" onClick={() => setSub()}>
                                    <Close />
                                </IconButton>
                            </>}
                        </div>
                    </AppBar>

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
            {!onSave && <input type="hidden" name={name} value={value} />}

            {/* Image input */}
            <input type="file" accept="image/*" name="file" onChange={onFileChange} className="none" ref={refUpload} />
        </>
    )
}

export default Editor;