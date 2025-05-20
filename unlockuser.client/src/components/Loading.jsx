import loading from '../assets/images/search.gif';

export default function Loading({img, msg }) {

  return (
    <div className='block-centered d-column mh'>
      <img src={img ?? loading} className='loading' alt="loading" />
      <p>Var vänlig och vänta, {msg || "sökning pågår."}</p>
    </div>
  )
}
