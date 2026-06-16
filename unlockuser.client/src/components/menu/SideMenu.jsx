import { useState, useRef } from 'react';

// Installed
import { Button } from '@mui/material';
import { Feed, MenuBook, DragIndicator } from '@mui/icons-material';

// Css
import './../../assets/css/side_menu.css';

function SideMenu({ label, list, disabled, clickHandle, sortable, onSortChange }) {

    const [activeIndex, setActiveIndex] = useState(0);
    const [items, setItems] = useState(list ?? []);
    const [prevList, setPrevList] = useState(list);
    const [prevSortable, setPrevSortable] = useState(sortable);
    const dragIndex = useRef(null);
    const latestItems = useRef(null);

    if (prevList !== list) {
        setPrevList(list);
        setItems(list ?? []);
    }

    // Reset drag state to original order each time sorting mode is turned on
    if (prevSortable !== sortable) {
        setPrevSortable(sortable);
        if (sortable) setItems(list ?? []);
    }

    const displayItems = (sortable ? items : list) ?? [];

    function onClick(index) {
        setActiveIndex(index);
        clickHandle(displayItems[index]);
    }

    function handleDragStart(index) {
        dragIndex.current = index;
        latestItems.current = null;
    }

    function handleDragOver(e, index) {
        e.preventDefault();
        if (dragIndex.current === index) return;
        const newItems = [...(latestItems.current ?? items)];
        const [moved] = newItems.splice(dragIndex.current, 1);
        newItems.splice(index, 0, moved);
        dragIndex.current = index;
        latestItems.current = newItems;
        setItems(newItems);
    }

    function handleDragEnd() {
        if (latestItems.current)
            onSortChange?.(latestItems.current);
        dragIndex.current = null;
        latestItems.current = null;
    }

    if (displayItems.length === 0)
        return null;

    return (
        <div className="d-column jc-start sm-wrapper">

            <h2 className="sm-label w-100 d-row jc-start">
                <MenuBook />
                {label}
            </h2>

            {displayItems.map((item, ind) => (
                <div
                    key={item?.id ?? item?.name ?? ind}
                    className="d-row w-100"
                    draggable={sortable && !disabled}
                    onDragStart={() => handleDragStart(ind)}
                    onDragOver={(e) => handleDragOver(e, ind)}
                    onDragEnd={handleDragEnd}
                >
                    {sortable && (
                        <DragIndicator style={{ color: 'var(--color-primary)', alignSelf: 'center', flexShrink: 0, cursor: 'grab' }} />
                    )}
                    <Button
                        color="primary"
                        variant="text"
                        className={`sm-btn w-100${activeIndex === ind ? " active" : ""}`}
                        onClick={() => onClick(ind)}
                        disabled={disabled}
                        startIcon={<Feed />}
                    >
                        <span className="sm-btn-label d-row jc-start">{item?.primary ?? item}</span>
                    </Button>
                </div>
            ))}
        </div>
    )
}

export default SideMenu;