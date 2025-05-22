# 🐻 Zustand v5.0.4 -
## Table of Contents
1. [Introduction](#introduction)
2. [Core Concepts](#core-concepts)
3. [Basic to Advanced Usage](#basic-to-advanced-usage)
4. [Middleware System](#middleware-system)
5. [Performance Optimization](#performance-optimization)
6. [TypeScript Integration](#typescript-integration)
7. [Testing Strategies](#testing-strategies)
8. [Common Patterns](#common-patterns)
9. [Migration Guide](#migration-guide)
10. [Cheatsheet](#cheatsheet)

---

## Introduction

Zustand (German for "state") is a lightweight state management solution for React that combines:
- The simplicity of React's context API
- The power of Redux-like centralized stores
- The performance of atomic state libraries

```bash
npm install zustand
# or
yarn add zustand
```

---

## Core Concepts

### 1. Store Creation
```javascript
import { create } from 'zustand'

// Basic store with state and actions
const useCounterStore = create((set, get) => ({
  // State variables
  count: 0,
  
  // Actions to update state
  increment: () => set((state) => ({ count: state.count + 1 })),
  
  // Async action example
  asyncIncrement: async () => {
    await fetch('/increment')
    set({ count: get().count + 1 }) // Using get() to access current state
  },
  
  // Reset function
  reset: () => set({ count: 0 })
}))
```

### 2. Using the Store
```javascript
function Counter() {
  // Access entire store (not recommended for performance)
  // const { count, increment } = useCounterStore()
  
  // Better: Select specific values to optimize re-renders
  const count = useCounterStore(state => state.count)
  const increment = useCounterStore(state => state.increment)
  
  return (
    <div>
      <span>{count}</span>
      <button onClick={increment}>+</button>
    </div>
  )
}
```

### 3. Accessing Store Outside Components
```javascript
// Get current state (useful in event handlers, utils)
const currentCount = useCounterStore.getState().count

// Update state directly
useCounterStore.setState({ count: 10 })

// Subscribe to changes (returns unsubscribe function)
const unsubscribe = useCounterStore.subscribe(
  (newState, prevState) => {
    console.log('Count changed from', prevState.count, 'to', newState.count)
  },
  (state) => state.count // Optional selector to watch specific changes
)
```

---

## Basic to Advanced Usage

### 1. State Initialization with Props
```javascript
// Factory function pattern for reusable stores
const createCounterStore = (initialCount = 0) => create(() => ({
  count: initialCount
}))

// Usage in component
const useCounterStore = createCounterStore(10)
```

### 2. Derived State
```javascript
const useCartStore = create((set) => ({
  items: [],
  // Derived state using get() in the store
  total: () => get().items.reduce((sum, item) => sum + item.price, 0),
  
  // Or compute in component using selector
  // total: state.items.reduce(...)
}))

// Component usage
function CartTotal() {
  const total = useCartStore(state => state.total())
  // ...
}
```

### 3. Nested State Updates
```javascript
const useUserStore = create((set) => ({
  user: {
    name: 'John',
    profile: {
      age: 30,
      email: 'john@example.com'
    }
  },
  updateEmail: (newEmail) => set(state => ({
    user: {
      ...state.user,
      profile: {
        ...state.user.profile,
        email: newEmail
      }
    }
  }))
  
  // Alternative with immer middleware (see middleware section)
}))
```

### 4. Side Effects with Subscribe
```javascript
// Track authentication state changes
const useAuthStore = create(() => ({
  user: null,
  token: null
}))

// In your app initialization
useAuthStore.subscribe(
  (state) => {
    if (state.token) {
      // Set auth headers for API calls
      api.setAuthHeader(state.token)
    } else {
      api.clearAuthHeader()
    }
  },
  (state) => state.token // Only run when token changes
)
```

---

## Middleware System

Zustand's middleware are functions that wrap the store creation process.

### 1. Persist Middleware (LocalStorage)
```javascript
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
      clearToken: () => set({ token: null })
    }),
    {
      name: 'auth-storage', // Unique key for storage
      getStorage: () => localStorage, // or sessionStorage
      // Optional: Whitelist/blacklist certain keys
      partialize: (state) => ({ token: state.token }),
      // Optional: Migration for version changes
      version: 1,
      migrate: (persistedState, version) => {
        if (version === 0) {
          // Transform state from v0 to v1
          return { ...persistedState, newField: 'default' }
        }
        return persistedState
      }
    }
  )
)
```

### 2. Immer Middleware (Mutable Updates)
```javascript
import { immer } from 'zustand/middleware/immer'

const useTodosStore = create(
  immer((set) => ({
    todos: [],
    addTodo: (text) => set((state) => {
      // Can write mutable code that produces immutable updates
      state.todos.push({ id: Date.now(), text, completed: false })
    }),
    toggleTodo: (id) => set((state) => {
      const todo = state.todos.find(t => t.id === id)
      if (todo) todo.completed = !todo.completed
    })
  }))
)
```

### 3. DevTools Middleware
```javascript
import { devtools } from 'zustand/middleware'

const useStore = create(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 }))
    }),
    { 
      name: 'CounterStore', // Name for devtools
      enabled: process.env.NODE_ENV !== 'production' // Disable in prod
    }
  )
)
```

### 4. Custom Middleware
```javascript
// Logger middleware example
const logger = (config) => (set, get, api) => config((...args) => {
  console.log('Applying action:', args)
  const prevState = get()
  set(...args)
  console.log('New state:', get(), 'Prev state:', prevState)
}, get, api)

const useStore = create(logger((set) => ({
  // ...store config
})))
```

---

## Performance Optimization

### 1. Selective State Subscription
```javascript
// Bad: Re-renders when any store value changes
const { count, user } = useStore()

// Good: Only re-renders when count changes
const count = useStore(state => state.count)

// Good: Multiple values with shallow compare
import { shallow } from 'zustand/shallow'
const { count, user } = useStore(
  state => ({ count: state.count, user: state.user }),
  shallow // Performs shallow comparison
)
```

### 2. Memoizing Selectors
```javascript
import { useCallback } from 'react'

function UserProfile({ userId }) {
  // Memoize selector to prevent unnecessary recalculations
  const user = useStore(
    useCallback(
      (state) => state.users.find(u => u.id === userId),
      [userId] // Recreate only when userId changes
    )
  )
  // ...
}
```

### 3. Batch Updates
```javascript
const useStore = create((set) => ({
  user: null,
  profile: null,
  loading: false,
  fetchUser: async (id) => {
    set({ loading: true })
    try {
      const [user, profile] = await Promise.all([
        fetchUser(id),
        fetchProfile(id)
      ])
      // Single update to prevent multiple re-renders
      set({ user, profile, loading: false })
    } catch (error) {
      set({ loading: false, error })
    }
  }
}))
```

---

## TypeScript Integration

### 1. Basic Typing
```typescript
interface CounterState {
  count: number
  increment: () => void
  decrement: () => void
}

const useCounterStore = create<CounterState>()((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 }))
}))
```

### 2. Slices Pattern with Types
```typescript
// Define separate slices
interface UserSlice {
  user: User | null
  setUser: (user: User) => void
  clearUser: () => void
}

interface CartSlice {
  items: CartItem[]
  addItem: (item: CartItem) => void
}

// Combined store type
type StoreState = UserSlice & CartSlice

// Create individual slices
const createUserSlice = (set): UserSlice => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null })
})

const createCartSlice = (set): CartSlice => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] }))
})

// Combined store
const useStore = create<StoreState>()((...a) => ({
  ...createUserSlice(...a),
  ...createCartSlice(...a)
}))
```

### 3. Type-Safe Middleware
```typescript
import { StateCreator } from 'zustand'

// Type for our middleware
type LoggerMiddleware = <T>(
  config: StateCreator<T>
) => StateCreator<T>

const logger: LoggerMiddleware = (config) => (set, get, api) => 
  config((...args) => {
    console.log('Applying', args)
    set(...args)
    console.log('New State', get())
  }, get, api)

// Usage
const useStore = create<CounterState>()(
  logger((set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 }))
  }))
)
```

---

## Testing Strategies

### 1. Unit Testing Stores
```javascript
import { act } from '@testing-library/react'
import create from 'zustand'

test('counter store', () => {
  const useStore = create(() => ({
    count: 0,
    increment: () => set(state => ({ count: state.count + 1 }))
  }))
  
  // Test initial state
  expect(useStore.getState().count).toBe(0)
  
  // Test action
  act(() => {
    useStore.getState().increment()
  })
  
  expect(useStore.getState().count).toBe(1)
})
```

### 2. Testing Components
```javascript
import { renderHook } from '@testing-library/react-hooks'

test('component using store', () => {
  // Mock the store
  useCounterStore.setState({ count: 10 })
  
  const { result } = renderHook(() => useCounterStore())
  expect(result.current.count).toBe(10)
})
```

### 3. Integration Testing
```javascript
beforeEach(() => {
  // Reset all stores before each test
  useCounterStore.setState({ count: 0 }, true)
  useAuthStore.setState({ user: null }, true)
})
```

---

## Common Patterns

### 1. Auth Store (Industry Standard)
```typescript
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (credentials: LoginPayload) => Promise<void>
  logout: () => void
  initialize: () => Promise<void>
}

const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  
  login: async ({ email, password }) => {
    try {
      const { user, token } = await authService.login(email, password)
      set({ user, token, isAuthenticated: true })
      localStorage.setItem('auth_token', token)
    } catch (error) {
      set({ user: null, token: null, isAuthenticated: false })
      throw error
    }
  },
  
  logout: () => {
    localStorage.removeItem('auth_token')
    set({ user: null, token: null, isAuthenticated: false })
  },
  
  initialize: async () => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      try {
        const user = await authService.me(token)
        set({ user, token, isAuthenticated: true })
      } catch {
        get().logout()
      }
    }
  }
}))
```

### 2. Theme Store with System Preference
```typescript
type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: typeof window !== 'undefined' 
        ? window.matchMedia('(prefers-color-scheme: dark)').matches 
          ? 'dark' 
          : 'light'
        : 'light',
      setTheme: (theme) => {
        const resolved = theme === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : theme
        set({ theme, resolvedTheme: resolved })
        document.documentElement.classList.toggle('dark', resolved === 'dark')
      }
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setTheme(state.theme)
        }
      }
    }
  )
)
```

### 3. API Loading States
```typescript
interface ApiState<T> {
  data: T | null
  error: string | null
  loading: boolean
  fetch: () => Promise<void>
  reset: () => void
}

function createApiStore<T>(fetcher: () => Promise<T>) {
  return create<ApiState<T>>()((set) => ({
    data: null,
    error: null,
    loading: false,
    fetch: async () => {
      set({ loading: true, error: null })
      try {
        const data = await fetcher()
        set({ data, loading: false })
      } catch (err) {
        set({ error: err.message, loading: false })
      }
    },
    reset: () => set({ data: null, error: null, loading: false })
  }))
}

// Usage
const useProductsStore = createApiStore(productService.getProducts)
```

---

## Migration Guide

### From Redux to Zustand

1. **Convert Reducers to Stores**:
   ```javascript
   // Redux
   const counterReducer = (state = 0, action) => {
     switch(action.type) {
       case 'INCREMENT': return state + 1
       default: return state
     }
   }
   
   // Zustand
   const useCounterStore = create(set => ({
     count: 0,
     increment: () => set(state => ({ count: state.count + 1 }))
   }))
   ```

2. **Replace connect() with Hooks**:
   ```javascript
   // Redux
   const mapState = state => ({ count: state.count })
   export default connect(mapState)(Counter)
   
   // Zustand
   export default function Counter() {
     const count = useCounterStore(state => state.count)
     // ...
   }
   ```

3. **Middleware Replacement**:
   - Redux Thunk → Native async actions
   - Redux Saga → Separate hook or context
   - Redux Persist → Zustand persist middleware

---

## Cheatsheet 🚀

### Store Creation
```typescript
const useStore = create<State>()((set, get) => ({
  // State
  value: initialValue,
  
  // Actions
  setValue: (newValue) => set({ value: newValue }),
  
  // Async action
  fetchData: async () => {
    set({ loading: true })
    const data = await api.fetch()
    set({ data, loading: false })
  },
  
  // Computed values
  get doubled() {
    return get().value * 2
  }
}))
```

### Middleware Composition
```typescript
const useStore = create<State>()(
  compose(
    devtools,
    persist,
    immer
  )((set) => ({
    // Store config
  }))
)
```

### Performance Patterns
```typescript
// Single value select
const value = useStore(state => state.value)

// Multiple values with shallow compare
const { a, b } = useStore(
  state => ({ a: state.a, b: state.b }),
  shallow
)

// Memoized selector for expensive computations
const expensiveValue = useStore(
  useCallback(state => compute(state.data), [])
)
```

### Utility Functions
```typescript
// Get current state (outside components)
const state = useStore.getState()

// Set state directly
useStore.setState(newState)

// Subscribe to changes
const unsubscribe = useStore.subscribe(
  (newState, prevState) => console.log('State changed'),
  state => state.value // Optional selector
)

// Destroy store
useStore.destroy()
```

---

## Final Thoughts

Zustand v5.0.4 provides a perfect balance for state management:
- ✅ **Simple** for small apps
- ✅ **Scalable** for large applications
- ✅ **Flexible** middleware system
- ✅ **Excellent TypeScript** support
- ✅ **High performance** out of the box

Adoption path:
1. Start with basic stores
2. Add TypeScript for safety
3. Introduce middleware as needed
4. Split into slices when growing
5. Optimize with selectors for performance

Remember: Zustand works great alongside React context for component-scoped state and doesn't require you to rewrite everything at once!