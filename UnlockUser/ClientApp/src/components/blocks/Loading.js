import React from 'react'

export default function Loading({ img, msg, src }) {

  const loadImage = img || "search.gif";
  const loadText = msg || "sökning pågår."

  return (
    <div className='block-centered'>
      <img src={src ? src : require(`./../../images/${loadImage}`)} className='loading' alt="loading" />
      <p>Var vänlig och vänta, {loadText}</p>
    </div>
  )
}
