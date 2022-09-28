import React from 'react'

export default function Table({ names, list, cls = "" }) {

    const keys = list.length > 0 ? Object.keys(list[0]) : [];

    return (
        <table className={"table table-striped" + cls} id="list">
            <thead className='styled-thead'>
                <tr>
                    <th scope="col" style={{ textAlign: "center" }}>#</th>
                    {names.map((n, i) => (<th scope="col" key={i}>{n}</th>))}
                </tr>
            </thead>
            <tbody>
                {list.map((l, ind) => (
                    <tr key={ind}>
                        <th scope="row" style={{ textAlign: "center" }}>{ind + 1}</th>
                        <td>{l[keys[0]]}</td>
                        <td style={{ color: "#c00", width: "35%" }}>{l[keys[2]]}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
