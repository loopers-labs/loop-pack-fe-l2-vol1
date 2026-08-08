declare module '*.css' {
  const classNames: Readonly<Record<string, string>>

  export default classNames
}
