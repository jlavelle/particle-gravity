export const pipe = fs => fs.reduce((g, f) => a => f(g(a)))
