import React,{ useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
   <React.Fragment>
    <h1 className='bg-red-500'>hello</h1>
    <p>{count}</p>
   </React.Fragment>
  )
}

export default App
