import { useState,useEffect } from "react";
import { useCountStore } from "./store/store"

//^3  we can directly access state value using .getState() method
const fn=()=>{
  const count=useCountStore.getState().count;
  console.log("count value is:",count);
}


const Count = () => {
  
   //^ 1 st way to get state 
    // const count=useCountStore((state)=>state.count);
    // const increment=useCountStore((state)=>state.increment);
    // const decrement=useCountStore((state)=>state.decrement);
    // const reset= useCountStore((state)=> state.reset);

    //^ 2nd way
    const{count, increment, decrement ,reset , incrementQty , decrementQty}=useCountStore();

    const[qty, setQty]=useState<number>();

    const handleChange=(e:React.ChangeEvent<HTMLInputElement>)=>{
     setQty(parseInt(e.target.value));
    }


     useEffect(()=>{
    fn();  //fn fun call when component mount first time
    },[count])

  return (
    <div>
         <h1>Counter App</h1>
         <input type="number" onChange={handleChange} value={qty} placeholder="enter quantity for change" />
         <br />
        <h2>{count}</h2>
        {
          qty ? <button onClick={()=>incrementQty(qty)}> Increment with quantity</button> : <button onClick={increment}>Increment</button>
        }
        {
          qty ? <button onClick={()=>decrementQty(qty)}> Decrement with quantity</button> : <button onClick={decrement}>Decrement</button>
        }
        <button onClick={reset}>Reset </button>
    </div>

  )
}

export default Count