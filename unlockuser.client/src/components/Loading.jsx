/* eslint-disable no-undef */
export default function Loading({ img, msg }) {

  const loadImage = img || "search.gif";
  const loadText = msg || "sökning pågår."

  return (
    <div className='block-centered'>
      <img src={loadImage} className='loading' alt="loading" />
      {!!msg && <p>Var vänlig och vänta, {loadText}</p>}
    </div>
  )
}
