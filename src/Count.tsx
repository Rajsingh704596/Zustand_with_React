import { useCountStore } from "./store/store"


const Count = () => {

    // const count=useCountStore((state)=>state.count);
    // const increment=useCountStore((state)=>state.increment);
    // const decrement=useCountStore((state)=>state.decrement);
    // const reset= useCountStore((state)=> state.reset);

    const{count, increment, decrement ,reset}=useCountStore();

  return (
    <div>
         <h1>Counter App</h1>
      
         <br />
        <h2>{count}</h2>
        <button onClick={increment}>Increment</button>
        <button onClick={decrement}>Decrement</button>
        <button onClick={reset}>Reset </button>
    </div>

  )
}

export default Count