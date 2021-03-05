const genToken = (length: number = 6): string => {
    return Array(length)
        .fill(null)
        .map((_) => {
            return Math.floor(Math.random() * 36).toString(36)
        })
        .map((c) => {
            return Math.random() > 0.5 ? c.toLowerCase() : c.toUpperCase()
        })
        .join('')
}

export { genToken }
