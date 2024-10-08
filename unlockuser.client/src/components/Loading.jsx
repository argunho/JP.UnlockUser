import loading from '../assets/images/search.gif';

export default function Loading({img, msg }) {

  const loadText = msg || "sökning pågår."

  return (
    <div className='block-centered'>
      <img src={img ?? loading} className='loading' alt="loading" />
      {!!msg && <p>Var vänlig och vänta, {loadText}</p>}
    </div>
  )
}
