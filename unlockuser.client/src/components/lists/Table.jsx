function Table({ columns, rows, list }) {

    return (
        <table className="preview-container w-100" id="list">
            <thead className='preview-wrapper columns w-100'>
                <tr className="d-row w-100">
                    <th className="number">#</th>
                    {columns.map((column) => (<th className="d-row jc-start w-100" key={column}>{column}</th>))}
                </tr>
            </thead>
            <tbody className="preview-wrapper rows w-100">
                {list.map((item, ind) => (
                    <tr key={ind} className="d-row w-100">
                        <th className="number">{ind + 1}</th>
                        {rows.map((row) => {
                            return <td
                                key={row}
                                className="d-row jc-start w-100"
                                style={row === "password" ? { color: "#c00" } : undefined}>
                                {item[row]}
                            </td>
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

export default Table;