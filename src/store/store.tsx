import { create } from 'zustand'

type State = {
  count: number
  
}

type Actions = {
  increment:()=>void
  decrement:()=>void
  reset:()=>void
  
  incrementQty: (qty: number) => void
  decrementQty: (qty: number) => void
  
}

//store create using create method
export const useCountStore = create<State & Actions>((set) => ({              //set parameter receive , with the help of set we change the state value
  count: 0,
  //^ action define

  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset:()=> set({count:0}),

  incrementQty: (qty: number) => set((state) => ({ count: state.count + qty })),
  decrementQty: (qty: number) => set((state) => ({ count: state.count - qty }))
}))
