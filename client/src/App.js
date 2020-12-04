import React, { useState } from 'react'
import axios from 'axios'

const App = () => {
  const [ isLoggedIn, setIsLoggedIn ] = useState(false)
  const [ username, setUsername ] = useState('')
  const [ todos, setTodos ] = useState([])

const login = e => {
  e.preventDefault()
  axios.post('http://localhost:4000/login', {user: username}, {withCredentials: true}).then(response => {
    if(response.data.error === 'Not a user') return alert('Not a user')
    // saving refresh token in local storage while access token is saved as http only cookie
    localStorage.setItem('r-token', response.data.refreshToken)
    setIsLoggedIn(true)
  }).catch(err => {
    alert('encountered some error')
    console.log(err)
  })
}

  const fetchTodos = async () => {
    try {
      // fetching data with the access token 
      let {data} = await axios.get('http://localhost:4000/fetchtodos', {withCredentials: true})
      if(data.error === `ERROR`){
        // if access token was expired then we hit a new end point to get a new access token by sending refresh token as bearer header
        const {data} = await axios.post('http://localhost:4000/refresh', null, {headers:{
          'x-auth-token': `Bearer ${localStorage.getItem('r-token')}`
        }, withCredentials: true})
        if(data.error === 'LOGIN_AGAIN'){
          // if refresh token was itself expired then informing user to login again
          alert('Login Again')
          setIsLoggedIn(false)
          return
        }
        // if we got the newly access token back then we again try to fetch todos
        await fetchTodos()
      } else {
        setTodos(data.ToDos)
      }
    } catch (error) {
      alert('encountered some error')
      console.log(error)
    }
  }

  return (
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}} >
      {isLoggedIn ? <Todos name={username} fetchTodos={fetchTodos} todos={todos} /> : <Login username={username} setUsername={setUsername} login={login}/>}
    </div>
  )
}
const Login = ({username, setUsername, login}) => {
  return (
    <form onSubmit={login}>
      <input style={{margin: '5px'}} type='text' placeholder='enter username' value={username} onChange={e=>setUsername(e.target.value)} />
      <button>Login</button>
    </form>
  )
}

const Todos = ({todos, fetchTodos, name}) => {
  const styling = {
    display: 'flex',
    justifyContent: 'space-between',
    margin: '10px'
  }
  return (
    <div>
      <h2>Logged in as {name}</h2>
      {todos.length === 0 && <button onClick={fetchTodos}>Fetch ToDo's</button>}      
      <div style={styling} ><span style={{fontSize: '20px'}} >Your ToDos</span> <button onClick={fetchTodos} >Refresh</button></div>
      <ul>
        {todos.map((e, i) => <li key={i}>{e.todo}</li> )}
      </ul>
    </div>
  )
}

export default App;
