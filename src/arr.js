// Misc
export const last = as => as[as.length - 1]
export const lastN = (n, as) => as.slice(as.length - n)
export const range = n => [...Array(n).keys()]

// Functor
export const map = f => as => as.map(f)

// Chain
export const join = as => as.reduce((a, b) => [...a, ...b], [])
export const chain = f => as => as.reduce((p, c) => [...p, ...f(c)], [])
