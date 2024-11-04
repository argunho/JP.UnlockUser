
import { useEffect, useState } from 'react';

// Installed
import axios from 'axios';
import { useParams } from 'react-router-dom';

// Components
import Info from '../../components/Info';
import Result from '../../components/Result';

// Functions
import { ErrorHandle } from '../../functions/ErrorHandle';

// Services
import { TokenConfig } from '../../services/TokenConfig';
import ApiRequest from '../../services/ApiRequest';

function Members() {
    Members.displayName = "Members";

    const [list, setList] = useState(null);
    const [loading, setLoading] = useState(true);
    const [response, setResponse] = useState(null);

    const source = axios.CancelToken.source();

    const { department, office } = useParams();

    useEffect(() => {
        if (!list) getMembers();
    }, [list])

    const getMembers = async () => {

        // To authorize
        let _config = TokenConfig();
        _config.cancelToken = source.token;

        // API request
        await ApiRequest(`search/members/${department}/${office}`)
            .then(res => {
                // Response
                const { users, errorMessage } = res.data;

                // Update state parameters
                setList(users || []);
                setLoading(false);
                if (!users)
                    setResponse(res.data);

                // If something is wrong, view error message in browser console
                if (errorMessage) console.error("Error => " + errorMessage)
            }, error => {  // Error handle 
                setLoading(false);
                if (error.code === "ERR_CANCELED") {
                    this.source = axios.CancelToken.source().cancel();
                    setResponse(ErrorHandle(error));
                } else
                    ErrorHandle(error);
            });
    }

    return (
        <div className='interior-div'>
            {/* Info about user */}
            <Info name="Studenter"
                check={true}
                displayName={office + " " + department}
                subTitle={list?.length > 0 && `Hittade ${list?.length} matchningar`} />

            {/* Result of search */}
            <Result
                list={list}
                clsStudents={true}
                loading={loading}
                response={response}
                resultBlock={false}
            />
        </div>
    )
}

export default Members;