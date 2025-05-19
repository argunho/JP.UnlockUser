
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

// Components
import Info from '../../components/Info';
import Result from '../../components/Result';

// Functions
import { ErrorHandle } from '../../functions/ErrorHandle';

// Services
import ApiRequest, { CancelRequest } from '../../services/ApiRequest';

function Members({ navigate }) {
    Members.displayName = "Members";

    const [list, setList] = useState(null);
    const [loading, setLoading] = useState(true);
    const [response, setResponse] = useState(null);

    const { department, office } = useParams();

    useEffect(() => {
        if (!list) getMembers();
    }, [list])

    const getMembers = async () => {
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
                    CancelRequest()
                    setResponse(ErrorHandle(error));
                } else
                    ErrorHandle(error);
            });
    }

    return (
        <div className='interior-div'>
            {/* Info about user */}
            <Info name="Studenter"
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