// Installed 
import { useOutletContext, useLoaderData } from 'react-router-dom';

// Components
import ListView from './ListView';
import TabMenu from './TabMenu';

// Services
import { ApiRequest } from '../services/ApiRequest';

// eslint-disable-next-line react-refresh/only-export-components
export async function loadItems({ params }) {
  if (!params?.id) return null;
  const res = await ApiRequest(`search/assets/by/${params?.id}`);
  return res;
}

function ListsView() {

  const res = useLoaderData("assets-by-id");
  const props = useOutletContext();

  return (
    <div className="v-view d-column jc-start w-100" id="v-view">

      <div className="v-sm-label w-100">
        {/* Tab panel */}
        <TabMenu
          primary={res?.data?.primary ?? "Ej definerad"}
          secondary={res?.data?.secondary ?? ""}
        />

      </div>

      <ListView
        {...props}
        list={res?.list}
      />

    </div>
  )
}

export default ListsView;

// <ListView {... props} />