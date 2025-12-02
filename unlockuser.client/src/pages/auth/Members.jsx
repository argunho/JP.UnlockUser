import { useParams, useLoaderData, useOutletContext } from 'react-router-dom';

// Components
import Info from '../../components/blocks/Info';
import ResultView from '../../components/blocks/ResultView';

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
            <ResultView
                list={users}
                clsStudents={true}
                loading={loading}
                resultBlock={false}
            />
        </div>
    )
}

export default Members;