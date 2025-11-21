import { useParams, useLoaderData, useOutletContext } from 'react-router-dom';

// Components
import Info from '../../components/Info';
import Result from '../../components/Result';

function Members() {

    const { department, office } = useParams();
    const { users } = useLoaderData() ?? {};
    const { loading } = useOutletContext() ?? {};

    return (
        <div className='interior-div'>
            {/* Info about user */}
            <Info name="Studenter"
                displayName={office + " " + department}
                subTitle={users?.length > 0 && `Hittade ${users?.length} matchningar`} />

            {/* Result of search */}
            <Result
                list={users}
                clsStudents={true}
                loading={loading}
                resultBlock={false}
            />
        </div>
    )
}

export default Members;