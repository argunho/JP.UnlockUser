import { useState, useEffect } from 'react';

// Installed
import { Pagination as Pagination, Button } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';


function usePagination({ length, loading, number = null, link = null }) {
        const initialValue = number ?? 10;
        const { num } = useParams();
        const navigate = useNavigate();

        const [perPage, setPerPage] = useState(initialValue);
        const [page, setPage] = useState(0);

        useEffect(() => {
                if (page === parseInt(num))
                        switchPage(1);
                        else
                        setPage(num ? parseInt(num) : 1);
        }, [length])

        function clickHandle() {
                setPage(1);
                
                setPerPage(length === perPage ? initialValue : length);
                if (link)
                        navigate(link, { replace: true });
        }

        function switchPage(value) {
                setPage(value)
                if (link)
                        navigate(`${link}/${value}`, { replace: true });
        }

        const content = <div className="d-row pagination jc-between w-100">
                <Button disabled endIcon={length?.toString()}> Antal </Button>
                <div className="d-row">
                        {/* Button to view all list */}
                        {(length > perPage || perPage !== initialValue) && <Button
                                color={perPage === initialValue ? "success" : "error"}
                                onClick={clickHandle}
                                endIcon={perPage === initialValue ? length : null}>
                                {length > perPage ? "Visa alla" : "Återställa"}
                        </Button>}

                        {/* Pagination */}
                        <Pagination count={length > 0 ? Math.ceil(length / perPage) : 1} color="success"
                                disabled={length <= perPage || loading}
                                page={page} onChange={(e, value) => switchPage(value)}
                                shape="rounded" />
                </div>
        </div>

        return {
                content, page, perPage, setPage
        }
}

export default usePagination;
