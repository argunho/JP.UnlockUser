import axios from 'axios';
import React, { useEffect, useState } from 'react'
import Info from '../blocks/Info';
import Result from '../blocks/Result';
import TokenConfig from '../functions/TokenConfig';

export default function Members(props) {
    Members.displayName = "Members";

    const [list, setList] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [response, setResponse] = useState(null);
    const params = props.match.params;

    const source = axios.CancelToken.source();

    useEffect(() => {
        if (!list) getMembers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [list])

    const getMembers = async () => {

        // To authorize
        let _config = TokenConfig();
        _config.cancelToken = source.token;

        // API request
        await axios.get(`search/members/${params.department}/${params.office}`, _config)
            .then(res => {
                // Response
                const { users, errorMessage } = res.data;

                // Update state parameters
                setList(users || []);
                setIsLoading(false);
                if (!users)
                    setResponse(res.data);

                // If something is wrong, view error message in browser console
                if (errorMessage) console.error("Error => " + errorMessage)
            }, error => {
                // Error handle 
                setIsLoading(false);

                if (error?.response?.status === 401) {
                    setResponse({
                        msg: "Åtkomst nekad! Dina atkomstbehörigheter ska kontrolleras på nytt.",
                        alert: "error"
                    });
                    setTimeout(() => {
                        props.history.push("/");
                    }, 3000)
                } else if (error.code === "ERR_CANCELED") {
                    this.source = axios.CancelToken.source().cancel();
                    setResponse({
                        msg: error.message,
                        alert: "warning"
                    });
                } else
                    console.error("Error => " + error.response)
            });
    }

    return (
        <div className='interior-div'>
            {/* Info about user */}
            <Info name="Studenter"
                check={true}
                group={props.group}
                displayName={params.office + " " + params.department}
                subTitle={list?.length > 0 && `Hittade ${list.length} matchningar`} />

            {/* Result of search */}
            <Result
                list={list}
                clsStudents={true}
                isLoading={isLoading}
                response={response}
                resultBlock={false}
            />
        </div>
    )
}
